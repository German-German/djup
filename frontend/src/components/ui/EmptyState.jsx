
import { Ghost } from 'lucide-react';

export const EmptyState = ({ message = "No data available for this selection" }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px]">
      <Ghost className="text-[#1E2D45] w-12 h-12 mb-3" />
      <div className="font-['DM_Sans'] text-[#8899AE] text-sm">{message}</div>
    </div>
  );
};
