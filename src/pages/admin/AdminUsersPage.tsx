import { Ban, CheckCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState } from "react";
import avatar1 from "@/assets/avatar1.jpg";

const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleBlock = useMutation({
    mutationFn: async ({ userId, blocked }: { userId: string; blocked: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: blocked })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User status updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const filtered = users?.filter((u) =>
    (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? "").includes(search)
  );

  return (
    <div>
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : (
          filtered?.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
              <img
                src={user.avatar_url || avatar1}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{user.display_name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user.phone || "No phone"} · {user.coins ?? 0} coins</p>
              </div>
              <Button
                size="sm"
                variant={user.is_blocked ? "default" : "destructive"}
                className="rounded-lg text-xs h-8"
                onClick={() => toggleBlock.mutate({ userId: user.user_id, blocked: !user.is_blocked })}
              >
                {user.is_blocked ? (
                  <><CheckCircle size={14} className="mr-1" /> Unblock</>
                ) : (
                  <><Ban size={14} className="mr-1" /> Block</>
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
