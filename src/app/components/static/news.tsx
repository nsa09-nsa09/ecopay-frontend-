import { useI18n } from "../i18n-provider";
import { NewsSection } from "../catalog/home-news";

export function NewsPage() {
  const { language, t } = useI18n();
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8">
        <h1
          className="text-[28px] sm:text-[34px] leading-tight tracking-tight"
          style={{ color: "var(--eco-text)", fontWeight: 700 }}
        >
          {t("news")}
        </h1>
        <p className="text-[14px] mt-2 max-w-2xl" style={{ color: "var(--eco-text-secondary)" }}>
          {t("newsSectionSubtitle")}
        </p>
      </header>
      <NewsSection language={language} t={t} mode="page" limit={24} />
    </div>
  );
}
