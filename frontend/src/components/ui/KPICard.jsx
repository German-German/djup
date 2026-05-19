import { ArrowUp, ArrowDown, Minus, Loader2 } from 'lucide-react';

const KPICard = ({ label, value, delta, loading = false, highlight = false, unit, hint }) => {
  const hasDelta = typeof delta === 'number';
  const isPositive = hasDelta && delta > 0;
  const isNegative = hasDelta && delta < 0;
  const deltaTone = isPositive
    ? 'text-[var(--djup-positive)]'
    : isNegative
    ? 'text-[var(--djup-negative)]'
    : 'text-[var(--djup-text-faint)]';

  return (
    <div
      className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] p-5 flex flex-col gap-4 relative"
      style={{ borderRadius: 'var(--r-md)' }}
    >
      {highlight && (
        <span
          className="absolute top-0 left-0 w-1 h-full"
          style={{ background: 'var(--djup-primary)', borderTopLeftRadius: 'var(--r-md)', borderBottomLeftRadius: 'var(--r-md)' }}
        />
      )}

      <div className="djup-section-label">{label}</div>

      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        {loading ? (
          <Loader2 className="w-5 h-5 text-[var(--djup-text-faint)] animate-spin" />
        ) : (
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="font-num text-[28px] font-semibold text-[var(--djup-text)] leading-none tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-[13px] text-[var(--djup-text-muted)] leading-none">{unit}</span>
            )}
          </div>
        )}

        {!loading && hasDelta && (
          <div className={`inline-flex items-center gap-1 text-[12px] font-medium tabular-nums ${deltaTone}`}>
            {isPositive ? (
              <ArrowUp size={12} strokeWidth={2.4} />
            ) : isNegative ? (
              <ArrowDown size={12} strokeWidth={2.4} />
            ) : (
              <Minus size={12} strokeWidth={2.4} />
            )}
            <span>{Math.abs(delta).toFixed(2)}%</span>
          </div>
        )}
      </div>

      {hint && (
        <div className="text-[12px] text-[var(--djup-text-faint)] leading-snug">{hint}</div>
      )}
    </div>
  );
};

export default KPICard;
