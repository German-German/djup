import { Maximize2, MoreHorizontal, Info } from 'lucide-react';

const ChartPanel = ({ title, subtitle, children, height = '100%' }) => {
  return (
    <div className="binance-panel flex flex-col h-full bg-[#121212] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#333333] flex justify-between items-center bg-[#1E1E1E]/30">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-bold text-[#F0F0F0] uppercase tracking-wider">{title}</h3>
            <Info size={12} className="text-[#707070] cursor-help" />
          </div>
          {subtitle && <span className="text-[10px] text-[#A0A0A0] font-medium mt-0.5">{subtitle}</span>}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-[#707070] hover:text-[#F0F0F0] transition-colors">
            <Maximize2 size={14} />
          </button>
          <button className="p-1.5 text-[#707070] hover:text-[#F0F0F0] transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 p-4" style={{ height }}>
        {children}
      </div>
    </div>
  );
};

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1E1E1E] border border-[#333333] p-3 rounded-lg shadow-2xl font-['JetBrains_Mono'] z-50">
        <p className="text-[#A0A0A0] text-[11px] mb-2 font-bold uppercase tracking-widest">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-[12px] text-[#F0F0F0]">{entry.name}:</span>
              </div>
              <span className="text-[12px] font-bold" style={{ color: entry.color }}>
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
                {entry.name.toLowerCase().includes('spread') ? ' bps' : '%'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default ChartPanel;
