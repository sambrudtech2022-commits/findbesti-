import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- CRC32 (IEEE) pure implementation ----
const CRC32_TABLE = new Int32Array(256);
(function () {
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
    }
    CRC32_TABLE[i] = c;
  }
})();

function crc32(str: string): number {
  const bytes = new TextEncoder().encode(str);
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

// ---- ByteBuf (little-endian binary packer) ----
class ByteBuf {
  buffer: DataView;
  uint8: Uint8Array;
  position: number;

  constructor(size = 1024) {
    const ab = new ArrayBuffer(size);
    this.buffer = new DataView(ab);
    this.uint8 = new Uint8Array(ab);
    this.position = 0;
  }

  pack(): Uint8Array {
    return this.uint8.slice(0, this.position);
  }

  putUint16(v: number) {
    this.buffer.setUint16(this.position, v, true);
    this.position += 2;
    return this;
  }

  putUint32(v: number) {
    this.buffer.setUint32(this.position, v, true);
    this.position += 4;
    return this;
  }

  putBytes(bytes: Uint8Array) {
    this.putUint16(bytes.length);
    this.uint8.set(bytes, this.position);
    this.position += bytes.length;
    return this;
  }

  putString(str: string) {
    return this.putBytes(new TextEncoder().encode(str));
  }

  putRawBytes(bytes: Uint8Array) {
    this.uint8.set(bytes, this.position);
    this.position += bytes.length;
    return this;
  }

  putTreeMapUInt32(map: Record<number, number>) {
    const keys = Object.keys(map);
    this.putUint16(keys.length);
    for (const key of keys) {
      this.putUint16(Number(key));
      this.putUint32(map[Number(key)]);
    }
    return this;
  }
}

// ---- HMAC-SHA256 using Web Crypto API ----
async function encodeHMac(key: string, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, message);
  return new Uint8Array(sig);
}

// ---- Agora AccessToken builder ----
const VERSION = "006";

const Privileges = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
};

async function buildToken(
  appID: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  const messages: Record<number, number> = {};
  messages[Privileges.kJoinChannel] = privilegeExpiredTs;
  if (role === 1) {
    // Publisher
    messages[Privileges.kPublishAudioStream] = privilegeExpiredTs;
    messages[Privileges.kPublishVideoStream] = privilegeExpiredTs;
    messages[Privileges.kPublishDataStream] = privilegeExpiredTs;
  }

  const salt = Math.floor(Math.random() * 0xffffffff);
  const ts = Math.floor(Date.now() / 1000) + 24 * 3600;
  const uidStr = uid === 0 ? "" : `${uid}`;

  // Pack message: salt(4) + ts(4) + messages(treeMap)
  const msgBuf = new ByteBuf();
  msgBuf.putUint32(salt).putUint32(ts).putTreeMapUInt32(messages);
  const m = msgBuf.pack();

  // toSign = appID + channelName + uid + m
  const enc = new TextEncoder();
  const parts = [enc.encode(appID), enc.encode(channelName), enc.encode(uidStr), m];
  const totalLen = parts.reduce((s, p) => s + p.length, 0);
  const toSign = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    toSign.set(p, offset);
    offset += p.length;
  }

  const signature = await encodeHMac(appCertificate, toSign);

  const crcChannel = crc32(channelName);
  const crcUid = crc32(uidStr);

  // Pack content: signature(bytes) + crc_channel(4) + crc_uid(4) + m(bytes)
  const contentBuf = new ByteBuf(2048);
  contentBuf.putBytes(signature);
  contentBuf.putUint32(crcChannel);
  contentBuf.putUint32(crcUid);
  contentBuf.putBytes(m);
  const content = contentBuf.pack();

  // Base64 encode content
  let binary = "";
  for (const byte of content) {
    binary += String.fromCharCode(byte);
  }
  const b64 = btoa(binary);

  return VERSION + appID + b64;
}

const CHANNEL_NAME_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Authentication configuration missing");
    }
    if (!appId || !appCertificate) {
      throw new Error("Agora credentials not configured");
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const channelName = typeof body?.channelName === "string" ? body.channelName.trim() : "";
    const parsedUid = Number(body?.uid ?? 0);

    if (!CHANNEL_NAME_REGEX.test(channelName)) {
      return new Response(
        JSON.stringify({ error: "channelName must be 3-64 chars (letters, numbers, _ or -)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Number.isInteger(parsedUid) || parsedUid < 0 || parsedUid > 4294967295) {
      return new Response(JSON.stringify({ error: "uid must be a valid unsigned integer" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + 3600;

    const token = await buildToken(
      appId,
      appCertificate,
      channelName,
      parsedUid,
      1,
      privilegeExpiredTs
    );

    return new Response(JSON.stringify({ token, appId, channelName, uid: parsedUid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
