import React, { useEffect, useState } from 'react';

const StatusFooter = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const ny = time.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const ldn = time.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <footer className="h-7 border-t border-[var(--djup-border-strong)] bg-[var(--djup-bg-sidebar)] flex items-center justify-between px-6 text-[10px] font-mono text-[var(--djup-text-faint)] shrink-0 tracking-wider uppercase">
      <div className="flex items-center gap-6">
        <span>
          Market <span className="text-[var(--djup-primary)] ml-1">Open</span>
        </span>
        <span>NY {ny}</span>
        <span>LDN {ldn}</span>
      </div>

      <div className="flex items-center gap-6">
        <span>
          Feed <span className="text-[var(--djup-text)] ml-1">Live</span>
        </span>
        <span>Latency 14ms</span>
        <span>v1.4.0</span>
      </div>
    </footer>
  );
};

export default StatusFooter;
