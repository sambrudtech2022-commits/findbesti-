import { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  IMicrophoneAudioTrack,
  ICameraVideoTrack,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng";
import { supabase } from "@/integrations/supabase/client";

type CallType = "video" | "audio";

interface UseAgoraCallOptions {
  channelName: string;
  callType: CallType;
}

export const useAgoraCall = ({ channelName, callType }: UseAgoraCallOptions) => {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);

  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [callTime, setCallTime] = useState(0);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Timer
  useEffect(() => {
    if (!joined) return;
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [joined]);

  const join = useCallback(async () => {
    try {
      setJoining(true);
      setError(null);

      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-agora-token",
        { body: { channelName, uid: 0 } }
      );

      if (fnError || !data?.token) {
        throw new Error(fnError?.message || "Token generation failed");
      }

      const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      clientRef.current = client;

      // Handle remote users
      client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        setRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          if (exists) return prev.map((u) => (u.uid === user.uid ? user : u));
          return [...prev, user];
        });
      });

      client.on("user-unpublished", (user, mediaType) => {
        setRemoteUsers((prev) =>
          mediaType === "video"
            ? prev.map((u) => (u.uid === user.uid ? user : u))
            : prev
        );
      });

      client.on("user-left", (user) => {
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      await client.join(data.appId, channelName, data.token, data.uid);

      // Create local tracks
      if (callType === "video") {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;
        await client.publish([audioTrack, videoTrack]);
      } else {
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;
        await client.publish([audioTrack]);
      }

      setJoined(true);
    } catch (err: any) {
      console.error("Agora join error:", err);
      setError(err.message || "Failed to join call");
    } finally {
      setJoining(false);
    }
  }, [channelName, callType]);

  const leave = useCallback(async () => {
    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    if (clientRef.current) {
      await clientRef.current.leave();
    }
    setJoined(false);
    setRemoteUsers([]);
  }, []);

  const toggleMute = useCallback(() => {
    if (localAudioTrackRef.current) {
      const newMuted = !isMuted;
      localAudioTrackRef.current.setEnabled(!newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    if (localVideoTrackRef.current) {
      const newOff = !isCameraOff;
      localVideoTrackRef.current.setEnabled(!newOff);
      setIsCameraOff(newOff);
    }
  }, [isCameraOff]);

  const switchCamera = useCallback(async () => {
    if (localVideoTrackRef.current) {
      try {
        const currentFacingMode = isFrontCamera ? "environment" : "user";
        await localVideoTrackRef.current.setDevice({ facingMode: currentFacingMode } as any);
        setIsFrontCamera(!isFrontCamera);
      } catch (err) {
        console.error("Switch camera error:", err);
      }
    }
  }, [isFrontCamera]);

  // Auto-join on mount
  useEffect(() => {
    join();
    return () => {
      leave();
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return {
    joined,
    joining,
    error,
    isMuted,
    isCameraOff,
    remoteUsers,
    callTime,
    formatTime,
    toggleMute,
    toggleCamera,
    switchCamera,
    leave,
    localVideoTrack: localVideoTrackRef.current,
  };
};
