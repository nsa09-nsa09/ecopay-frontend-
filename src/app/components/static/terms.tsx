import { useEffect, useState } from "react";
import { WaveDivider } from "../ds-primitives";
import { FileText, Calendar } from "lucide-react";
import { useI18n, type Language } from "../i18n-provider";
import {
  getLegalDocumentRequest,
  type LegalDocumentDto,
} from "../../lib/api";
import { formatDateTime } from "../../lib/datetime";

// Same fallback ladder used on the register page.
function pickLocalized(
  doc: LegalDocumentDto | null,
  field: "title" | "body",
  language: Language,
): string {
  if (!doc) return "";
  const primary = doc[`${field}_${language}` as keyof LegalDocumentDto] as string | null | undefined;
  if (primary && primary.trim()) return primary;
  const ru = doc[`${field}_ru` as keyof LegalDocumentDto] as string | null | undefined;
  if (ru && ru.trim()) return ru;
  const kz = doc[`${field}_kz` as keyof LegalDocumentDto] as string | null | undefined;
  if (kz && kz.trim()) return kz;
  const en = doc[`${field}_en` as keyof LegalDocumentDto] as string | null | undefined;
  return (en ?? "") as string;
}

export function TermsPage() {
  const { t, language } = useI18n();
  const [doc, setDoc] = useState<LegalDocumentDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getLegalDocumentRequest("terms")
      .then((data) => { if (!cancelled) setDoc(data); })
      .catch(() => { /* fall through to loading state */ });
    return () => { cancelled = true; };
  }, []);

  const title = pickLocalized(doc, "title", language) || t("terms");
  const body = pickLocalized(doc, "body", language);
  const updatedAt = doc?.updatedAt ?? null;
  const version = doc?.version ?? null;

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <FileText size={32} style={{ color: "var(--eco-primary)" }} />
            <h1 className="text-[26px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
              {title}
            </h1>
          </div>
          {(updatedAt || version != null) && (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              <Calendar size={14} />
              <span>
                {updatedAt ? formatDateTime(updatedAt, language) : ""}
                {version != null ? ` · v${version}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>
      <WaveDivider flip />

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
        {body ? (
          <div
            className="text-[14px] leading-relaxed whitespace-pre-line"
            style={{ color: "var(--eco-text-secondary)" }}
          >
            {body}
          </div>
        ) : (
          <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {t("loading")}
          </div>
        )}
      </div>
    </div>
  );
}
