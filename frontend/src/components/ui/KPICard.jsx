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
      <div 
        className="bg-[#0D1424] border border-[#1E2D45] rounded-[10px] p-[20px_24px] relative overflow-hidden"
        style={{ borderTop: `2px solid ${accentColor}` }}
      >
        <div className="animate-pulse flex flex-col gap-3">
          <div className="h-3 bg-[#111827] rounded w-1/3"></div>
          <div className="h-8 bg-[#111827] rounded w-1/2"></div>
          <div className="h-4 bg-[#111827] rounded w-1/4 mt-2"></div>
        </div>
      </div>
    );
  }

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div 
      className="bg-[#0D1424] border border-[#1E2D45] rounded-[10px] p-[20px_24px] relative flex flex-col justify-between"
      style={{ borderTop: `2px solid ${accentColor}` }}
    >
      {Icon && (
        <div className="absolute top-[20px] right-[24px] text-[#1E2D45]">
          <Icon size={24} />
        </div>
      )}
      
      <div className="font-['DM_Sans'] text-[11px] uppercase tracking-[0.08em] text-[#8899AE] mb-2">
        {label}
      </div>
      
      <div className="font-['JetBrains_Mono'] text-[28px] font-bold text-[#E8EDF5]">
        {formatValue(value)}
      </div>
      
      <div className="mt-3 flex items-center gap-2">
        {delta !== null && delta !== undefined && (
          <span 
            className={`text-xs px-2 py-0.5 rounded-full font-['JetBrains_Mono'] ${
              isPositive ? 'bg-[#10B98120] text-[#10B981]' : 
              isNegative ? 'bg-[#F43F5E20] text-[#F43F5E]' : 
              'bg-[#1E2D4580] text-[#8899AE]'
            }`}
          >
            {isPositive ? '▲ +' : isNegative ? '▼ ' : ''}{Math.abs(delta)}{format === 'percent' || format === 'bps' ? '' : '%'}
          </span>
        )}
        {deltaLabel && (
          <span className="text-[10px] text-[#4A5A6B] font-['DM_Sans']">
            {deltaLabel}
          </span>
        )}
      </div>
    </div>
  );
};

export default KPICard;
