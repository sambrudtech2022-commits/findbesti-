import { useParams, useNavigate } from "react-router-dom";
import { mockUsers } from "@/data/mockData";
import { PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";

const AudioCallPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const [callStatus, setCallStatus] = useState<"ringing" | "connected">("ringing");

  useEffect(() => {
    const ringTimer = setTimeout(() => setCallStatus("connected"), 2500);
    return () => clearTimeout(ringTimer);
  }, []);

  useEffect(() => {
    if (callStatus !== "connected") return;
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
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
          {callStatus === "ringing" && (
            <div className="absolute inset-0 rounded-full border-4 border-primary-foreground/50 animate-ping" />
          )}
        </div>
        <h2 className="text-2xl font-extrabold text-primary-foreground mt-2">{user.name}</h2>
        <p className="text-primary-foreground/70 text-sm font-medium">
          {callStatus === "ringing" ? "Ringing..." : formatTime(callTime)}
        </p>
      </div>

      {/* Waveform animation */}
      {callStatus === "connected" && (
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

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 mb-8">
        <button
          onClick={() => setIsMuted(!isMuted)}
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
          onClick={() => setIsSpeaker(!isSpeaker)}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isSpeaker ? "bg-accent" : "bg-primary-foreground/20 backdrop-blur-sm"
          }`}
        >
          {isSpeaker ? (
            <Volume2 size={24} className="text-primary-foreground" />
          ) : (
            <VolumeX size={24} className="text-primary-foreground" />
          )}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-destructive flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <PhoneOff size={28} className="text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default AudioCallPage;
