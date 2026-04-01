import { Heart, Sparkles } from "lucide-react";

const SplashScreen = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-3 h-3 rounded-full bg-white/20 animate-float" />
        <div className="absolute top-[25%] right-[15%] w-2 h-2 rounded-full bg-white/15 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-[30%] left-[20%] w-4 h-4 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-[20%] right-[10%] w-2.5 h-2.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[45%] left-[5%] w-2 h-2 rounded-full bg-white/15 animate-float" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[60%] right-[25%] w-3 h-3 rounded-full bg-white/10 animate-float" style={{ animationDelay: '1.2s' }} />
      </div>

      {/* Logo area */}
      <div className="animate-bounce-in flex flex-col items-center z-10">
        <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center mb-6 shadow-2xl border border-white/30">
          <Heart className="w-12 h-12 text-white fill-white" />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tight mb-2">
          FindBesti
        </h1>

        <div className="flex items-center gap-1.5 mb-8">
          <Sparkles className="w-4 h-4 text-white/80" />
          <p className="text-white/80 text-sm font-semibold tracking-wide">
            Connect • Chat • Call
          </p>
          <Sparkles className="w-4 h-4 text-white/80" />
        </div>
      </div>

      {/* Loading spinner */}
      <div className="animate-slide-up z-10">
        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default SplashScreen;
