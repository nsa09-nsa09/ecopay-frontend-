import { WaveDivider } from "../ds-primitives";
import { FileText, Calendar } from "lucide-react";

export function TermsPage() {
  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms", preview: "By accessing and using EcoSplit, you agree to be bound by these Terms of Service..." },
    { id: "eligibility", title: "2. Eligibility", preview: "You must be at least 18 years old and a resident of Kazakhstan to use this service..." },
    { id: "accounts", title: "3. User Accounts", preview: "You are responsible for maintaining the confidentiality of your account credentials..." },
    { id: "services", title: "4. Description of Services", preview: "EcoSplit provides a platform to facilitate shared telecom family plans between users..." },
    { id: "payments", title: "5. Payments & Billing", preview: "All payments are processed securely. You agree to pay all fees associated with your subscription..." },
    { id: "user-conduct", title: "6. User Conduct", preview: "You agree not to misuse the platform, engage in fraudulent activity, or violate any laws..." },
    { id: "privacy", title: "7. Privacy & Data Protection", preview: "Your use of EcoSplit is also governed by our Privacy Policy, which can be found separately..." },
    { id: "termination", title: "8. Termination", preview: "We reserve the right to suspend or terminate your account for violations of these terms..." },
    { id: "disclaimers", title: "9. Disclaimers & Limitations", preview: "EcoSplit is provided \"as is\" without warranties of any kind, express or implied..." },
    { id: "changes", title: "10. Changes to Terms", preview: "We may update these terms from time to time. Continued use constitutes acceptance..." },
    { id: "contact", title: "11. Contact & Support", preview: "For questions about these terms, please contact us through our support system..." },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <FileText size={32} style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[26px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
              Terms of Service
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            <Calendar size={14} />
            <span>Last updated: April 3, 2026</span>
          </div>
        </div>
      </div>
      <WaveDivider flip />

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            <strong style={{ color: "var(--eco-text)" }}>Notice:</strong> This is a simplified MVP version of our Terms of Service. The complete legal document will be finalized before launch with input from legal counsel.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="pb-6 border-b" style={{ borderColor: "var(--eco-border)" }}>
              <h2 className="text-[18px] mb-3" style={{ color: "var(--eco-text)" }}>
                {section.title}
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                {section.preview}
              </p>
              <div className="mt-3 p-3 rounded-lg" style={{ background: "var(--eco-neutral-50)" }}>
                <p className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  [Full legal text for this section will be added by legal team before launch]
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom notice */}
        <div className="mt-12 p-4 rounded-lg border" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}>
          <p className="text-[13px] mb-2" style={{ color: "var(--eco-text)" }}>
            <strong>Questions about our terms?</strong>
          </p>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Please contact our support team or email legal@ecopay.kz
          </p>
        </div>
      </div>
    </div>
  );
}
