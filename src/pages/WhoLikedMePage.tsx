import { ArrowLeft, Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatar7 from "@/assets/avatar7.jpg";
import avatar8 from "@/assets/avatar8.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";
import avatar6 from "@/assets/avatar6.jpg";

const likers = [
  { id: 1, name: "Rahul", age: 25, img: avatar7, blur: false },
  { id: 2, name: "Arjun", age: 23, img: avatar8, blur: false },
  { id: 3, name: "???", age: 0, img: avatar3, blur: true },
  { id: 4, name: "???", age: 0, img: avatar4, blur: true },
  { id: 5, name: "???", age: 0, img: avatar6, blur: true },
];

const WhoLikedMePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">Who Liked Me</h1>
          <span className="ml-auto bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">5 new</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {likers.map((liker) => (
          <div key={liker.id} className="relative rounded-2xl overflow-hidden bg-card shadow-md">
            <img
              src={liker.img}
              alt={liker.name}
              className={`w-full h-44 object-cover ${liker.blur ? "blur-lg" : ""}`}
            />
            {liker.blur && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card/80 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <Lock size={14} className="text-primary" />
                  <span className="text-xs font-bold text-foreground">Premium</span>
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Star size={18} className="text-accent fill-accent" />
            </div>
            <div className="p-2.5">
              <h3 className="font-bold text-sm text-foreground">
                {liker.blur ? "Hidden" : `${liker.name}, ${liker.age}`}
              </h3>
              <p className="text-xs text-muted-foreground">
                {liker.blur ? "Unlock with Premium" : "Liked your profile"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WhoLikedMePage;
