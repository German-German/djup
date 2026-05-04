import React from 'react';

const Badge = ({ label, variant = 'loan-type' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'first-lien':
        return 'bg-[#00C8E015] text-[#00C8E0]';
      case 'unitranche':
        return 'bg-[#8B5CF615] text-[#8B5CF6]';
      case 'second-lien':
        return 'bg-[#10B98115] text-[#10B981]';
      case 'mezzanine':
        return 'bg-[#F59E0B15] text-[#F59E0B]';
      case 'non-accrual':
        return 'bg-[#F43F5E15] border border-[#F43F5E40] text-[#F43F5E]';
      case 'warning':
        return 'bg-[#F59E0B15] text-[#F59E0B]';
      case 'loan-type':
      default:
        return 'bg-[#1E2D4580] border border-[#1E2D45] text-[#8899AE]';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-['DM_Sans'] uppercase tracking-wide ${getStyles()}`}>
      {label}
    </span>
  );
};

export default Badge;
