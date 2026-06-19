import { WaveDivider } from "../ds-primitives";
import { Shield, Lock, Eye, UserX, Database, MessageSquare, Calendar } from "lucide-react";
import { useI18n } from "../i18n-provider";

export function PrivacyPage() {
  const { t } = useI18n();

  const principles = [
    {
      icon: Lock,
      title: t("privacyPrincipleEncryptionTitle"),
      description: t("privacyPrincipleEncryptionDesc"),
    },
    {
      icon: UserX,
      title: t("privacyPrincipleNoContactTitle"),
      description: t("privacyPrincipleNoContactDesc"),
    },
    {
      icon: MessageSquare,
      title: t("privacyPrincipleSupportOnlyTitle"),
      description: t("privacyPrincipleSupportOnlyDesc"),
    },
    {
      icon: Eye,
      title: t("privacyPrincipleTransparentTitle"),
      description: t("privacyPrincipleTransparentDesc"),
    },
    {
      icon: Database,
      title: t("privacyPrincipleMinimalTitle"),
      description: t("privacyPrincipleMinimalDesc"),
    },
    {
      icon: Shield,
      title: t("privacyPrincipleComplianceTitle"),
      description: t("privacyPrincipleComplianceDesc"),
    },
  ];

  const dataCollected = [
    {
      category: t("privacyDataAccountTitle"),
      items: [
        t("privacyDataAccountItem1"),
        t("privacyDataAccountItem2"),
        t("privacyDataAccountItem3"),
        t("privacyDataAccountItem4"),
      ],
    },
    {
      category: t("privacyDataPaymentTitle"),
      items: [
        t("privacyDataPaymentItem1"),
        t("privacyDataPaymentItem2"),
        t("privacyDataPaymentItem3"),
      ],
    },
    {
      category: t("privacyDataUsageTitle"),
      items: [
        t("privacyDataUsageItem1"),
        t("privacyDataUsageItem2"),
        t("privacyDataUsageItem3"),
      ],
    },
    {
      category: t("privacyDataTechnicalTitle"),
      items: [
        t("privacyDataTechnicalItem1"),
        t("privacyDataTechnicalItem2"),
        t("privacyDataTechnicalItem3"),
      ],
    },
  ];

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Shield size={32} style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[26px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
              {t("privacyPolicy")}
            </h1>
          </div>
          <p className="text-[16px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>
            {t("privacyHeroSubtitle")}
          </p>
          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <Calendar size={14} />
            <span>{t("privacyLastUpdatedDate")}</span>
          </div>
        </div>
      </div>
      <WaveDivider flip />

      {/* Privacy Principles */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>{t("privacyPrinciplesHeading")}</h2>
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
        <h2 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>{t("privacyDataHeading")}</h2>
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
            {t("privacyCommitmentsHeading")}
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>{t("privacyCommitmentNoSellingLabel")}</strong> {t("privacyCommitmentNoSellingDesc")}</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>{t("privacyCommitmentNoUserSharingLabel")}</strong> {t("privacyCommitmentNoUserSharingDesc")}</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>{t("privacyCommitmentDeletionLabel")}</strong> {t("privacyCommitmentDeletionDesc")}</span>
            </li>
            <li className="flex items-start gap-3 text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              <span className="text-[16px]">✓</span>
              <span><strong style={{ color: "var(--eco-text)" }}>{t("privacyCommitmentPortabilityLabel")}</strong> {t("privacyCommitmentPortabilityDesc")}</span>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="mt-12 p-5 rounded-xl" style={{ background: "var(--eco-surface)" }}>
          <h3 className="text-[15px] mb-2" style={{ color: "var(--eco-text)" }}>
            {t("privacyContactHeading")}
          </h3>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {t("privacyContactDescBefore")}<strong style={{ color: "var(--eco-primary)" }}>privacy@ecopay.kz</strong>{t("privacyContactDescAfter")}
          </p>
        </div>
      </div>
    </div>
  );
}
