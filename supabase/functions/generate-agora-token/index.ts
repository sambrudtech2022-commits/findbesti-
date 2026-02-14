import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Agora token generation using Web Crypto API (no Node.js crypto dependency)
const VERSION = "006";
const VERSION_LENGTH = 3;

function packUint16(val: number): Uint8Array {
  const buf = new Uint8Array(2);
  buf[0] = val & 0xff;
  buf[1] = (val >> 8) & 0xff;
  return buf;
}

function packUint32(val: number): Uint8Array {
  const buf = new Uint8Array(4);
  buf[0] = val & 0xff;
  buf[1] = (val >> 8) & 0xff;
  buf[2] = (val >> 16) & 0xff;
  buf[3] = (val >> 24) & 0xff;
  return buf;
}

function packString(str: string): Uint8Array {
  const encoded = new TextEncoder().encode(str);
  const lenBuf = packUint16(encoded.length);
  const result = new Uint8Array(lenBuf.length + encoded.length);
  result.set(lenBuf);
  result.set(encoded, lenBuf.length);
  return result;
}

function packMapUint32(map: Map<number, number>): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(packUint16(map.size));
  for (const [key, value] of map) {
    parts.push(packUint16(key));
    parts.push(packUint32(value));
  }
  const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    result.set(p, offset);
    offset += p.length;
  }
  return result;
}

function concatBuffers(...buffers: Uint8Array[]): Uint8Array {
  const totalLen = buffers.reduce((sum, b) => sum + b.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const b of buffers) {
    result.set(b, offset);
    offset += b.length;
  }
  return result;
}

async function hmacSign(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(signature);
}

function encodeBase64(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

async function generateAccessToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  expirationInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expireTimestamp = now + expirationInSeconds;
  const salt = Math.floor(Math.random() * 0xffffffff);
  const tsMs = Math.floor(Date.now());

  // Build privileges map
  const privileges = new Map<number, number>();
  // kJoinChannel = 1
  privileges.set(1, expireTimestamp);
  // kPublishAudioStream = 2
  privileges.set(2, expireTimestamp);
  // kPublishVideoStream = 3
  privileges.set(3, expireTimestamp);
  // kPublishDataStream = 4
  privileges.set(4, expireTimestamp);

  // Build message
  const message = concatBuffers(
    packUint32(salt),
    packUint32(tsMs),
    packMapUint32(privileges)
  );

  // Sign
  const encoder = new TextEncoder();
  const toSign = concatBuffers(
    encoder.encode(appId),
    encoder.encode(channelName),
    encoder.encode(String(uid)),
    message
  );

  const sign = await hmacSign(encoder.encode(appCertificate), toSign);

  // Build content
  const content = concatBuffers(
    packString(appId),
    packUint32(uid),
    packString(channelName),
    packUint32(salt),
    packUint32(tsMs),
    packUint16(sign.length),
    sign,
    packMapUint32(privileges)
  );

  // Encode
  const base64Content = encodeBase64(content);
  return VERSION + appId + base64Content;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("AGORA_APP_ID");
    const appCertificate = Deno.env.get("AGORA_APP_CERTIFICATE");

    if (!appId || !appCertificate) {
      throw new Error("Agora credentials not configured");
    }

    const { channelName, uid } = await req.json();

    if (!channelName) {
      throw new Error("channelName is required");
    }

    const token = await generateAccessToken(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      3600
    );

    return new Response(
      JSON.stringify({ token, appId, channelName, uid: uid || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
