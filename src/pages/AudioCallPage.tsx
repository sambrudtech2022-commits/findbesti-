import { useParams, useNavigate } from "react-router-dom";
import { mockUsers } from "@/data/mockData";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useAgoraCall } from "@/hooks/useAgoraCall";

const AudioCallPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];

  const channelName = `call_${[userId, "me"].sort().join("_")}`;

  const {
    joined,
    joining,
    error,
    isMuted,
    remoteUsers,
    callTime,
    formatTime,
    toggleMute,
    leave,
  } = useAgoraCall({ channelName, callType: "audio" });

  const handleEndCall = async () => {
    await leave();
    navigate(-1);
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)] flex flex-col items-center justify-between py-16 px-6">
      {/* User info */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary-foreground/30 shadow-2xl"
          />
          {joining && (
            <div className="absolute inset-0 rounded-full border-4 border-primary-foreground/50 animate-ping" />
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-primary-foreground mt-2">{user.name}</h2>
        <p className="text-primary-foreground/70 text-sm font-medium">
          {joining ? "Connecting..." : error ? "Connection failed" : formatTime(callTime)}
        </p>
        {error && (
          <p className="text-primary-foreground/60 text-xs bg-destructive/30 rounded-lg px-3 py-1">{error}</p>
        )}
      </div>

      {/* Waveform animation */}
      {joined && remoteUsers.length > 0 && (
        <div className="flex items-end gap-1 h-12">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary-foreground/40 rounded-full"
              style={{
                height: `${12 + Math.random() * 28}px`,
                animation: `pulse ${0.4 + Math.random() * 0.6}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      )}

      {joining && (
        <Loader2 className="text-primary-foreground/50 animate-spin" size={32} />
      )}

      {joined && remoteUsers.length === 0 && !joining && (
        <p className="text-primary-foreground/50 text-sm">Waiting for user to join...</p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={toggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-destructive" : "bg-primary-foreground/20 backdrop-blur-sm"
          }`}
        >
          {isMuted ? (
            <MicOff size={24} className="text-primary-foreground" />
          ) : (
            <Mic size={24} className="text-primary-foreground" />
          )}
        </button>

        <button
          className="w-16 h-16 rounded-full flex items-center justify-center bg-primary-foreground/20 backdrop-blur-sm"
        >
          <Volume2 size={24} className="text-primary-foreground" />
        </button>

        <button
          onClick={handleEndCall}
          className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-destructive flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <PhoneOff size={28} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AudioCallPage;
