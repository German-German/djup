import React from 'react';

const Badge = ({ label, variant = 'loan-type' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'non-accrual':
        return 'bg-[#F6465D20] text-[#F6465D] border-[#F6465D40]';
      case 'second-lien':
        return 'bg-[#8B5CF620] text-[#8B5CF6] border-[#8B5CF640]';
      case 'unitranche':
        return 'bg-[#32D7FF20] text-[#32D7FF] border-[#32D7FF40]';
      case 'status':
        return 'bg-[#FCD53520] text-[#FCD535] border-[#FCD53540]';
      default: // first-lien or performing
        return 'bg-[#0ECB8120] text-[#0ECB81] border-[#0ECB8140]';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${getStyles()}`}>
      {label}
    </span>
  );
};

export default Badge;
