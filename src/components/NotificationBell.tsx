import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserNotification {
  id: string;
  read: boolean;
  notification_id: string;
  notifications: {
    id: string;
    title: string;
    message: string;
    created_at: string;
  };
}

const NotificationBell = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_notifications")
      .select("id, read, notification_id, notifications(id, title, message, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setItems(data as unknown as UserNotification[]);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .eq("id", id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("user_notifications")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", unreadIds);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
      >
        <Bell className="w-4.5 h-4.5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-80 max-h-96 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold text-primary"
                  >
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-72">
              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Koi notification nahi hai
                </div>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => !item.read && markAsRead(item.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors",
                      !item.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!item.read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {item.notifications?.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.notifications?.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {item.notifications?.created_at &&
                            new Date(item.notifications.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
