import { ArrowUpRight, ArrowDownRight, Minus, Loader2 } from 'lucide-react';

const KPICard = ({ label, value, delta, deltaLabel, icon: Icon, format = 'number', loading = false, accentColor = '#F59E0B' }) => {
  const formatValue = (val) => {
    if (val === null || val === undefined) return '--';
    if (format === 'percent') return `${val}%`;
    if (format === 'currency') return `$${val}B`;
    return val;
  };

  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div className="binance-panel p-4 flex flex-col relative overflow-hidden group hover:border-[#555555] transition-all">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold text-[#A0A0A0] uppercase tracking-wider">{label}</span>
        {Icon && <Icon size={16} style={{ color: accentColor }} className="opacity-60" />}
      </div>

      <div className="flex items-end gap-2">
        {loading ? (
          <div className="h-8 flex items-center">
            <Loader2 className="w-5 h-5 text-[#707070] animate-spin" />
          </div>
        ) : (
          <span className="text-[24px] font-bold text-[#F0F0F0] font-['JetBrains_Mono'] leading-none">
            {formatValue(value)}
          </span>
        )}
        
        {!loading && delta !== undefined && (
          <div className={`flex items-center gap-0.5 mb-1 text-[12px] font-bold ${isPositive ? 'text-[#10B981]' : isNegative ? 'text-[#EF4444]' : 'text-[#A0A0A0]'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : isNegative ? <ArrowDownRight size={14} /> : <Minus size={14} />}
            <span>{Math.abs(delta)}%</span>
          </div>
        )}
      </div>

      <div className="mt-2 text-[10px] text-[#707070] font-bold uppercase tracking-widest">
        {deltaLabel || '24H CHANGE'}
      </div>
      
      {/* Subtle Bottom Accent */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-transparent group-hover:w-full transition-all duration-300" style={{ backgroundColor: accentColor, width: '20%' }} />
    </div>
  );
};

export default KPICard;
