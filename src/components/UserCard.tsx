import { UserProfile } from "@/data/mockData";
import { Video, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UserCardProps {
  user: UserProfile;
}

const UserCard = ({ user }: UserCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer aspect-[3/4]">
      <img
        src={user.avatar}
        alt={user.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
      
      {/* Live badge */}
      {user.isLive && (
        <div className="absolute top-2 left-2 flex items-center gap-1 gradient-primary px-2 py-0.5 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground animate-pulse" />
          <span className="text-[10px] font-bold text-primary-foreground">LIVE</span>
        </div>
      )}

      {/* Online status */}
      {user.isOnline && !user.isLive && (
        <div className="absolute top-2 left-2">
          <div className="w-3 h-3 rounded-full bg-online border-2 border-card" />
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-primary-foreground font-bold text-sm">{user.name}, {user.age}</h3>
            <p className="text-primary-foreground/70 text-[10px]">{user.country}</p>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/video-call/${user.id}`);
              }}
              className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <Video size={14} className="text-primary-foreground" />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-online flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
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
