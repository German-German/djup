import React from 'react';

const Badge = ({ label, variant = 'loan-type' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'first-lien':
        return 'bg-[#00C8E015] text-[#00C8E0] border-[#00C8E020]';
      case 'unitranche':
        return 'bg-[#8B5CF615] text-[#8B5CF6] border-[#8B5CF620]';
      case 'second-lien':
        return 'bg-[#10B98115] text-[#10B981] border-[#10B98120]';
      case 'mezzanine':
        return 'bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B20]';
      case 'non-accrual':
        return 'bg-[#F43F5E15] text-[#F43F5E] border-[#F43F5E40]';
      case 'warning':
        return 'bg-[#F59E0B15] text-[#F59E0B] border-[#F59E0B20]';
      case 'status':
        return 'bg-[#1E2D45] text-[#94A3B8] border-[#334155]';
      case 'loan-type':
      default:
        return 'bg-[#1E2D4550] text-[#64748B] border-[#1E2D45]';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.05em] font-mono ${getStyles()}`}>
      {label}
    </span>
  );
};

export default Badge;
