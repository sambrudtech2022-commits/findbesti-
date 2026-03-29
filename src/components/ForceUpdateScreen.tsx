import { Smartphone, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ForceUpdateScreenProps {
  currentVersion: string;
  requiredVersion: string;
}

const ForceUpdateScreen = ({ currentVersion, requiredVersion }: ForceUpdateScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Smartphone className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-foreground">Update Required</h1>
          <p className="text-sm text-muted-foreground">
            A new version of the app is available. Please update to continue using the app.
          </p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 space-y-1">
          <p className="text-xs text-muted-foreground">
            Current: <span className="font-bold text-foreground">v{currentVersion}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Required: <span className="font-bold text-primary">v{requiredVersion}</span>
          </p>
        </div>
        <Button
          onClick={() => window.open("https://play.google.com/store/apps/details?id=com.findbesti.app", "_blank")}
          className="w-full h-12 rounded-xl gap-2 font-bold"
        >
          <Download className="w-4 h-4" />
          Update Now
        </Button>
      </div>
    </div>
  );
};

export default ForceUpdateScreen;
