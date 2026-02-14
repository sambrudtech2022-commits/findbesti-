import { UserProfile } from "@/data/mockData";
import { Video, Phone, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface UserCardProps {
  user: UserProfile;
}

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);

  return (
    <div className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer aspect-[3/4] active:scale-[0.97]">
      <img
        src={user.avatar}
        alt={user.name}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
      
      {/* Like button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setLiked(!liked);
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-card/30 backdrop-blur-sm flex items-center justify-center hover:scale-125 transition-all duration-300"
      >
        <Heart
          size={16}
          className={`transition-all duration-300 ${liked ? "text-primary fill-primary scale-110" : "text-primary-foreground"}`}
        />
      </button>

      {/* Live badge */}
      {user.isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 gradient-primary px-2 py-0.5 rounded-full shadow-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
          <span className="text-[10px] font-bold text-primary-foreground">LIVE</span>
        </div>
      )}

      {/* Online status */}
      {user.isOnline && !user.isLive && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 rounded-full bg-online border-2 border-card animate-pulse" />
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between">
          <div className="transform group-hover:translate-y-0 translate-y-1 transition-transform duration-300">
            <h3 className="text-primary-foreground font-bold text-sm drop-shadow-md">{user.name}, {user.age}</h3>
            <p className="text-primary-foreground/70 text-[10px] drop-shadow">{user.country}</p>
          </div>
          <div className="flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-y-0 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/video-call/${user.id}`);
              }}
              className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
            >
              <Video size={14} className="text-primary-foreground" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/audio-call/${user.id}`);
              }}
              className="w-8 h-8 rounded-full bg-online flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
            >
              <Phone size={14} className="text-primary-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
