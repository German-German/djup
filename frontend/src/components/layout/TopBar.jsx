import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, User, Grid, Monitor, Cpu } from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore.js';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Market Intelligence';
    case '/yields': return 'Yield Analytics';
    case '/stress': return 'Risk Monitoring';
    case '/dealflow': return 'Capital Deployment';
    case '/managers': return 'Manager Ranking';
    case '/macro': return 'Macro Overlay';
    case '/sentiment': return 'NLP Insights';
    default: return 'Terminal';
  }
};

const TopBar = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const lastUpdated = useDashboardStore(state => state.lastUpdated);

  return (
    <header className="h-16 bg-[#181A20] border-b border-[#2B2F36] flex items-center justify-between px-6 shrink-0 z-40">
      <div className="flex items-center gap-6">
        <h1 className="text-[18px] font-bold text-[#EAECEF] font-['Outfit']">{title}</h1>
        <div className="h-4 w-[1px] bg-[#2B2F36]" />
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[#848E9C]" />
          <span className="text-[12px] font-mono text-[#848E9C]">v1.0.4-prod</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search Bar Placeholder */}
        <div className="hidden lg:flex items-center gap-2 bg-[#0B0E11] border border-[#2B2F36] px-3 py-1.5 rounded w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#474D57]" />
          <span className="text-[12px] text-[#474D57]">Search assets, managers...</span>
        </div>

        <div className="flex items-center gap-1">
          {[Grid, Bell, Cpu].map((Icon, i) => (
            <button key={i} className="p-2 text-[#848E9C] hover:text-[#FCD535] hover:bg-[#2B2F36] rounded transition-all">
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="h-6 w-[1px] bg-[#2B2F36] mx-1" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-bold text-[#EAECEF] group-hover:text-[#FCD535]">Institutional Acc</span>
            <span className="text-[10px] text-[#0ECB81] font-bold">Verified</span>
          </div>
          <div className="w-8 h-8 rounded bg-[#2B2F36] flex items-center justify-center text-[#FCD535]">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
