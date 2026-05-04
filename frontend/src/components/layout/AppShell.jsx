import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppShell = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-[#070B14] text-[#F8FAFC]">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00C8E0] blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#8B5CF6] blur-[100px] rounded-full" />
        </div>

        <TopBar />
        <main className="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth relative z-10">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
