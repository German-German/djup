import { ArrowUpRight, ArrowDownRight, Minus, Loader2 } from 'lucide-react';

const KPICard = ({ label, value, delta, loading = false, highlight = false }) => {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className={`bg-[var(--djup-bg-panel)] border ${highlight ? 'border-[var(--djup-primary)]' : 'border-[var(--djup-border)]'} rounded-sm p-4 flex flex-col relative`}>
      <div className="mb-2">
        <span className="text-[11px] font-mono text-[var(--djup-text-muted)] tracking-widest uppercase">{label}</span>
      </div>

      <div className="flex items-baseline gap-3">
        {loading ? (
          <div className="h-8 flex items-center">
            <Loader2 className="w-5 h-5 text-[var(--djup-text-muted)] animate-spin" />
          </div>
        ) : (
          <span className="text-3xl font-bold text-[var(--djup-text)] font-mono leading-none tracking-tight">
            {value}
          </span>
        )}
        
        {!loading && delta !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-mono font-bold tracking-wider ${isPositive ? 'text-[var(--djup-green)]' : isNegative ? 'text-[var(--djup-red)]' : 'text-[var(--djup-text-muted)]'}`}>
            {isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : isNegative ? <ArrowDownRight size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
            <span>{Math.abs(delta)}%</span>
          </div>
        )}
      </div>

      {highlight && (
        <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--djup-primary)]" />
      )}
    </div>
  );
};

export default KPICard;
