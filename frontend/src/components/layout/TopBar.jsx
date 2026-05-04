import React from 'react';
import { useLocation } from 'react-router-dom';
import useDashboardStore from '../../store/dashboardStore';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Overview';
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

  let freshnessColor = 'bg-[#10B981]'; // Positive Green
  if (lastUpdated) {
    const daysOld = (new Date() - new Date(lastUpdated)) / (1000 * 60 * 60 * 24);
    if (daysOld > 7) {
      freshnessColor = 'bg-[#F59E0B]'; // Warning Amber
    }
  }

  return (
    <header className="w-full h-[56px] bg-[#0D1424] border-b border-[#1E2D45] flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-medium text-[#E8EDF5]">{title}</h1>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-[#8899AE]">
          <span className={`w-2 h-2 rounded-full ${freshnessColor}`}></span>
          Data Status
        </div>
      </div>
    </header>
  );
};

export default TopBar;
