import React from 'react';

const TerminalPanel = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] rounded-sm overflow-hidden flex flex-col ${className}`}>
      {(title || action) && (
        <div className="h-10 px-4 border-b border-[var(--djup-border)] flex items-center justify-between shrink-0 bg-[var(--djup-bg-panel-elevated)]">
          <h3 className="text-[13px] font-bold text-[var(--djup-text)] font-['Inter'] tracking-tight">{title}</h3>
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
