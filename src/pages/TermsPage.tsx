import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const defaultContent = `Last updated: March 31, 2026

## 1. Acceptance of Terms
By downloading, installing, or using FindBesti ("the App"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the App.

## 2. Eligibility
You must be at least 18 years old to use FindBesti. By using the App, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.

## 3. Account Registration
• You must provide accurate and complete information during registration.
• You are responsible for maintaining the confidentiality of your account credentials.
• You are responsible for all activities that occur under your account.
• One person may only create and maintain one account.

## 4. User Conduct
You agree not to:
• Use the App for any unlawful or fraudulent purpose
• Harass, abuse, or threaten other users
• Share explicit, offensive, or inappropriate content
• Impersonate any person or entity
• Use bots, scripts, or automated methods to interact with the App
• Attempt to hack, reverse-engineer, or compromise the App's security
• Solicit money or personal information from other users

## 5. Virtual Coins & Purchases
• Coins are virtual currency with no real-world monetary value outside the App.
• All coin purchases are final and non-refundable unless required by applicable law.
• Coins cannot be transferred between accounts.
• We reserve the right to modify coin pricing and packages at any time.
• Earned coins may be withdrawn subject to minimum thresholds and verification.

## 6. Premium Subscriptions
• Premium plans provide additional features for a specified duration.
• Subscriptions are non-refundable once activated.
• Features included in premium plans may change over time.
• We reserve the right to modify subscription pricing with prior notice.

## 7. Video & Audio Calls
• Calls consume coins based on the applicable rate per minute.
• Recording calls without the other party's consent is strictly prohibited.
• We are not responsible for call quality issues caused by your internet connection.
• Any inappropriate behavior during calls may result in immediate account suspension.

## 8. Content Ownership
You retain ownership of content you create. By posting content on FindBesti, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App for operational purposes.

## 9. Account Termination
We reserve the right to suspend or terminate your account at any time if you violate these terms, engage in fraudulent activity, or behave in a manner harmful to other users or the platform. Upon termination, any unused coins or active subscriptions will be forfeited.

## 10. Disclaimers
• FindBesti is provided "as is" without warranties of any kind.
• We do not guarantee uninterrupted or error-free service.
• We are not responsible for interactions between users.
• We do not verify the identity or background of users.

## 11. Limitation of Liability
To the maximum extent permitted by law, FindBesti and its team shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including but not limited to loss of data, revenue, or profits.

## 12. Governing Law
These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.

## 13. Changes to Terms
We may update these Terms from time to time. Continued use of FindBesti after changes constitutes acceptance of the updated terms. We will notify users of significant changes through the App.

## 14. Contact Us
For questions about these Terms & Conditions, contact us at:
support@findbesti.com`;

const TermsPage = () => {
  const navigate = useNavigate();

  const { data: dbContent } = useQuery({
    queryKey: ["legal-page", "terms_conditions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("legal_pages")
        .select("content")
        .eq("page_type", "terms_conditions")
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
          <h1 className="text-lg font-extrabold text-foreground">Terms & Conditions</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-2 text-sm text-muted-foreground leading-relaxed">
        {renderContent(content)}
      </div>
    </div>
  );
};

export default TermsPage;
