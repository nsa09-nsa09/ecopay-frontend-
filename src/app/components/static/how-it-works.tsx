import { WaveDivider, Card } from "../ds-primitives";
import { UserPlus, Key, CreditCard, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

export function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      number: 1,
      title: "Create or Join a Room",
      description: "Browse available shared plans by operator (Beeline, Activ, Altel, Tele2, Kcell) and join an existing room, or create your own if you have a family plan to share.",
      details: ["Pick your operator and plan", "See available slots", "Instant room creation"],
    },
    {
      icon: Key,
      number: 2,
      title: "Enter Your Identifier",
      description: "Provide your telecom identifier (phone number or account ID) so the plan owner can add you to their family plan. Your contact info stays private—only verified identifiers are shared.",
      details: ["Secure identifier submission", "No personal contact sharing", "Verified by platform"],
    },
    {
      icon: CreditCard,
      number: 3,
      title: "Pay Your Share",
      description: "Pay your monthly share securely through the platform. Payments are held in escrow and released to the room owner once service is confirmed active.",
      details: ["Secure payment processing", "Escrow protection", "Transparent pricing"],
    },
    {
      icon: CheckCircle,
      number: 4,
      title: "Verify & Activate",
      description: "The room owner adds you to their plan. Once verified, your service activates and you start saving. All coordination happens through support tickets—no direct user contact needed.",
      details: ["Owner adds you to plan", "Platform verification", "Service activation confirmed"],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[900px] mx-auto text-center">
          <h1 className="text-[32px] sm:text-[40px] tracking-tight mb-4" style={{ color: "var(--eco-text)" }}>
            How EcoPay Works
          </h1>
          <p className="text-[16px] max-w-[600px] mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
            Join shared telecom plans in four simple steps. Save money without the hassle.
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Steps */}
      <div className="max-w-[900px] mx-auto px-6 py-12">
        <div className="space-y-12">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line (except for last item) */}
                {idx < steps.length - 1 && (
                  <div
                    className="hidden md:block absolute left-[28px] top-[60px] w-0.5 h-[calc(100%+24px)]"
                    style={{ background: "var(--eco-border)" }}
                  />
                )}

                <div className="flex flex-col md:flex-row gap-6">
                  {/* Icon & Number */}
                  <div className="shrink-0 flex flex-col items-center md:items-start">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative z-10"
                      style={{ background: "var(--eco-primary)" }}
                    >
                      <Icon size={26} style={{ color: "#fff" }} />
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
                      style={{ background: "var(--eco-surface)", color: "var(--eco-text)", border: "2px solid var(--eco-primary)" }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h2 className="text-[22px] mb-3" style={{ color: "var(--eco-text)" }}>
                      {step.title}
                    </h2>
                    <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                      {step.description}
                    </p>

                    {/* Details */}
                    <div className="flex flex-wrap gap-2">
                      {step.details.map((detail) => (
                        <span
                          key={detail}
                          className="px-3 py-1.5 rounded-lg text-[12px]"
                          style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Notice */}
        <div className="mt-12 p-6 rounded-xl border-2" style={{ background: "var(--eco-surface)", borderColor: "var(--eco-warning-500)" }}>
          <div className="flex items-start gap-4">
            <AlertCircle size={24} className="shrink-0 mt-1" style={{ color: "var(--eco-warning-500)" }} />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: "var(--eco-text)" }}>
                Important: No User-to-User Chat
              </h3>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                EcoPay does not provide direct messaging between users. All communication, questions, and coordination happen through official support tickets monitored by our team. This protects your privacy and ensures all interactions are secure and documented.
              </p>
            </div>
          </div>
        </div>

        {/* Support CTA */}
        <div className="mt-8 p-6 rounded-xl" style={{ background: "var(--eco-brand-50)" }}>
          <div className="flex items-start gap-4">
            <MessageSquare size={24} className="shrink-0 mt-1" style={{ color: "var(--eco-primary)" }} />
            <div>
              <h3 className="text-[16px] mb-2" style={{ color: "var(--eco-text)" }}>
                Need Help?
              </h3>
              <p className="text-[14px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                Our support team is here to help with any questions about joining rooms, payments, or plan activation.
              </p>
              <a
                href="/support/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] transition-colors"
                style={{ background: "var(--eco-primary)", color: "#fff", textDecoration: "none" }}
              >
                Create Support Ticket
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <WaveDivider />
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[600px] mx-auto text-center">
          <h2 className="text-[28px] mb-3" style={{ color: "var(--eco-text)" }}>
            Ready to Start Saving?
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            Browse available plans from Kazakhstan's top operators and join a room today.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-[15px] transition-colors"
            style={{ background: "var(--eco-primary)", color: "#fff", textDecoration: "none" }}
          >
            View Catalog
          </a>
        </div>
      </div>
    </div>
  );
}
