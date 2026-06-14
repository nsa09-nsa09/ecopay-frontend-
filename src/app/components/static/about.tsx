import { WaveDivider } from "../ds-primitives";
import { Mail, Phone, MapPin, Shield, Users, Zap } from "lucide-react";
import { useI18n } from "../i18n-provider";

export function AboutPage() {
  const { t } = useI18n();

  return (
    <div>
      {/* Hero */}
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <h1 className="text-[32px] sm:text-[40px] tracking-tight mb-4" style={{ color: "var(--eco-text)" }}>
            {t("aboutEcoPay")}
          </h1>
          <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
            {t("aboutSubtitle")}
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
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>{t("ourMission")}</h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                {t("missionText")}
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
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>{t("trustPrivacyTitle")}</h2>
              <p className="text-[14px] leading-relaxed mb-3" style={{ color: "var(--eco-text-secondary)" }}>
                {t("trustPrivacyText")}
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>{t("bulletVerifiedPayments")}</span>
                </li>
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>{t("bulletNoPersonalContact")}</span>
                </li>
                <li className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <span className="shrink-0">•</span>
                  <span>{t("bulletSupportOnly")}</span>
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
              <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>{t("howWeHelpTitle")}</h2>
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                {t("howWeHelpText")}
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="my-12 border-t" style={{ borderColor: "var(--eco-border)" }} />

        {/* Contact Section */}
        <section>
          <h2 className="text-[20px] mb-6" style={{ color: "var(--eco-text)" }}>{t("contactGetInTouch")}</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>{t("contactPhoneNumber")}</p>
                <p className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  {t("contactPhoneNote")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("contactEmail")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
              <div>
                <p className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("contactLocation")}</p>
              </div>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              <strong style={{ color: "var(--eco-text)" }}>{t("developedBy")}</strong>
              <br />
              {t("buildingTrust")}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
