import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminWithdrawalsPage = () => {
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast.success("Withdrawal status updated");
    },
    onError: () => toast.error("Failed to update"),
  });

  return (
    <div className="space-y-2 max-w-2xl">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : withdrawals?.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No withdrawal requests</p>
      ) : (
        withdrawals?.map((w) => (
          <div key={w.id} className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-foreground">₹{w.amount}</p>
                <p className="text-xs text-muted-foreground">UPI: {w.upi_id}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(w.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                w.status === "pending" ? "bg-accent/20 text-accent" :
                w.status === "approved" ? "bg-online/20 text-online" :
                "bg-destructive/20 text-destructive"
              }`}>
                {w.status}
              </span>
            </div>
            {w.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 rounded-lg h-8 text-xs"
                  onClick={() => updateStatus.mutate({ id: w.id, status: "approved" })}
                >
                  <CheckCircle size={14} className="mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 rounded-lg h-8 text-xs"
                  onClick={() => updateStatus.mutate({ id: w.id, status: "rejected" })}
                >
                  <XCircle size={14} className="mr-1" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AdminWithdrawalsPage;
