import React, { useState, useEffect } from 'react';

const StatusFooter = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <footer className="h-8 border-t border-[var(--djup-border)] bg-[var(--djup-bg-sidebar)] flex items-center justify-between px-4 text-[10px] uppercase font-mono text-[var(--djup-text-muted)] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span>MARKET:</span>
          <span className="text-[var(--djup-primary)]">OPEN</span>
        </div>
        <div>
          <span>NY {formatTime(time)}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span>STREAM:</span>
          <span className="text-[var(--djup-green)]">CONNECTED</span>
        </div>
        <div className="flex items-center gap-2">
          <span>LATENCY:</span>
          <span className="text-[var(--djup-text)]">14MS</span>
        </div>
      </div>
    </footer>
  );
};

export default StatusFooter;
