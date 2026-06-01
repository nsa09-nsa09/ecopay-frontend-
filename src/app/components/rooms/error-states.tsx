import { Link } from "react-router";
import { Card, Button } from "../ds-primitives";
import { Users, AlertTriangle, ShieldX, ArrowLeft, RefreshCw, LifeBuoy } from "lucide-react";
import { useI18n } from "../i18n-provider";

export function RoomFullPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-warning-100)" }}>
        <Users size={24} style={{ color: "var(--eco-warning)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{t("roomIsFull")}</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("roomFullDescLong")}
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>{t("roomDetailsLabel")}</div>
        {[
          { label: t("plan"), value: "Beeline Family 4" },
          { label: t("seats"), value: t("seatsFull") },
          { label: t("operator"), value: "Beeline" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button variant="primary">{t("browseCatalog")}</Button>
        </Link>
        <Link to="/rooms/create" style={{ textDecoration: "none" }}>
          <Button variant="secondary">{t("createYourOwnRoom")}</Button>
        </Link>
      </div>
    </div>
  );
}

export function PaymentFailedPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-danger-100)" }}>
        <AlertTriangle size={24} style={{ color: "var(--eco-negative)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{t("paymentFailed")}</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("paymentCouldNotProcess")}
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>{t("paymentDetails")}</div>
        {[
          { label: t("amount"), value: "₸5,199", isError: false },
          { label: t("room"), value: "Beeline Family 4", isError: false },
          { label: t("error"), value: t("insufficientFunds"), isError: true },
          { label: t("intentIdLabel"), value: "pi_3M...xK7d", isError: false },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: row.isError ? "var(--eco-negative)" : "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary">
          <RefreshCw size={14} /> {t("retryPaymentAction")}
        </Button>
        <Link to="/support/new" style={{ textDecoration: "none" }}>
          <Button variant="secondary">
            <LifeBuoy size={14} /> {t("contactSupport")}
          </Button>
        </Link>
      </div>
      <p className="text-[12px] mt-4" style={{ color: "var(--eco-text-tertiary)" }}>
        {t("paymentIntentValid24h")}
      </p>
    </div>
  );
}

export function RoomBlockedPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-danger-100)" }}>
        <ShieldX size={24} style={{ color: "var(--eco-negative)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>{t("roomBlockedTitle")}</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("roomBlockedDescLong")}
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>{t("detailsLabel")}</div>
        {[
          { label: t("room"), value: "Kcell Group 3", isStatus: false },
          { label: t("status"), value: t("roomStatus.BLOCKED"), isStatus: true },
          { label: t("reason"), value: t("adminDecisionPendingReview"), isStatus: false },
          { label: t("blockedOn"), value: "2026-04-01", isStatus: false },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: row.isStatus ? "var(--eco-negative)" : "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col gap-3 items-center">
        <div className="p-4 rounded-lg text-[13px] w-full" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
          {t("roomBlockedSupportNote")}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/support/new" style={{ textDecoration: "none" }}>
            <Button variant="primary">
              <LifeBuoy size={14} /> {t("contactSupport")}
            </Button>
          </Link>
          <Link to="/rooms" style={{ textDecoration: "none" }}>
            <Button variant="ghost">
              <ArrowLeft size={14} /> {t("backToMyRooms")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
