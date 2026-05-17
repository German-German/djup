import React from 'react';

const TerminalPanel = ({ children, className = '', title, action, source }) => {
  return (
    <div className={`bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded-sm overflow-hidden flex flex-col relative ${className}`}>
      {(title || action || source) && (
        <div className="h-10 px-4 border-b border-[var(--djup-border)] flex items-center justify-between shrink-0 bg-[var(--djup-bg-panel-elevated)]">
          <div className="flex items-center gap-3">
            {title && <h3 className="text-[13px] font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight">{title}</h3>}
            {source && (
              <span className="text-[9px] font-mono text-[var(--djup-text-faint)] uppercase tracking-wider">
                | {source}
              </span>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="flex-1 p-4 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default TerminalPanel;
