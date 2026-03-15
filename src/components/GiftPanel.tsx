import { useState } from "react";
import { Gift, X, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GiftItem {
  id: string;
  emoji: string;
  name: string;
  coins: number;
}

export const GIFTS: GiftItem[] = [
  { id: "rose",    emoji: "🌹", name: "Rose",    coins: 10  },
  { id: "heart",   emoji: "❤️", name: "Heart",   coins: 20  },
  { id: "star",    emoji: "⭐", name: "Star",    coins: 50  },
  { id: "fire",    emoji: "🔥", name: "Fire",    coins: 80  },
  { id: "diamond", emoji: "💎", name: "Diamond", coins: 100 },
  { id: "crown",   emoji: "👑", name: "Crown",   coins: 200 },
  { id: "rocket",  emoji: "🚀", name: "Rocket",  coins: 300 },
  { id: "trophy",  emoji: "🏆", name: "Trophy",  coins: 500 },
];

interface GiftPanelProps {
  open: boolean;
  onClose: () => void;
  receiverId: string;
  channelName: string;
  userCoins: number;
  onGiftSent: (gift: GiftItem) => void;
  onCoinsDeducted: (coins: number) => void;
}

const GiftPanel = ({
  open,
  onClose,
  receiverId,
  channelName,
  userCoins,
  onGiftSent,
  onCoinsDeducted,
}: GiftPanelProps) => {
  const { user } = useAuth();
  const [sending, setSending] = useState<string | null>(null);

  if (!open) return null;

  // UUID format validation
  const isValidUUID = (id: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const handleSendGift = async (gift: GiftItem) => {
    if (!user) return;
    if (userCoins < gift.coins) {
      toast.error(`Insufficient coins! You need ${gift.coins} coins.`);
      return;
    }

    setSending(gift.id);
    try {
      // Fetch latest coin balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("coins")
        .eq("user_id", user.id)
        .single();

      const currentCoins = profile?.coins ?? 0;
      if (currentCoins < gift.coins) {
        toast.error("Insufficient coins!");
        return;
      }

      // Deduct coins
      const { error: coinError } = await supabase
        .from("profiles")
        .update({ coins: currentCoins - gift.coins })
        .eq("user_id", user.id);

      if (coinError) throw coinError;

      // Record gift transaction only if receiver is a valid UUID
      if (isValidUUID(receiverId)) {
        await supabase.from("gift_transactions").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          gift_id: gift.id,
          gift_name: gift.name,
          gift_emoji: gift.emoji,
          coins_spent: gift.coins,
          channel_name: channelName,
        });
      }

      onCoinsDeducted(gift.coins);
      onGiftSent(gift);
      toast.success(`${gift.emoji} ${gift.name} bheja!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Gift send karne mein error");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="absolute bottom-32 left-0 right-0 z-30 px-4">
      <div className="bg-foreground/80 backdrop-blur-xl rounded-2xl border border-primary-foreground/20 p-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift size={16} className="text-primary-foreground/80" />
            <span className="text-primary-foreground font-bold text-sm">Virtual Gifts</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-primary-foreground/70 text-xs flex items-center gap-1">
              <Coins size={12} /> {userCoins} coins
            </span>
            <button onClick={onClose} className="text-primary-foreground/60 hover:text-primary-foreground">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Gifts Grid */}
        <div className="grid grid-cols-4 gap-2">
          {GIFTS.map((gift) => {
            const canAfford = userCoins >= gift.coins;
            const isSending = sending === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => handleSendGift(gift)}
                disabled={sending !== null}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  canAfford
                    ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 active:scale-95"
                    : "bg-primary-foreground/5 opacity-50 active:scale-95"
                } ${isSending ? "scale-95" : ""}`}
              >
                <span className="text-2xl">{isSending ? "✨" : gift.emoji}</span>
                <span className="text-primary-foreground/80 text-[10px] font-semibold leading-tight">{gift.name}</span>
                <span className="text-yellow-400 text-[9px] font-bold">{gift.coins}🪙</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GiftPanel;
