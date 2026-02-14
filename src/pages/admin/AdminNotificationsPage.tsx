import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Send, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const AdminNotificationsPage = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title aur message dono bharna zaroori hai");
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert notification
      const { data: notif, error: insertError } = await supabase
        .from("notifications")
        .insert({ title: title.trim(), message: message.trim(), type: "general", created_by: user.id })
        .select()
        .single();

      if (insertError) throw insertError;

      // Broadcast to all users
      const { error: broadcastError } = await supabase.rpc("broadcast_notification", {
        _notification_id: notif.id,
      });

      if (broadcastError) throw broadcastError;

      toast.success("Notification sabhi users ko bhej di gayi!");
      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (error: any) {
      console.error("Send notification error:", error);
      toast.error(error.message || "Notification bhejne mein error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Notification deleted");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose section */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Send className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">Send Notification</h2>
            <p className="text-xs text-muted-foreground">Sabhi users ko ek saath message bhejo</p>
          </div>
        </div>

        <Input
          placeholder="Notification title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Textarea
          placeholder="Notification message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[100px] rounded-xl resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !message.trim()}
          className="w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold"
        >
          {sending ? "Bhej rahe hain..." : "Send to All Users"}
        </Button>
      </div>

      {/* History */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" /> Sent Notifications
        </h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Koi notification nahi bheji gayi abhi tak
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-foreground text-sm">{notif.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(notif.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(notif.id)}
                className="text-destructive hover:bg-destructive/10 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
