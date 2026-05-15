const Badge = ({ label, variant = 'loan-type' }) => {
  const getStyles = () => {
    switch (variant) {
      case 'non-accrual':
        return 'bg-[#EF444420] text-[#EF4444] border-[#EF444440]';
      case 'second-lien':
        return 'bg-[#8B5CF620] text-[#8B5CF6] border-[#8B5CF640]';
      case 'unitranche':
        return 'bg-[#32D7FF20] text-[#32D7FF] border-[#32D7FF40]';
      case 'status':
        return 'bg-[#F59E0B20] text-[#F59E0B] border-[#F59E0B40]';
      default: // first-lien or performing
        return 'bg-[#10B98120] text-[#10B981] border-[#10B98140]';
    }
  };

  return (
    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider border ${getStyles()}`}>
      {label}
    </span>
  );
};

export default Badge;
