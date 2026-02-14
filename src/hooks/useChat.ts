import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return;
    }

    if (!data || data.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user profiles
    const otherUserIds = data.map((c) =>
      c.user1_id === user.id ? c.user2_id : c.user1_id
    );

    const { data: profiles } = await supabase.rpc("get_public_profiles");
    // Filter to only other user IDs
    const filteredProfiles = (profiles || []).filter((p: any) => otherUserIds.includes(p.user_id));

    // Get unread counts
    const { data: unreadData } = await supabase
      .from("messages")
      .select("conversation_id")
      .eq("read", false)
      .neq("sender_id", user.id)
      .in("conversation_id", data.map((c) => c.id));

    const unreadMap: Record<string, number> = {};
    unreadData?.forEach((m) => {
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] || 0) + 1;
    });

    const profileMap = new Map(filteredProfiles?.map((p: any) => [p.user_id, p]));

    const enriched = data.map((c) => {
      const otherId = c.user1_id === user.id ? c.user2_id : c.user1_id;
      return {
        ...c,
        other_user: profileMap.get(otherId) || { user_id: otherId, display_name: "User", avatar_url: null },
        unread_count: unreadMap[c.id] || 0,
      };
    });

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const startConversation = useCallback(async (otherUserId: string) => {
    if (!user) return null;

    // Check if conversation already exists
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`
      )
      .maybeSingle();

    if (existing) return existing.id;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user1_id: user.id, user2_id: otherUserId })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      return null;
    }

    await fetchConversations();
    return data.id;
  }, [user, fetchConversations]);

  return { conversations, loading, fetchConversations, startConversation };
}

export function useMessages(conversationId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    if (user) {
      supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .eq("read", false)
        .then(() => {});
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (user && newMsg.sender_id !== user.id) {
            supabase.from("messages").update({ read: true }).eq("id", newMsg.id).then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !conversationId || !content.trim()) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
    });

    if (error) {
      console.error("Error sending message:", error);
    }
  }, [user, conversationId]);

  return { messages, loading, sendMessage };
}

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuth();
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id !== user.id) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  }, [user]);

  return { isOtherTyping, sendTyping };
}
