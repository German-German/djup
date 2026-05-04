import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, AlertTriangle, Activity, BarChart2, Globe, Brain, RefreshCw, ChevronRight } from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore.js';

const Sidebar = () => {
  const { selectedQuarter, setQuarter, lastUpdated } = useDashboardStore();

  const navLinks = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Yield Monitor', path: '/yields', icon: TrendingUp },
    { name: 'Stress Radar', path: '/stress', icon: AlertTriangle },
    { name: 'Deal Flow', path: '/dealflow', icon: Activity },
    { name: 'Manager Matrix', path: '/managers', icon: BarChart2 },
    { name: 'Macro Overlay', path: '/macro', icon: Globe },
    { name: 'Sentiment (NLP)', path: '/sentiment', icon: Brain },
  ];

  return (
    <div className="w-[260px] h-full bg-[#070B14] border-r border-[#1E2D45] flex flex-col flex-shrink-0 relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-[#00C8E020] to-transparent" />
      
      <div className="p-8 border-b border-[#1E2D45] bg-[#0D1424]/30">
        <div className="flex items-center gap-3 group cursor-default">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C8E0] to-[#8B5CF6] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(0,200,224,0.3)] group-hover:shadow-[0_0_20px_rgba(0,200,224,0.5)] transition-all duration-300">
            D
          </div>
          <div>
            <div className="font-['Outfit'] font-bold text-[18px] text-[#F8FAFC] tracking-tight">
              Djup
            </div>
            <div className="font-['DM_Sans'] text-[10px] text-[#475569] tracking-[0.2em] uppercase font-bold">
              Intelligence
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center group px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ` +
                (isActive
                  ? 'bg-gradient-to-r from-[#00C8E015] to-transparent text-[#00C8E0] shadow-[inset_0_0_0_1px_rgba(0,200,224,0.2)]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#0D1424]')
              }
            >
              <Icon className={`w-[18px] h-[18px] mr-3.5 transition-transform duration-200 group-hover:scale-110`} />
              <span className="flex-1">{link.name}</span>
              <ChevronRight className={`w-3.5 h-3.5 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-40 group-hover:translate-x-0`} />
            </NavLink>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#1E2D45] bg-[#0D1424]/30 space-y-5">
        <div>
          <label className="text-[10px] text-[#475569] uppercase font-bold tracking-widest mb-2.5 block">Time Horizon</label>
          <div className="relative group">
            <select 
              className="w-full appearance-none bg-[#070B14] border border-[#1E2D45] text-[#F8FAFC] text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-[#00C8E0] focus:ring-1 focus:ring-[#00C8E0] transition-all cursor-pointer"
              value={selectedQuarter || ""}
              onChange={(e) => setQuarter(e.target.value || null)}
            >
              <option value="">Latest Filing</option>
              <option value="Q3_24">Q3 2024</option>
              <option value="Q2_24">Q2 2024</option>
              <option value="Q1_24">Q1 2024</option>
              <option value="Q4_23">Q4 2023</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#475569]">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-[9px] text-[#475569] uppercase font-bold tracking-wider">Sync Status</span>
            <span className="text-[11px] text-[#94A3B8] font-mono">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
            </span>
          </div>
          <button className="p-2.5 bg-[#0D1424] border border-[#1E2D45] rounded-lg text-[#94A3B8] hover:text-[#00C8E0] hover:border-[#00C8E0] hover:shadow-[0_0_10px_rgba(0,200,224,0.1)] transition-all duration-300">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
