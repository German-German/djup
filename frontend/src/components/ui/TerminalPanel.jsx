import React from 'react';

const TerminalPanel = ({ children, className = '', title, action, source, subtitle }) => {
  const hasHeader = title || action || source || subtitle;
  return (
    <div
      className={`bg-[var(--djup-bg-panel)] border border-[var(--djup-border-strong)] overflow-hidden flex flex-col relative ${className}`}
      style={{ borderRadius: 0 }}
    >
      {hasHeader && (
        <div className="h-9 px-4 border-b border-[var(--djup-border-strong)] flex items-center justify-between shrink-0 bg-[var(--djup-bg-main)]">
          <div className="flex items-center gap-3 min-w-0">
            {title && (
              <h3 className="text-[12px] font-semibold text-[var(--djup-text)] tracking-tight truncate font-['Inter']">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-[10px] font-mono text-[var(--djup-text-faint)] truncate">
                {subtitle}
              </span>
            )}
            {source && (
              <span className="djup-section-label hidden md:inline truncate">
                {source}
              </span>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="flex-1 p-4 relative overflow-hidden">{children}</div>
    </div>
  );
};

export default TerminalPanel;
