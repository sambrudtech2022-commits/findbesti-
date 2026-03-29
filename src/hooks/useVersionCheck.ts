import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APP_VERSION } from "@/config/appVersion";

const compareVersions = (current: string, required: string): boolean => {
  const c = current.split(".").map(Number);
  const r = required.split(".").map(Number);
  for (let i = 0; i < Math.max(c.length, r.length); i++) {
    const cv = c[i] || 0;
    const rv = r[i] || 0;
    if (cv < rv) return true; // needs update
    if (cv > rv) return false;
  }
  return false;
};

export const useVersionCheck = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState("");

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("min_app_version")
        .limit(1)
        .single();
      if (data?.min_app_version) {
        setRequiredVersion(data.min_app_version);
        setNeedsUpdate(compareVersions(APP_VERSION, data.min_app_version));
      }
    };
    check();
  }, []);

  return { needsUpdate, currentVersion: APP_VERSION, requiredVersion };
};
