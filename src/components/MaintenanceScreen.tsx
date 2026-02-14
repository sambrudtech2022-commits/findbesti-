import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wrench } from "lucide-react";

const MaintenanceScreen = ({ children }: { children: React.ReactNode }) => {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("maintenance_mode, maintenance_message")
        .limit(1)
        .single();
      if (data) {
        setMaintenance(data.maintenance_mode);
        setMessage(data.maintenance_message || "App under maintenance. Please try again later.");
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (maintenance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
        <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <Wrench className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Under Maintenance</h1>
        <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default MaintenanceScreen;
