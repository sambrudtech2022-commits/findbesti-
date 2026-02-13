import { mockChats } from "@/data/mockData";
import { Search, MoreVertical } from "lucide-react";
import { useState } from "react";
import ChatConversation from "@/components/ChatConversation";

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  if (selectedChat) {
    const chat = mockChats.find((c) => c.id === selectedChat);
    if (chat) {
      return <ChatConversation chat={chat} onBack={() => setSelectedChat(null)} />;
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3 animate-slide-up">
          <h1 className="text-xl font-extrabold text-foreground">Messages</h1>
          <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <MoreVertical size={16} className="text-muted-foreground" />
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </header>

      {/* Online users strip */}
      <div className="px-4 py-3 flex gap-4 overflow-x-auto no-scrollbar">
        {mockChats.map((chat, index) => (
          <div key={chat.id} className="flex flex-col items-center gap-1 min-w-[56px] animate-stagger-in" style={{ animationDelay: `${index * 80}ms` }}>
            <div className="relative">
              <img
                src={chat.user.avatar}
                alt={chat.user.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-primary"
              />
              {chat.user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-online border-2 border-card" />
              )}
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{chat.user.name}</span>
          </div>
        ))}
      </div>

      {/* Chat list */}
      <div className="px-4">
        {mockChats.map((chat, index) => (
          <button
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className="w-full flex items-center gap-3 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors rounded-lg px-2 animate-stagger-in"
            style={{ animationDelay: `${200 + index * 80}ms` }}
          >
            <div className="relative">
              <img
                src={chat.user.avatar}
                alt={chat.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.user.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-online border-2 border-card" />
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">{chat.user.name}</h3>
                <span className="text-[10px] text-muted-foreground">{chat.timestamp}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
            </div>
            {chat.unread > 0 && (
              <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">{chat.unread}</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
