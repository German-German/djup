import React from 'react';

const TerminalFrame = ({ children }) => {
  return (
    <div className="djup-page-bg text-[var(--djup-text)]">
      <div className="djup-terminal-frame">
        {children}
      </div>
    </div>
  );
};

export default TerminalFrame;
