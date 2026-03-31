import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();

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

      <div className="px-5 py-6 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p className="text-xs text-muted-foreground/60">Last updated: March 31, 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p>By downloading, installing, or using FindBesti ("the App"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the App.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Eligibility</h2>
          <p>You must be at least 18 years old to use FindBesti. By using the App, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these terms.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Account Registration</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You must provide accurate and complete information during registration.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You are responsible for all activities that occur under your account.</li>
            <li>One person may only create and maintain one account.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the App for any unlawful or fraudulent purpose</li>
            <li>Harass, abuse, or threaten other users</li>
            <li>Share explicit, offensive, or inappropriate content</li>
            <li>Impersonate any person or entity</li>
            <li>Use bots, scripts, or automated methods to interact with the App</li>
            <li>Attempt to hack, reverse-engineer, or compromise the App's security</li>
            <li>Solicit money or personal information from other users</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Virtual Coins & Purchases</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Coins are virtual currency with no real-world monetary value outside the App.</li>
            <li>All coin purchases are final and non-refundable unless required by applicable law.</li>
            <li>Coins cannot be transferred between accounts.</li>
            <li>We reserve the right to modify coin pricing and packages at any time.</li>
            <li>Earned coins may be withdrawn subject to minimum thresholds and verification.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Premium Subscriptions</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Premium plans provide additional features for a specified duration.</li>
            <li>Subscriptions are non-refundable once activated.</li>
            <li>Features included in premium plans may change over time.</li>
            <li>We reserve the right to modify subscription pricing with prior notice.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Video & Audio Calls</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Calls consume coins based on the applicable rate per minute.</li>
            <li>Recording calls without the other party's consent is strictly prohibited.</li>
            <li>We are not responsible for call quality issues caused by your internet connection.</li>
            <li>Any inappropriate behavior during calls may result in immediate account suspension.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Content Ownership</h2>
          <p>You retain ownership of content you create. By posting content on FindBesti, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the App for operational purposes.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Account Termination</h2>
          <p>We reserve the right to suspend or terminate your account at any time if you violate these terms, engage in fraudulent activity, or behave in a manner harmful to other users or the platform. Upon termination, any unused coins or active subscriptions will be forfeited.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">10. Disclaimers</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>FindBesti is provided "as is" without warranties of any kind.</li>
            <li>We do not guarantee uninterrupted or error-free service.</li>
            <li>We are not responsible for interactions between users.</li>
            <li>We do not verify the identity or background of users.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">11. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, FindBesti and its team shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the App, including but not limited to loss of data, revenue, or profits.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">12. Governing Law</h2>
          <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">13. Changes to Terms</h2>
          <p>We may update these Terms from time to time. Continued use of FindBesti after changes constitutes acceptance of the updated terms. We will notify users of significant changes through the App.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">14. Contact Us</h2>
          <p>For questions about these Terms & Conditions, contact us at:</p>
          <p className="text-foreground font-medium">support@findbesti.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
