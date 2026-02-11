import { useParams, useNavigate } from "react-router-dom";
import { mockUsers } from "@/data/mockData";
import { PhoneOff, Mic, MicOff, Camera, CameraOff, RotateCcw, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

const VideoCallPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const user = mockUsers.find((u) => u.id === userId) || mockUsers[0];
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-screen w-screen bg-foreground relative overflow-hidden">
      {/* Remote video (user's avatar as placeholder) */}
      <img
        src={user.avatar}
        alt={user.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-foreground/20" />

      {/* Self video (small) */}
      <div className="absolute top-12 right-4 w-28 h-40 rounded-2xl overflow-hidden border-2 border-primary-foreground/30 shadow-xl">
        <div className="w-full h-full bg-foreground/80 flex items-center justify-center">
          {isCameraOff ? (
            <CameraOff className="text-primary-foreground/50" size={24} />
          ) : (
            <div className="w-full h-full gradient-primary opacity-30" />
          )}
        </div>
      </div>

      {/* Top info */}
      <div className="absolute top-12 left-4 z-10">
        <h2 className="text-primary-foreground font-extrabold text-lg drop-shadow-lg">{user.name}</h2>
        <p className="text-primary-foreground/80 text-sm font-semibold drop-shadow">{formatTime(callTime)}</p>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-10 left-0 right-0 z-10 safe-bottom">
        <div className="flex items-center justify-center gap-4 px-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
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
            onClick={() => setIsCameraOff(!isCameraOff)}
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

          <button className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <RotateCcw size={22} className="text-primary-foreground" />
          </button>

          <button className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle size={22} className="text-primary-foreground" />
          </button>

          <button
            onClick={() => navigate(-1)}
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
