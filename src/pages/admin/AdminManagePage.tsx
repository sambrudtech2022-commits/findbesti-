import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, UserPlus } from "lucide-react";

const AdminManagePage = () => {
  const [email, setEmail] = useState("");
  const queryClient = useQueryClient();

  const { data: admins, isLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role", "admin");
      if (error) throw error;

      // Get profile info for each admin
      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .in("user_id", userIds);

      return roles.map((r) => ({
        ...r,
        profile: profiles?.find((p) => p.user_id === r.user_id),
      }));
    },
  });

  const manageRole = useMutation({
    mutationFn: async ({ action, targetEmail }: { action: "add" | "remove"; targetEmail: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-admin-role", {
        body: { action, email: targetEmail },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success(data.message);
      setEmail("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    manageRole.mutate({ action: "add", targetEmail: email.trim() });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Add Admin Form */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          Add New Admin
        </h3>
        <form onSubmit={handleAddAdmin} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter user email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-xl"
            required
          />
          <Button
            type="submit"
            disabled={manageRole.isPending}
            className="rounded-xl"
          >
            {manageRole.isPending ? "Adding..." : "Add Admin"}
          </Button>
        </form>
      </div>

      {/* Admin List */}
      <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          Current Admins
        </h3>
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)
          ) : admins?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No admins found</p>
          ) : (
            admins?.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {admin.profile?.display_name || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {admin.profile?.phone || "No phone"} · Since{" "}
                    {new Date(admin.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-lg h-8 text-xs"
                  onClick={() =>
                    manageRole.mutate({ action: "remove", targetEmail: "" })
                  }
                  disabled
                  title="Use email to remove"
                >
                  <ShieldOff size={14} className="mr-1" /> Remove
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagePage;
