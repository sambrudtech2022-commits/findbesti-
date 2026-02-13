import { ArrowLeft, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import avatar2 from "@/assets/avatar2.jpg";
import avatar3 from "@/assets/avatar3.jpg";
import avatar4 from "@/assets/avatar4.jpg";
import avatar6 from "@/assets/avatar6.jpg";

const favorites = [
  { id: 1, name: "Priya", age: 22, img: avatar2, online: true },
  { id: 2, name: "Ananya", age: 24, img: avatar3, online: false },
  { id: 3, name: "Sneha", age: 21, img: avatar4, online: true },
  { id: 4, name: "Riya", age: 23, img: avatar6, online: false },
];

const FavoritesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">My Favorites</h1>
          <span className="ml-auto text-sm text-muted-foreground">{favorites.length} people</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        {favorites.map((fav) => (
          <div key={fav.id} className="relative rounded-2xl overflow-hidden bg-card shadow-md">
            <img src={fav.img} alt={fav.name} className="w-full h-44 object-cover" />
            <div className="absolute top-2 right-2">
              <Heart size={20} className="text-primary fill-primary" />
            </div>
            {fav.online && (
              <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-online border-2 border-card" />
            )}
            <div className="p-2.5">
              <h3 className="font-bold text-sm text-foreground">{fav.name}, {fav.age}</h3>
              <p className="text-xs text-muted-foreground">{fav.online ? "Online" : "Offline"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;
