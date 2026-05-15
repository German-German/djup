import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  Globe, 
  Brain, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore.js';

const Sidebar = () => {
  const { selectedQuarter, setQuarter } = useDashboardStore();

  const navLinks = [
    { name: 'Market Overview', path: '/', icon: LayoutDashboard },
    { name: 'Yields & Spreads', path: '/yields', icon: TrendingUp },
    { name: 'Risk Radar', path: '/stress', icon: AlertTriangle },
    { name: 'Deal Intelligence', path: '/dealflow', icon: Activity },
    { name: 'Manager Matrix', path: '/managers', icon: BarChart2 },
    { name: 'Macro Overlay', path: '/macro', icon: Globe },
    { name: 'NLP Sentiment', path: '/sentiment', icon: Brain },
    { name: 'About Platform', path: '/about', icon: Info },
  ];

  return (
    <div className="w-[240px] h-full bg-[#121212] border-r border-[#333333] flex flex-col flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#333333]">
        <NavLink to="/" className="flex items-center gap-3 w-full group">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-[#121212] stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Outfit'] font-bold text-[20px] text-[#F0F0F0] leading-tight">Djup</span>
            <span className="text-[9px] text-[#F59E0B] font-bold tracking-[0.2em] uppercase">Pro Terminal</span>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-4">
          <span className="text-[10px] font-bold text-[#474D57] uppercase tracking-widest">Main Menu</span>
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center group px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ` +
                (isActive
                  ? 'bg-[#2D2D2D] text-[#F59E0B]'
                  : 'text-[#A0A0A0] hover:text-[#F0F0F0] hover:bg-[#1E1E1E]')
              }
            >
              <Icon className="w-[18px] h-[18px] mr-3 shrink-0" />
              <span className="flex-1 truncate">{link.name}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div className="p-4 border-t border-[#333333] space-y-4 bg-[#121212]">
        <div>
          <label className="text-[10px] text-[#707070] font-bold uppercase tracking-widest mb-2 block px-2">Data Horizon</label>
          <div className="relative">
            <select 
              className="w-full bg-[#1E1E1E] border border-[#333333] text-[#F0F0F0] text-xs rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-[#F59E0B] cursor-pointer"
              value={selectedQuarter || ""}
              onChange={(e) => setQuarter(e.target.value || null)}
            >
              <option value="">Live Universe</option>
              <option value="Q3_24">Q3 2024</option>
              <option value="Q2_24">Q2 2024</option>
              <option value="Q1_24">Q1 2024</option>
              <option value="Q4_23">Q4 2023</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#474D57]">
              <ChevronRight className="w-3 h-3 rotate-90" />
            </div>
          </div>
        </div>

        <div className="px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] text-[#707070] font-medium uppercase">Network Live</span>
          </div>
          <Zap className="w-3 h-3 text-[#F59E0B] opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
