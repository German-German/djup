import React from 'react';

const ChartPanel = ({ title, subtitle, children, height = 400, action }) => {
  return (
    <div className="premium-card flex flex-col w-full h-full overflow-hidden">
      <div className="px-6 py-5 border-b border-[#1E2D45] flex justify-between items-center bg-[#0D1424]/20">
        <div>
          <h3 className="font-['Outfit'] text-[15px] font-bold text-[#F8FAFC] tracking-tight">{title}</h3>
          {subtitle && <p className="font-['DM_Sans'] text-[11px] text-[#64748B] mt-0.5 uppercase tracking-wider">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6 flex-1 relative" style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel rounded-lg p-4 font-mono text-[11px] shadow-2xl border-[#334155]">
        <p className="text-[#F8FAFC] mb-2.5 font-bold border-b border-[#1E2D45] pb-2 uppercase tracking-widest text-[10px]">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-[#94A3B8] whitespace-nowrap">{entry.name}</span>
              </div>
              <span className="text-[#F8FAFC] font-bold">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default ChartPanel;
