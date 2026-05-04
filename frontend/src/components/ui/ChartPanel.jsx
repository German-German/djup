import React from 'react';

const ChartPanel = ({ title, subtitle, children, height = 400, action }) => {
  return (
    <div className="bg-[#0D1424] border border-[#1E2D45] rounded-[10px] flex flex-col w-full h-full">
      <div className="px-5 py-4 border-b border-[#1E2D45] flex justify-between items-center">
        <div>
          <h3 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">{title}</h3>
          {subtitle && <p className="font-['DM_Sans'] text-[11px] text-[#8899AE] mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-5 flex-1 relative" style={{ height: `${height}px` }}>
        {children}
      </div>
    </div>
  );
};

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0D1424] border border-[#334155] rounded p-3 font-['JetBrains_Mono'] text-[12px] shadow-lg">
        <p className="text-[#E8EDF5] mb-2 border-b border-[#1E2D45] pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 my-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-[#8899AE]">{entry.name}:</span>
            <span className="text-[#E8EDF5] font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default ChartPanel;
