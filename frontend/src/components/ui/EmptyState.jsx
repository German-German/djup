import { Link } from 'react-router-dom';

export const EmptyState = ({
  title = 'No data available',
  description = 'Connect data sources to populate this module.',
  actionLabel,
  actionTo,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px] border border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel-elevated)] p-6 text-center">
      <div className="djup-section-label text-[var(--djup-primary)] mb-3">Empty</div>
      <h4 className="text-[13px] font-semibold text-[var(--djup-text)] font-['Inter'] mb-1">{title}</h4>
      <p className="font-mono text-[var(--djup-text-muted)] text-[11px] max-w-[320px] leading-relaxed">
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-4 px-4 py-1.5 text-[11px] font-mono font-medium tracking-wider uppercase text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors no-underline"
          style={{ borderRadius: 0 }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
};
