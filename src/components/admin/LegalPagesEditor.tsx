import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Shield, FileText, Save, Eye } from "lucide-react";
import { toast } from "sonner";

interface LegalPage {
  id: string;
  page_type: string;
  title: string;
  content: string;
}

const LegalPagesEditor = () => {
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    const { data, error } = await supabase
      .from("legal_pages")
      .select("*")
      .order("page_type");
    if (error) {
      toast.error("Failed to load legal pages");
    } else {
      setPages((data as LegalPage[]) || []);
    }
    setLoading(false);
  };

  const handleSave = async (page: LegalPage) => {
    setSaving(page.page_type);
    const { error } = await supabase
      .from("legal_pages")
      .update({ content: page.content, updated_at: new Date().toISOString() })
      .eq("id", page.id);

    if (error) {
      toast.error("Failed to save " + page.title);
    } else {
      toast.success(page.title + " saved!");
    }
    setSaving(null);
  };

  const updateContent = (pageType: string, content: string) => {
    setPages(prev => prev.map(p => p.page_type === pageType ? { ...p, content } : p));
  };

  const getPreviewUrl = (pageType: string) =>
    pageType === "privacy_policy" ? "/privacy-policy" : "/terms";

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Legal Pages</h2>
        </div>
        <div className="h-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/50 p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Legal Pages</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-3">
        Edit content below. Leave empty to use default static content. HTML is not supported — use plain text.
      </p>

      {pages.map((page) => (
        <div key={page.page_type} className="space-y-3 border border-border/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-sm text-foreground">{page.title}</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => window.open(getPreviewUrl(page.page_type), "_blank")}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
          </div>

          <Textarea
            value={page.content}
            onChange={(e) => updateContent(page.page_type, e.target.value)}
            placeholder={`Enter ${page.title} content here... Each paragraph on a new line. Use "## Section Title" for headings.`}
            className="min-h-[200px] text-sm font-mono"
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {page.content ? `${page.content.length} characters` : "Using default content"}
            </span>
            <Button
              size="sm"
              onClick={() => handleSave(page)}
              disabled={saving === page.page_type}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving === page.page_type ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LegalPagesEditor;
