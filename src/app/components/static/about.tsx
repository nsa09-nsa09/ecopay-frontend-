import { WaveDivider } from "../ds-primitives";
import { Mail, Phone, MapPin, Shield, Users, Zap } from "lucide-react";

export function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-[32px] sm:text-[40px] tracking-tight mb-4" style={{ color: "var(--eco-text)" }}>
            About EcoPay
          </h1>
          <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
            Kazakhstan's trusted platform for shared telecom plans
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-6 py-12">
        {/* Mission */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
              <Zap size={20} style={{ color: "var(--eco-primary)" }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>Our Mission</h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                EcoPay makes telecom family plans accessible to everyone in Kazakhstan. Join a shared room, split the cost, and save up to 70% on your monthly bill—no contracts, no hassle.
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Privacy */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
              <Shield size={20} style={{ color: "var(--eco-primary)" }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>Trust & Privacy First</h2>
              <p className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--eco-text-secondary)" }}>
                Your personal information is never shared between users. All transactions are secure, and all communication happens through our support system—no direct user-to-user contact.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>Verified payment processing</span>
                </li>
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>No personal contact details shared</span>
                </li>
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>Support-only communication model</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Help */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
              <Users size={20} style={{ color: "var(--eco-primary)" }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>How We Help</h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                We connect people who want to share family plans from Kazakhstan's major telecom operators: Beeline, Activ, Altel, Tele2, and Kcell. Our platform handles payments, verification, and support so you can focus on savings.
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 border-t" style={{ borderColor: "var(--eco-border)" }} />

        {/* Contact Section */}
        <section>
          <h2 className="text-[20px] mb-6" style={{ color: "var(--eco-text)" }}>Get in Touch</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>+7 747 226 6885</p>
                <p className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  (Business contact, subject to change before launch)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px]" style={{ color: "var(--eco-text)" }}>support@ecopay.kz</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px]" style={{ color: "var(--eco-text)" }}>Almaty, Kazakhstan</p>
              </div>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              <strong style={{ color: "var(--eco-text)" }}>Developed by Apex Digital</strong>
              <br />
              Building trust through technology
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
