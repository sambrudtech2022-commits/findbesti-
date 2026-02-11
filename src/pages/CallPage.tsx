import { mockUsers } from "@/data/mockData";
import { Video, Phone, Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const callHistory = [
  { user: mockUsers[0], type: "incoming" as const, duration: "5:32", time: "2 min ago" },
  { user: mockUsers[2], type: "outgoing" as const, duration: "12:45", time: "1 hr ago" },
  { user: mockUsers[4], type: "missed" as const, duration: "", time: "3 hr ago" },
  { user: mockUsers[5], type: "incoming" as const, duration: "8:15", time: "Yesterday" },
  { user: mockUsers[1], type: "outgoing" as const, duration: "3:22", time: "Yesterday" },
  { user: mockUsers[6], type: "missed" as const, duration: "", time: "2 days ago" },
];

const callIcons = {
  incoming: { icon: PhoneIncoming, color: "text-online" },
  outgoing: { icon: PhoneOutgoing, color: "text-primary" },
  missed: { icon: PhoneMissed, color: "text-destructive" },
};

const CallPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3">
        <h1 className="text-xl font-extrabold text-foreground mb-3">Calls</h1>
        <div className="flex gap-2">
          <button className="flex-1 gradient-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform">
            <Video size={18} />
            Random Video Call
          </button>
          <button className="flex-1 bg-online text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg hover:scale-[1.02] transition-transform">
            <Phone size={18} />
            Voice Call
          </button>
        </div>
      </header>

      {/* Call history */}
      <div className="px-4 mt-4">
        <h2 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
          <Clock size={14} />
          Recent Calls
        </h2>
        <div className="space-y-1">
          {callHistory.map((call, i) => {
            const CallIcon = callIcons[call.type].icon;
            const iconColor = callIcons[call.type].color;
            return (
              <div key={i} className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-muted/30 transition-colors">
                <img src={call.user.avatar} alt={call.user.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-foreground">{call.user.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <CallIcon size={12} className={iconColor} />
                    <span className="text-xs text-muted-foreground">
                      {call.type === "missed" ? "Missed" : call.duration} · {call.time}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/video-call/${call.user.id}`)}
                    className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Video size={16} className="text-primary" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-online/10 flex items-center justify-center hover:bg-online/20 transition-colors">
                    <Phone size={16} className="text-online" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CallPage;
