import { useLocation } from 'react-router-dom';
import { Bell, Search, User, Grid, Monitor, Cpu } from 'lucide-react';

const getPageTitle = (pathname) => {
  switch (pathname) {
    case '/': return 'Market Intelligence';
    case '/yields': return 'Yield Analytics';
    case '/stress': return 'Risk Monitoring';
    case '/dealflow': return 'Capital Deployment';
    case '/managers': return 'Manager Ranking';
    case '/macro': return 'Macro Overlay';
    case '/sentiment': return 'NLP Insights';
    case '/about': return 'About Platform';
    default: return 'Terminal';
  }
};

const TopBar = () => {
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-[#121212] border-b border-[#333333] flex items-center justify-between px-6 shrink-0 z-40">
      <div className="flex items-center gap-6">
        <h1 className="text-[18px] font-bold text-[#F0F0F0] font-['Outfit']">{title}</h1>
        <div className="h-4 w-[1px] bg-[#333333]" />
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-[#A0A0A0]" />
          <span className="text-[12px] font-mono text-[#A0A0A0]">v1.0.4-prod</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Search Bar Placeholder */}
        <div className="hidden lg:flex items-center gap-2 bg-[#121212] border border-[#333333] px-3 py-1.5 rounded-lg w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#707070]" />
          <span className="text-[12px] text-[#707070]">Search assets, managers...</span>
        </div>

        <div className="flex items-center gap-1">
          {[Grid, Bell, Cpu].map((Icon, i) => (
            <button key={i} className="p-2 text-[#A0A0A0] hover:text-[#F59E0B] hover:bg-[#1E1E1E] rounded-lg transition-all">
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="h-6 w-[1px] bg-[#333333] mx-1" />

        <div className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-bold text-[#F0F0F0] group-hover:text-[#F59E0B]">Institutional Acc</span>
            <span className="text-[10px] text-[#10B981] font-bold">Verified</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#333333] flex items-center justify-center text-[#F59E0B]">
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
