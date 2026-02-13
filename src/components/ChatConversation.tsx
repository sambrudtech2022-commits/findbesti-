import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Phone, Video, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMessages, useTypingIndicator } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";

interface ChatConversationProps {
  conversationId: string;
  otherUser: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  onBack: () => void;
}

const ChatConversation = ({ conversationId, otherUser, onBack }: ChatConversationProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { isOtherTyping, sendTyping } = useTypingIndicator(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const text = message;
    setMessage("");
    await sendMessage(text);
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 glass-card px-3 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <img
          src={otherUser.avatar_url || "/placeholder.svg"}
          alt={otherUser.display_name || "User"}
          className="w-10 h-10 rounded-full object-cover bg-muted"
        />
        <div className="flex-1">
          <h3 className="font-bold text-sm text-foreground">{otherUser.display_name || "User"}</h3>
        </div>
        <button onClick={() => navigate(`/audio-call/${otherUser.user_id}`)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Phone size={16} className="text-primary" />
        </button>
        <button onClick={() => navigate(`/video-call/${otherUser.user_id}`)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Video size={16} className="text-primary" />
        </button>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <MoreVertical size={16} className="text-muted-foreground" />
        </button>
      </header>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "gradient-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 glass-card border-t border-border/50 px-4 py-3 mb-16">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => { setMessage(e.target.value); sendTyping(); }}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatConversation;
