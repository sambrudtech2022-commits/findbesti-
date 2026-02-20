import { useEffect, useState } from "react";
import { GiftItem } from "./GiftPanel";

interface FloatingGift {
  id: string;
  gift: GiftItem;
  senderName: string;
  x: number;
}

interface GiftAnimationProps {
  incomingGift: { gift: GiftItem; senderName: string } | null;
}

const GiftAnimation = ({ incomingGift }: GiftAnimationProps) => {
  const [floatingGifts, setFloatingGifts] = useState<FloatingGift[]>([]);

  useEffect(() => {
    if (!incomingGift) return;

    const newGift: FloatingGift = {
      id: Math.random().toString(36).slice(2),
      gift: incomingGift.gift,
      senderName: incomingGift.senderName,
      x: 20 + Math.random() * 60, // random horizontal position %
    };

    setFloatingGifts((prev) => [...prev, newGift]);

    // Remove after animation
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== newGift.id));
    }, 3000);
  }, [incomingGift]);

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {floatingGifts.map((fg) => (
        <div
          key={fg.id}
          className="absolute bottom-40 animate-gift-float"
          style={{ left: `${fg.x}%` }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-5xl drop-shadow-lg animate-bounce">{fg.gift.emoji}</span>
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
              <p className="text-white text-xs font-bold">{fg.senderName}</p>
              <p className="text-yellow-300 text-[10px] text-center">{fg.gift.name} 🪙{fg.gift.coins}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GiftAnimation;
