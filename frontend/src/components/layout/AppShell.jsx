import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppShell = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-[#0B0E11] text-[#EAECEF] overflow-hidden">
      <Sidebar />
      
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        <TopBar />
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar bg-[#0B0E11]">
          <div className="max-w-[1600px] mx-auto w-full h-full">
            {children}
          </div>
        </main>

        {/* Global Market Status Bar */}
        <div className="h-6 bg-[#181A20] border-t border-[#2B2F36] flex items-center px-6 gap-6 shrink-0">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#0ECB81]" />
             <span className="text-[10px] font-bold text-[#848E9C] uppercase tracking-wider">WebSocket Connected</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono text-[#474D57]">
             <span>Latency: 24ms</span>
             <span>Region: US-OREGON</span>
             <span>Last Sync: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppShell;
