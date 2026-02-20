import { useParams, useNavigate } from "react-router-dom";
import { mockUsers } from "@/data/mockData";
import { PhoneOff, Mic, MicOff, Camera, CameraOff, RotateCcw, Gift, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAgoraCall } from "@/hooks/useAgoraCall";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import GiftPanel, { GiftItem } from "@/components/GiftPanel";
import GiftAnimation from "@/components/GiftAnimation";

const VideoCallPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const user2 = mockUsers.find((u) => u.id === userId) || mockUsers[0];
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);

  const [giftPanelOpen, setGiftPanelOpen] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [incomingGift, setIncomingGift] = useState<{ gift: GiftItem; senderName: string } | null>(null);

  const channelName = `call_${[userId, "me"].sort().join("_")}`;

  const {
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
    localVideoTrack,
  } = useAgoraCall({ channelName, callType: "video" });

  // Fetch user coins
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("coins")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setUserCoins(data?.coins ?? 0));
  }, [user]);

  // Realtime: listen for incoming gifts in this channel
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`gifts_${channelName}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gift_transactions",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.channel_name === channelName) {
            setIncomingGift({
              gift: {
                id: row.gift_id,
                emoji: row.gift_emoji,
                name: row.gift_name,
                coins: row.coins_spent,
              },
              senderName: "Someone",
            });
            // Reset after 300ms to allow re-trigger
            setTimeout(() => setIncomingGift(null), 300);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, channelName]);

  // Play local video
  useEffect(() => {
    if (localVideoTrack && localVideoRef.current) {
      localVideoTrack.play(localVideoRef.current);
    }
  }, [localVideoTrack, joined]);

  // Play remote video
  useEffect(() => {
    if (remoteUsers.length > 0 && remoteVideoRef.current) {
      const remoteUser = remoteUsers[0];
      if (remoteUser.videoTrack) {
        remoteUser.videoTrack.play(remoteVideoRef.current);
      }
    }
  }, [remoteUsers]);

  const handleEndCall = async () => {
    await leave();
    navigate(-1);
  };

  const handleCoinsDeducted = useCallback((coins: number) => {
    setUserCoins((prev) => prev - coins);
  }, []);

  const handleGiftSent = useCallback((gift: GiftItem) => {
    // Show animation on sender side too
    setIncomingGift({ gift, senderName: "You" });
    setTimeout(() => setIncomingGift(null), 300);
  }, []);

  return (
    <div className="h-screen w-screen bg-foreground relative overflow-hidden">
      {/* Remote video */}
      <div ref={remoteVideoRef} className="absolute inset-0 w-full h-full bg-foreground">
        {remoteUsers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img
              src={user2.avatar}
              alt={user2.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-primary-foreground/30 mb-4"
            />
            <p className="text-primary-foreground/60 text-sm">
              {joining ? "Connecting..." : "Waiting for user to join..."}
            </p>
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-foreground/10 pointer-events-none" />

      {/* Gift Animation Overlay */}
      <GiftAnimation incomingGift={incomingGift} />

      {/* Self video (small) */}
      <div className="absolute top-12 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-primary-foreground/30 shadow-xl z-20">
        <div ref={localVideoRef} className="w-full h-full bg-foreground/80">
          {(isCameraOff || joining) && (
            <div className="w-full h-full flex items-center justify-center">
              {joining ? (
                <Loader2 className="text-primary-foreground/50 animate-spin" size={24} />
              ) : (
                <CameraOff className="text-primary-foreground/50" size={24} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Top info */}
      <div className="absolute top-12 left-4 z-10">
        <h2 className="text-primary-foreground font-extrabold text-lg drop-shadow-lg">{user2.name}</h2>
        <p className="text-primary-foreground/80 text-sm font-semibold drop-shadow">
          {joining ? "Connecting..." : error ? "Connection failed" : formatTime(callTime)}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute top-28 left-4 right-4 z-10 bg-destructive/90 text-primary-foreground text-xs rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      {/* Gift Panel */}
      <GiftPanel
        open={giftPanelOpen}
        onClose={() => setGiftPanelOpen(false)}
        receiverId={userId || ""}
        channelName={channelName}
        userCoins={userCoins}
        onGiftSent={handleGiftSent}
        onCoinsDeducted={handleCoinsDeducted}
      />

      {/* Bottom controls */}
      <div className="absolute bottom-10 left-0 right-0 z-10 safe-bottom">
        <div className="flex items-center justify-center gap-4 px-6">
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? "bg-destructive" : "bg-primary-foreground/20 backdrop-blur-sm"
            }`}
          >
            {isMuted ? (
              <MicOff size={22} className="text-primary-foreground" />
            ) : (
              <Mic size={22} className="text-primary-foreground" />
            )}
          </button>

          <button
            onClick={toggleCamera}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isCameraOff ? "bg-destructive" : "bg-primary-foreground/20 backdrop-blur-sm"
            }`}
          >
            {isCameraOff ? (
              <CameraOff size={22} className="text-primary-foreground" />
            ) : (
              <Camera size={22} className="text-primary-foreground" />
            )}
          </button>

          <button
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center"
          >
            <RotateCcw size={22} className="text-primary-foreground" />
          </button>

          {/* Gift Button */}
          <button
            onClick={() => setGiftPanelOpen((v) => !v)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              giftPanelOpen ? "bg-primary" : "bg-primary-foreground/20 backdrop-blur-sm"
            }`}
          >
            <Gift size={22} className="text-primary-foreground" />
          </button>

          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
          >
            <PhoneOff size={24} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;
