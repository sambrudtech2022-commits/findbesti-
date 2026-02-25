import { useEffect } from "react";

export const useScreenProtection = () => {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block Print Screen and common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        // Clear clipboard
        navigator.clipboard?.writeText?.("");
        return false;
      }
      // Ctrl+Shift+S (Windows Snipping), Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "I" || e.key === "i")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save)
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        return false;
      }
      // F12 (DevTools)
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }
    };

    // Blur content when tab is not visible (screen recording protection)
    const handleVisibilityChange = () => {
      const root = document.getElementById("root");
      if (root) {
        if (document.hidden) {
          root.style.filter = "blur(30px)";
          root.style.transition = "filter 0.1s";
        } else {
          root.style.filter = "none";
        }
      }
    };

    // Disable drag (prevents drag-save of images)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);
};
