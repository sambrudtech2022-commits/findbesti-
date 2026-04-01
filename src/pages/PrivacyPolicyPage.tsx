import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultContent = `Last updated: March 31, 2026

## 1. Information We Collect
We collect the following information when you use FindBesti:
• Account Info: Phone number, display name, gender, profile photo, and bio.
• Usage Data: App interactions, call duration, messages sent, and gifts exchanged.
• Device Info: Device model, OS version, unique device identifiers, and IP address.
• Payment Info: Transaction details processed through Razorpay (we do not store card details).

## 2. How We Use Your Information
• To create and manage your account
• To enable video/audio calls and messaging
• To process coin purchases and withdrawals
• To match you with other users
• To send notifications and updates
• To detect fraud and ensure platform safety
• To improve our services and user experience

## 3. Data Sharing
We do not sell your personal data. We may share limited information with:
• Service Providers: Payment processors, cloud hosting, and analytics tools.
• Other Users: Your public profile (name, photo, bio) is visible to other users.
• Legal Authorities: When required by law or to protect user safety.

## 4. Data Storage & Security
Your data is stored securely on encrypted cloud servers. We implement industry-standard security measures including encryption in transit (TLS) and at rest. However, no method of transmission over the internet is 100% secure.

## 5. Your Rights
• Access: Request a copy of your personal data.
• Correction: Update or correct inaccurate information.
• Deletion: Request deletion of your account and associated data.
• Withdraw Consent: Opt out of optional data processing at any time.

## 6. Cookies & Tracking
We use local storage and cookies to maintain your session, remember preferences (like language and dark mode), and improve app performance. You can clear this data through your browser or device settings.

## 7. Children's Privacy
FindBesti is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover that a minor has created an account, we will delete it immediately.

## 8. Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of significant changes through the app. Continued use of FindBesti after changes constitutes acceptance of the updated policy.

## 9. Contact Us
If you have questions about this Privacy Policy or your data, contact us at:
support@findbesti.com`;

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  const { data: dbContent } = useQuery({
    queryKey: ["legal-page", "privacy_policy"],
    queryFn: async () => {
      const { data } = await supabase
        .from("legal_pages")
        .select("content")
        .eq("page_type", "privacy_policy")
        .single();
      return data?.content || "";
    },
  });

  const content = dbContent || defaultContent;

  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith("## ")) {
        return <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-1">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("• ")) {
        const parts = trimmed.slice(2).split(":");
        if (parts.length > 1) {
          return (
            <li key={i} className="ml-5 list-disc">
              <strong className="text-foreground">{parts[0]}:</strong>{parts.slice(1).join(":")}
            </li>
          );
        }
        return <li key={i} className="ml-5 list-disc">{trimmed.slice(2)}</li>;
      }
      return <p key={i}>{trimmed}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-extrabold text-foreground">Privacy Policy</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {renderContent(content)}
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
