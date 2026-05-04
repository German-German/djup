import React from 'react';

export const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px]">
      <div className="w-8 h-8 border-4 border-[#1E2D45] border-t-[#00C8E0] rounded-full animate-spin mb-3"></div>
      <div className="font-['DM_Sans'] text-[#8899AE] text-sm">Loading market data...</div>
    </div>
  );
};
