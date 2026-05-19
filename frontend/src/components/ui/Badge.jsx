import { Sparkles } from 'lucide-react';

/**
 * Restrained, soft-edged tag. Tobacco for primary, muted desaturated tones
 * for status. No glow, no gradients.
 */
const Badge = ({ label, variant = 'default', icon: Icon }) => {
  const tone = (() => {
    switch (variant) {
      case 'live':
        return 'text-[var(--djup-text)] border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel)]';
      case 'non-accrual':
      case 'danger':
        return 'text-[var(--djup-negative)] border-[var(--djup-negative)]/30 bg-[rgba(200,132,127,0.06)]';
      case 'warning':
      case 'primary':
      case 'status':
        return 'text-[var(--djup-primary)] border-[var(--djup-primary)]/35 bg-[var(--djup-primary-soft)]';
      case 'second-lien':
      case 'purple':
      case 'info':
      case 'unitranche':
      case 'ai':
        return 'text-[var(--djup-text-muted)] border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel)]';
      case 'first-lien':
      case 'loan-type':
      case 'positive':
        return 'text-[var(--djup-positive)] border-[var(--djup-positive)]/30 bg-[rgba(141,177,149,0.06)]';
      default:
        return 'text-[var(--djup-text-muted)] border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel)]';
    }
  })();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10.5px] font-medium tracking-[0.08em] uppercase border ${tone}`}
      style={{ borderRadius: 'var(--r-xs)' }}
    >
      {Icon && <Icon size={11} strokeWidth={1.75} />}
      {variant === 'ai' && !Icon && <Sparkles size={11} strokeWidth={1.75} />}
      {variant === 'live' && !Icon && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)] animate-pulse" />
      )}
      <span>{label}</span>
    </span>
  );
};

export default Badge;
