import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, AlertTriangle, Activity, BarChart2, Globe, Brain, RefreshCw } from 'lucide-react';
import useDashboardStore from '../../store/dashboardStore';

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
    <div className="w-[240px] h-full bg-[#0D1424] border-r border-[#1E2D45] flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-[#1E2D45]">
        <div className="font-['JetBrains_Mono'] font-bold text-[16px] text-[#00C8E0] tracking-wider flex items-center">
          <span className="mr-2">◈</span> CREDITLENS
        </div>
        <div className="font-['DM_Sans'] text-[11px] text-[#4A5A6B] mt-1 tracking-wide uppercase">
          Private Credit Intelligence
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded transition-colors text-sm font-['DM_Sans'] ` +
                (isActive
                  ? 'bg-[#00C8E015] border-l-2 border-[#00C8E0] text-[#E8EDF5]'
                  : 'text-[#8899AE] hover:bg-[#111827] border-l-2 border-transparent')
              }
            >
              <Icon className="w-4 h-4 mr-3" />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E2D45] flex flex-col gap-4">
        <div>
          <label className="text-[11px] text-[#4A5A6B] uppercase mb-1 block">Quarter</label>
          <select 
            className="w-full bg-[#111827] border border-[#1E2D45] text-[#E8EDF5] text-sm rounded px-2 py-1.5 focus:outline-none focus:border-[#00C8E0]"
            value={selectedQuarter || ""}
            onChange={(e) => setQuarter(e.target.value || null)}
          >
            <option value="">Latest Available</option>
            <option value="Q3_24">Q3 2024</option>
            <option value="Q2_24">Q2 2024</option>
            <option value="Q1_24">Q1 2024</option>
            <option value="Q4_23">Q4 2023</option>
          </select>
        </div>
        
        <div>
           <label className="text-[11px] text-[#4A5A6B] uppercase mb-1 block">BDCs (All Selected)</label>
           <div className="flex flex-wrap gap-1">
             <span className="text-xs bg-[#111827] border border-[#1E2D45] text-[#8899AE] px-2 py-0.5 rounded">All</span>
           </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="text-[10px] text-[#4A5A6B]">
            Last updated:<br/>
            <span className="text-[#8899AE]">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}</span>
          </div>
          <button className="p-1.5 border border-[#1E2D45] rounded text-[#8899AE] hover:text-[#00C8E0] hover:border-[#00C8E0] transition-colors">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
