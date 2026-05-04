import React from 'react';

const KPICard = ({ label, value, delta, deltaLabel, format, accentColor = '#00C8E0', icon: Icon, loading }) => {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '-';
    if (format === 'percent') return `${val}%`;
    if (format === 'bps') return `${val} bps`;
    if (format === 'currency') {
      const absVal = Math.abs(val);
      const suffix = absVal >= 1000 ? 'B' : 'M';
      const formatted = absVal >= 1000 ? (absVal / 1000).toFixed(2) : absVal.toFixed(2);
      return `${val < 0 ? '-' : ''}$${formatted}${suffix}`;
    }
    return val;
  };

  if (loading) {
    return (
      <div className="premium-card p-6 relative overflow-hidden">
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-2.5 bg-[#1E2D45] rounded w-1/3"></div>
          <div className="h-8 bg-[#1E2D45] rounded w-1/2"></div>
          <div className="h-3 bg-[#1E2D45] rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className="premium-card p-7 group relative flex flex-col justify-between hover:-translate-y-1 overflow-hidden">
      {/* Accent Light */}
      <div 
        className="absolute top-0 left-0 w-full h-[3px] opacity-80 group-hover:h-[4px] transition-all"
        style={{ backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}40` }}
      />
      
      {/* Background Gradient */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-transparent to-[#ffffff03] rounded-full pointer-events-none" />

      <div className="flex justify-between items-start mb-6">
        <div className="font-['DM_Sans'] text-[10px] uppercase tracking-[0.15em] text-[#64748B] font-bold">
          {label}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-[#070B14] border border-[#1E2D45] text-[#94A3B8] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)] transition-all">
            <Icon size={18} strokeWidth={2.5} />
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-1.5">
        <div className="font-['Outfit'] text-[32px] font-bold text-[#F8FAFC] tracking-tight">
          {formatValue(value)}
        </div>
        
        <div className="flex items-center gap-2.5">
          {delta !== null && delta !== undefined && (
            <div 
              className={`flex items-center gap-1 text-[11px] font-bold font-mono px-2 py-0.5 rounded-md ${
                isPositive ? 'bg-[#10B98115] text-[#10B981]' : 
                isNegative ? 'bg-[#F43F5E15] text-[#F43F5E]' : 
                'bg-[#1E2D45] text-[#64748B]'
              }`}
            >
              <span className="text-[9px]">{isPositive ? '▲' : isNegative ? '▼' : '•'}</span>
              <span>{Math.abs(delta)}{format === 'percent' || format === 'bps' ? '' : '%'}</span>
            </div>
          )}
          {deltaLabel && (
            <span className="text-[11px] text-[#475569] font-medium">
              {deltaLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default KPICard;
