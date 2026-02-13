import { CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminReportsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const resolveReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "resolved", resolved_by: user!.id, resolved_at: new Date().toISOString() })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report resolved");
    },
    onError: () => toast.error("Failed to resolve"),
  });

  return (
    <div className="space-y-2 max-w-2xl">
      {isLoading ? (
        Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
      ) : reports?.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No reports found</p>
      ) : (
        reports?.map((r) => (
          <div key={r.id} className="p-4 rounded-xl bg-card border border-border/50 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-sm text-foreground">{r.reason}</p>
                {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                r.status === "pending" ? "bg-accent/20 text-accent" : "bg-online/20 text-online"
              }`}>
                {r.status}
              </span>
            </div>
            {r.status === "pending" && (
              <Button
                size="sm"
                className="w-full rounded-lg h-8 text-xs"
                onClick={() => resolveReport.mutate(r.id)}
              >
                <CheckCircle size={14} className="mr-1" /> Mark Resolved
              </Button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default AdminReportsPage;
