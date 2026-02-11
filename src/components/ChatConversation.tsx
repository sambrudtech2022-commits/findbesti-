import { useState } from "react";
import { ArrowLeft, Send, Phone, Video, MoreVertical } from "lucide-react";
import { ChatThread } from "@/data/mockData";

interface ChatConversationProps {
  chat: ChatThread;
  onBack: () => void;
}

const demoMessages = [
  { id: "1", text: "Hi there! 👋", isMe: false, time: "10:30 AM" },
  { id: "2", text: "Hey! How are you doing?", isMe: true, time: "10:31 AM" },
  { id: "3", text: "I'm great! Thanks for asking 😊", isMe: false, time: "10:32 AM" },
  { id: "4", text: "Want to video call later?", isMe: false, time: "10:33 AM" },
  { id: "5", text: "Sure! That sounds fun 🎉", isMe: true, time: "10:34 AM" },
];

const ChatConversation = ({ chat, onBack }: ChatConversationProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState(demoMessages);

  const handleSend = () => {
    if (!message.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now().toString(), text: message, isMe: true, time: "Now" },
    ]);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card px-3 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <img src={chat.user.avatar} alt={chat.user.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="flex-1">
          <h3 className="font-bold text-sm text-foreground">{chat.user.name}</h3>
          <p className="text-[10px] text-online font-semibold">
            {chat.user.isOnline ? "Online" : "Offline"}
          </p>
        </div>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Phone size={16} className="text-primary" />
        </button>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Video size={16} className="text-primary" />
        </button>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <MoreVertical size={16} className="text-muted-foreground" />
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.isMe
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}
            >
              <p>{msg.text}</p>
              <p className={`text-[9px] mt-1 ${msg.isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="sticky bottom-0 glass-card border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
