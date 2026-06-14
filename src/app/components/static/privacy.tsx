import { WaveDivider } from "../ds-primitives";
import { Shield, Lock, Eye, UserX, Database, MessageSquare, Calendar } from "lucide-react";

export function PrivacyPage() {
  const principles = [
    {
      icon: Lock,
      title: "Your Data is Encrypted",
      description: "All personal information and payment data is encrypted in transit and at rest using industry-standard protocols.",
    },
    {
      icon: UserX,
      title: "No Contact Sharing",
      description: "We never share your phone number, email, or personal details with other users. All coordination happens through our platform.",
    },
    {
      icon: MessageSquare,
      title: "Support-Only Communication",
      description: "There is no direct user-to-user messaging. All communication is handled through official support tickets monitored by our team.",
    },
    {
      icon: Eye,
      title: "Transparent Data Usage",
      description: "We only collect data necessary to provide our service. You can request to see, export, or delete your data at any time.",
    },
    {
      icon: Database,
      title: "Minimal Data Collection",
      description: "We collect only essential information: name, email, phone number, and payment details. No browsing history, location tracking, or third-party analytics.",
    },
    {
      icon: Shield,
      title: "Compliance & Protection",
      description: "We comply with Kazakhstan data protection regulations and international best practices to keep your information safe.",
    },
  ];

  const dataCollected = [
    { category: "Account Information", items: ["Full name", "Email address", "Phone number", "Password (hashed)"] },
    { category: "Payment Information", items: ["Payment method details", "Transaction history", "Billing address"] },
    { category: "Usage Data", items: ["Room participation history", "Support ticket records", "Login activity"] },
    { category: "Technical Data", items: ["IP address", "Browser type", "Device information"] },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Shield size={32} style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[26px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
              Privacy Policy
            </h1>
          </div>
          <p className="text-[16px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>
            Your privacy is our priority. Here's how we protect your data.
          </p>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <Calendar size={14} />
            <span>Last updated: April 3, 2026</span>
          </div>
        </div>
      </div>
      <WaveDivider flip />

      {/* Privacy Principles */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Our Privacy Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <div key={principle.title} className="p-5 rounded-xl border" style={{ background: "var(--eco-surface)", borderColor: "var(--eco-border)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
                    <Icon size={20} style={{ color: "var(--eco-primary)" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] mb-2" style={{ color: "var(--eco-text)" }}>
                      {principle.title}
                    </h3>
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                      {principle.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-12 border-t" style={{ borderColor: "var(--eco-border)" }} />

        {/* Data We Collect */}
        <h2 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>What Data We Collect</h2>
        <div className="space-y-6 mb-12">
          {dataCollected.map((section) => (
            <div key={section.category} className="p-5 rounded-xl" style={{ background: "var(--eco-surface)" }}>
              <h3 className="text-[15px] mb-3" style={{ color: "var(--eco-text)" }}>
                {section.category}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--eco-primary)" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Key Commitments */}
        <div className="p-6 rounded-xl border-2" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-primary)" }}>
          <h3 className="text-[18px] mb-4" style={{ color: "var(--eco-text)" }}>
            Key Commitments
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>No selling:</strong> We never sell your data to third parties.</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>No user-to-user sharing:</strong> Your contact information is never shared with other users.</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>Right to deletion:</strong> You can request account and data deletion at any time.</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>Data portability:</strong> You can export your data in a standard format.</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-12 p-5 rounded-xl" style={{ background: "var(--eco-surface)" }}>
          <h3 className="text-[15px] mb-2" style={{ color: "var(--eco-text)" }}>
            Privacy Questions?
          </h3>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            If you have questions about this privacy policy or how we handle your data, contact us at <strong style={{ color: "var(--eco-primary)" }}>privacy@ecopay.kz</strong> or through our support system.
          </p>
        </div>
      </div>
    </div>
  );
}
