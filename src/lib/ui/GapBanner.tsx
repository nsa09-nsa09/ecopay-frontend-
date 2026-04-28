import { AlertTriangle } from "lucide-react";

export function GapBanner({ label }: { label: string }) {
  return (
    <div
      className="mx-auto max-w-[1200px] my-4 px-4 py-3 rounded-lg flex items-start gap-2 text-[13px]"
      style={{
        background: "var(--eco-warning-100)",
        color: "var(--eco-text)",
        border: "1px solid var(--eco-warning)",
      }}
    >
      <AlertTriangle size={16} style={{ color: "var(--eco-warning)" }} className="mt-0.5 shrink-0" />
      <div>
        <strong>API gap:</strong> {label} The UI is shown with placeholder data; wire-up pending backend implementation (see plan gap-list).
      </div>
    </div>
  );
}
