import { useState, useEffect } from "react";
import { Search, MoreVertical, Plus, ArrowLeft } from "lucide-react";
import { useConversations } from "@/hooks/useChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ChatConversation from "@/components/ChatConversation";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

const ChatPage = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const { conversations, loading, fetchConversations, startConversation } = useConversations();

  // Selected conversation
  const selectedConv = selectedConversationId
    ? conversations.find((c) => c.id === selectedConversationId)
    : null;

  if (selectedConversationId && selectedConv?.other_user) {
    return (
      <ChatConversation
        conversationId={selectedConv.id}
        otherUser={selectedConv.other_user}
        onBack={() => {
          setSelectedConversationId(null);
          fetchConversations();
        }}
      />
    );
  }

  // Fetch all users for new chat
  const fetchAllUsers = async () => {
    if (!user) return;
    setLoadingUsers(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .neq("user_id", user.id);
    setAllUsers(data || []);
    setLoadingUsers(false);
  };

  const handleStartChat = async (otherUserId: string) => {
    const convId = await startConversation(otherUserId);
    if (convId) {
      setShowNewChat(false);
      setSelectedConversationId(convId);
    }
  };

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

  // New chat user picker
  if (showNewChat) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setShowNewChat(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <h1 className="text-xl font-extrabold text-foreground">New Chat</h1>
          </div>
        </header>
        <div className="px-4">
          {loadingUsers ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : allUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-16">No users found</p>
          ) : (
            allUsers.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleStartChat(u.user_id)}
                className="w-full flex items-center gap-3 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors rounded-lg px-2"
              >
                <img
                  src={u.avatar_url || "/placeholder.svg"}
                  alt={u.display_name || "User"}
                  className="w-12 h-12 rounded-full object-cover bg-muted"
                />
                <h3 className="font-bold text-sm text-foreground">{u.display_name || "User"}</h3>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass-card px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3 animate-slide-up">
          <h1 className="text-xl font-extrabold text-foreground">Messages</h1>
          <button
            onClick={() => {
              setShowNewChat(true);
              fetchAllUsers();
            }}
            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center shadow-md"
          >
            <Plus size={16} className="text-primary-foreground" />
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
            <button
              onClick={() => {
                setShowNewChat(true);
                fetchAllUsers();
              }}
              className="mt-3 gradient-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-bold"
            >
              Start a new chat
            </button>
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
