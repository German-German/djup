import React from 'react';
import { useLocation } from 'react-router-dom';
import useDashboardStore from '../../store/dashboardStore.js';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Global Overview';
    case '/yields': return 'Yield Monitor';
    case '/stress': return 'Stress Radar';
    case '/dealflow': return 'Deal Flow';
    case '/managers': return 'Manager Matrix';
    case '/macro': return 'Macro Overlay';
    case '/sentiment': return 'Sentiment (NLP)';
    default: return 'Dashboard';
  }
};

const TopBar = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const lastUpdated = useDashboardStore(state => state.lastUpdated);

  let freshnessColor = 'bg-[#10B981]';
  let statusText = 'Operational';
  
  if (lastUpdated) {
    const daysOld = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24);
    if (daysOld > 7) {
      freshnessColor = 'bg-[#F59E0B]';
      statusText = 'Data Delayed';
    }
  }

  return (
    <header className="w-full h-20 glass-panel border-0 border-b border-[#1E2D45] flex items-center justify-between px-10 shrink-0 z-20">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold text-[#F8FAFC] font-['Outfit'] tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-8 bg-[var(--accent)] rounded-full" />
          <span className="text-[10px] text-[#64748B] uppercase tracking-[0.2em] font-bold">Terminal Interface</span>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 bg-[#070B14] border border-[#1E2D45] px-4 py-2 rounded-full">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${freshnessColor}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${freshnessColor}`}></span>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">{statusText}</span>
        </div>
        
        <div className="w-10 h-10 rounded-full bg-[#0D1424] border border-[#1E2D45] flex items-center justify-center text-[#64748B] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer">
          <div className="w-5 h-5 rounded bg-current opacity-20" />
        </div>
      </div>
    </header>
  );
};

export default TopBar;
