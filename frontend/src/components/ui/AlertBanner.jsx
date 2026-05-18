import { AlertTriangle, Info } from 'lucide-react';

const AlertBanner = ({ title, message, variant = 'info' }) => {
  const accent =
    variant === 'danger'
      ? 'var(--djup-negative)'
      : variant === 'warning'
      ? 'var(--djup-primary)'
      : 'var(--djup-text-muted)';

  const Icon = variant === 'info' ? Info : AlertTriangle;

  return (
    <div
      className="w-full p-4 flex gap-3 items-start border border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel)] mb-4"
      style={{ borderRadius: 0, borderLeft: `2px solid ${accent}` }}
    >
      <Icon style={{ color: accent }} size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
      <div className="flex flex-col">
        <h4 className="text-[12px] font-semibold text-[var(--djup-text)] font-['Inter']">{title}</h4>
        {message && (
          <p className="text-[11px] font-mono text-[var(--djup-text-muted)] mt-1 leading-relaxed">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
