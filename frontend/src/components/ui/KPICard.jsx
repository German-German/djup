import { ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';

const KPICard = ({ label, value, delta, loading = false, highlight = false, unit }) => {
  const isPositive = typeof delta === 'number' && delta > 0;
  const isNegative = typeof delta === 'number' && delta < 0;
  const deltaColor = isPositive
    ? 'text-[var(--djup-positive)]'
    : isNegative
    ? 'text-[var(--djup-negative)]'
    : 'text-[var(--djup-text-faint)]';

  return (
    <div
      className={`bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] p-4 flex flex-col relative ${
        highlight ? 'border-l-2 border-l-[var(--djup-primary)]' : ''
      }`}
      style={{ borderRadius: 0 }}
    >
      <div className="djup-section-label mb-3">{label}</div>

      <div className="flex items-baseline justify-between gap-3">
        {loading ? (
          <Loader2 className="w-5 h-5 text-[var(--djup-text-faint)] animate-spin" />
        ) : (
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="text-[26px] font-mono font-semibold text-[var(--djup-text)] leading-none tracking-tight tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-[12px] font-mono text-[var(--djup-text-muted)] leading-none">{unit}</span>
            )}
          </div>
        )}

        {!loading && delta !== undefined && delta !== null && (
          <div className={`flex items-center gap-1 text-[11px] font-mono tabular-nums ${deltaColor}`}>
            {isPositive ? (
              <ArrowUp size={11} strokeWidth={2} />
            ) : isNegative ? (
              <ArrowDown size={11} strokeWidth={2} />
            ) : (
              <Minus size={11} strokeWidth={2} />
            )}
            <span>{Math.abs(delta).toFixed(2)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
