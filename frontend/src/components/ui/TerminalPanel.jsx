import React from 'react';

const TerminalPanel = ({ children, className = '', title, action, source, subtitle, padding = true }) => {
  const hasHeader = title || action || source || subtitle;
  return (
    <div
      className={`bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] overflow-hidden flex flex-col relative ${className}`}
      style={{ borderRadius: 'var(--r-md)' }}
    >
      {hasHeader && (
        <div className="h-[52px] px-6 border-b border-[var(--djup-border-strong)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h3 className="text-[14px] font-semibold text-[var(--djup-text)] tracking-tight truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-[12px] text-[var(--djup-text-muted)] truncate">
                {subtitle}
              </span>
            )}
            {source && (
              <span className="djup-section-label hidden md:inline truncate">
                {source}
              </span>
            )}
          </div>
          {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
        </div>
      )}
      <div className={`flex-1 relative overflow-hidden ${padding ? 'p-6' : ''}`}>{children}</div>
    </div>
  );
};

export default TerminalPanel;
