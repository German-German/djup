import { Sparkles, Activity } from 'lucide-react';

const Badge = ({ label, variant = 'loan-type', icon: Icon }) => {
  const getStyles = () => {
    switch (variant) {
      case 'non-accrual':
      case 'danger':
        return 'bg-[rgba(255,107,107,0.1)] text-[var(--djup-red)] border-[var(--djup-red)]';
      case 'second-lien':
      case 'purple':
        return 'bg-[rgba(180,92,255,0.1)] text-[var(--djup-purple)] border-[var(--djup-purple)]';
      case 'unitranche':
      case 'info':
        return 'bg-[rgba(0,229,255,0.1)] text-[var(--djup-cyan)] border-[var(--djup-cyan)]';
      case 'status':
      case 'warning':
      case 'primary':
        return 'bg-[var(--djup-primary-soft)] text-[var(--djup-primary)] border-[var(--djup-primary)]';
      case 'ai':
        return 'bg-[rgba(180,92,255,0.1)] text-[var(--djup-purple)] border-[var(--djup-purple)]';
      default: // first-lien or performing
        return 'bg-[rgba(0,255,138,0.1)] text-[var(--djup-green)] border-[var(--djup-green)]';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[10px] font-mono font-bold tracking-widest uppercase border border-opacity-30 ${getStyles()}`}>
      {Icon && <Icon size={10} />}
      {variant === 'ai' && !Icon && <Sparkles size={10} />}
      {variant === 'live' && !Icon && <div className="w-1.5 h-1.5 rounded-full bg-[var(--djup-green)] animate-pulse" />}
      <span>{label}</span>
    </div>
  );
};

export default Badge;
