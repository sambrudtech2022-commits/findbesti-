import { ArrowLeft, CheckCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const AdminReportsPage = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background pb-6">
      <div className="gradient-primary pt-12 pb-6 px-4 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
          <h1 className="text-xl font-extrabold text-primary-foreground">Content Moderation</h1>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-2">
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
    </div>
  );
};

export default AdminReportsPage;
