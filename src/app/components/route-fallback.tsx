export function RouteFallback() {
  return (
    <div
      className="flex items-center justify-center py-24"
      style={{ background: 'var(--eco-bg)', color: 'var(--eco-text-tertiary)' }}
      role="status"
      aria-live="polite"
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid var(--eco-border)',
          borderTopColor: 'var(--eco-primary)',
          display: 'inline-block',
          animation: 'ecopay-route-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes ecopay-route-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
