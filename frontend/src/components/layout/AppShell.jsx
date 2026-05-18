import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TerminalFrame from './TerminalFrame';
import StatusFooter from './StatusFooter';

const AppShell = ({ children }) => {
  return (
    <TerminalFrame>
      <Sidebar />
      <div className="djup-main">
        <TopBar />
        <main className="djup-content custom-scrollbar">
          <div className="max-w-[1640px] mx-auto w-full">{children}</div>
        </main>
        <StatusFooter />
      </div>
    </TerminalFrame>
  );
};

export default AppShell;
