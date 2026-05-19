import { Link } from 'react-router-dom';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  title = 'No data available',
  description = 'Connect data sources to populate this module.',
  actionLabel,
  actionTo,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full min-h-[200px] border border-[var(--djup-border-strong)] bg-[var(--djup-bg-panel-elevated)] px-6 py-10 text-center"
      style={{ borderRadius: 'var(--r-md)' }}
    >
      <div className="w-10 h-10 mb-4 flex items-center justify-center rounded-full bg-[var(--djup-bg-panel)] text-[var(--djup-text-faint)]">
        <Inbox size={18} strokeWidth={1.5} />
      </div>
      <h4 className="text-[14px] font-semibold text-[var(--djup-text)] mb-1.5">{title}</h4>
      <p className="text-[12.5px] text-[var(--djup-text-muted)] max-w-[340px] leading-relaxed">
        {description}
      </p>

      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-5 px-5 py-2 text-[12.5px] font-medium text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-primary-strong)] transition-colors no-underline"
          style={{ borderRadius: 'var(--r-sm)' }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
};
