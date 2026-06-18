import { memo, useEffect, useMemo, useState } from "react";
import { ArrowRight, Newspaper } from "lucide-react";
import { Card, Skeleton } from "../ds-primitives";
import { getNews, type NewsDto } from "../../lib/api";
import { formatDate } from "../../lib/datetime";
import type { Language } from "../i18n-provider";

type L = Language;

interface NewsSectionProps {
  language: L;
  t: (key: string) => string;
  limit?: number;
}

function pickLocalized(item: NewsDto, language: L) {
  const lang = language;
  const tKey = `title_${lang}` as const;
  const bKey = `body_${lang}` as const;
  const title = item[tKey] || item.title_ru || item.title_en || item.title_kz || "";
  const body = item[bKey] || item.body_ru || item.body_en || item.body_kz || "";
  return { title, body };
}

function snippet(text: string, maxChars = 160): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}…`;
}

const NewsCard = memo(function NewsCard({ item, language, t }: { item: NewsDto; language: L; t: (k: string) => string }) {
  const { title, body } = pickLocalized(item, language);
  return (
    <Card className="flex flex-col gap-3 h-full overflow-hidden">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          width={480}
          height={260}
          loading="lazy"
          decoding="async"
          className="w-full h-[180px] object-cover rounded-lg"
          style={{ background: "var(--eco-surface)" }}
        />
      ) : (
        <div
          className="w-full h-[180px] rounded-lg flex items-center justify-center"
          style={{ background: "var(--eco-brand-50)" }}
        >
          <Newspaper size={28} style={{ color: "var(--eco-primary)" }} />
        </div>
      )}
      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
        {formatDate(item.publishedAt, language)}
      </div>
      <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>
        {title || "—"}
      </div>
      <div className="text-[13px] mt-auto" style={{ color: "var(--eco-text-secondary)" }}>
        {snippet(body)}
      </div>
      <div className="text-[12px] inline-flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
        {t("newsReadMore")} <ArrowRight size={13} />
      </div>
    </Card>
  );
});

function NewsSkeleton() {
  return (
    <Card className="flex flex-col gap-3 h-full">
      <Skeleton height={180} rounded={10} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="90%" height={12} />
    </Card>
  );
}

export function NewsSection({ language, t, limit = 6 }: NewsSectionProps) {
  const [items, setItems] = useState<NewsDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getNews(limit)
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const visible = useMemo(() => (items ?? []).slice(0, limit), [items, limit]);

  return (
    <section style={{ background: "var(--eco-surface)" }} className="px-4 sm:px-6 py-10 sm:py-12">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-[22px] sm:text-[24px]" style={{ color: "var(--eco-text)" }}>
              {t("newsSectionTitle")}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
              {t("newsSectionSubtitle")}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <NewsSkeleton key={i} />)}
          </div>
        ) : failed && visible.length === 0 ? (
          <Card className="text-center py-10 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {t("newsLoadFailed")}
          </Card>
        ) : visible.length === 0 ? (
          <Card className="text-center py-10">
            <div className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>{t("newsEmptyTitle")}</div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("newsEmptyDesc")}</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((item) => (
              <NewsCard key={item.id} item={item} language={language} t={t} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
