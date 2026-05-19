import React, { useEffect, useState } from 'react';

const StatusFooter = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ny = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const ldn = time.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London', hour12: false, hour: '2-digit', minute: '2-digit',
  });
  const hk = time.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Hong_Kong', hour12: false, hour: '2-digit', minute: '2-digit',
  });

  return (
    <footer className="h-9 border-t border-[var(--djup-border-strong)] bg-[var(--djup-bg-sidebar)] flex items-center justify-between px-8 text-[11.5px] text-[var(--djup-text-faint)] shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--djup-primary)]" />
          <span className="text-[var(--djup-text)] font-medium">Market Open</span>
        </div>
        <span className="font-mono tabular-nums">NY <span className="text-[var(--djup-text-muted)] ml-1">{ny}</span></span>
        <span className="font-mono tabular-nums">LDN <span className="text-[var(--djup-text-muted)] ml-1">{ldn}</span></span>
        <span className="font-mono tabular-nums hidden md:inline">HK <span className="text-[var(--djup-text-muted)] ml-1">{hk}</span></span>
      </div>

      <div className="flex items-center gap-6">
        <span>Feed <span className="text-[var(--djup-text)] ml-1.5 font-medium">Live</span></span>
        <span className="font-mono tabular-nums">14ms</span>
        <span className="text-[var(--djup-text-faint)]">Djup v1.4</span>
      </div>
    </footer>
  );
};

export default StatusFooter;
