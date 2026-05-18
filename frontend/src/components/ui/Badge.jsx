import { Sparkles } from 'lucide-react';

/**
 * Restrained, hard-edged tag. Tobacco accent for primary, gin for default,
 * muted desaturated tones for status (positive/negative). No glow, no gradients.
 */
const Badge = ({ label, variant = 'default', icon: Icon }) => {
  const tone = (() => {
    switch (variant) {
      case 'live':
        return 'text-[var(--djup-text)] border-[var(--djup-border-strong)]';
      case 'non-accrual':
      case 'danger':
        return 'text-[var(--djup-negative)] border-[var(--djup-negative)]/40';
      case 'warning':
      case 'primary':
      case 'status':
        return 'text-[var(--djup-primary)] border-[var(--djup-primary)]/40';
      case 'second-lien':
      case 'purple':
      case 'info':
      case 'unitranche':
      case 'ai':
        return 'text-[var(--djup-text-muted)] border-[var(--djup-border-strong)]';
      case 'first-lien':
      case 'loan-type':
      case 'positive':
        return 'text-[var(--djup-positive)] border-[var(--djup-positive)]/40';
      default:
        return 'text-[var(--djup-text-muted)] border-[var(--djup-border-strong)]';
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-[3px] font-mono font-medium text-[10px] tracking-[0.12em] uppercase border bg-transparent ${tone}`}
      style={{ borderRadius: 0 }}
    >
      {Icon && <Icon size={10} strokeWidth={1.5} />}
      {variant === 'ai' && !Icon && <Sparkles size={10} strokeWidth={1.5} />}
      {variant === 'live' && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)] animate-pulse" />
      )}
      <span>{label}</span>
    </span>
  );
};

export default Badge;
