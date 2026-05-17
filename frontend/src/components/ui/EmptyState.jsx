import { Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({ 
  title = "No data available", 
  description = "Connect data sources to populate this module.",
  actionLabel,
  actionTo
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] border border-[var(--djup-border)] bg-[var(--djup-bg-panel-elevated)] rounded-sm p-8 text-center">
      <div className="w-12 h-12 flex items-center justify-center border border-[var(--djup-border)] bg-[var(--djup-bg-main)] rounded mb-4">
        <Terminal className="text-[var(--djup-primary)] w-6 h-6" />
      </div>
      <h4 className="text-[14px] font-bold text-[var(--djup-text)] font-['Inter'] mb-1">{title}</h4>
      <p className="font-mono text-[var(--djup-text-muted)] text-[11px] max-w-[280px] leading-relaxed mb-4">{description}</p>
      
      {actionLabel && actionTo && (
        <Link 
          to={actionTo}
          className="px-4 py-1.5 text-[11px] font-mono font-bold text-[var(--djup-bg-main)] bg-[var(--djup-primary)] hover:bg-[var(--djup-text)] transition-colors rounded-sm tracking-wider uppercase"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
};
