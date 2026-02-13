import { Search, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useConversations } from "@/hooks/useChat";
import ChatConversation from "@/components/ChatConversation";
import { formatDistanceToNow } from "date-fns";

const ChatPage = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { conversations, loading, fetchConversations } = useConversations();

  if (selectedConversationId) {
    const conv = conversations.find((c) => c.id === selectedConversationId);
    if (conv) {
      return (
        <ChatConversation
          conversationId={conv.id}
          otherUser={conv.other_user!}
          onBack={() => {
            setSelectedConversationId(null);
            fetchConversations();
          }}
        />
      );
    }
  }

  const filtered = conversations.filter((c) =>
    !searchQuery || c.other_user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: false });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </header>

      <div className="px-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">No conversations yet</p>
            <p className="text-muted-foreground text-xs mt-1">Start chatting from a user's profile!</p>
          </div>
        ) : (
          filtered.map((conv, index) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className="w-full flex items-center gap-3 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors rounded-lg px-2 animate-stagger-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative">
                <img
                  src={conv.other_user?.avatar_url || "/placeholder.svg"}
                  alt={conv.other_user?.display_name || "User"}
                  className="w-12 h-12 rounded-full object-cover bg-muted"
                />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">
                    {conv.other_user?.display_name || "User"}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {conv.last_message || "Start a conversation"}
                </p>
              </div>
              {(conv.unread_count || 0) > 0 && (
                <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{conv.unread_count}</span>
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatPage;
