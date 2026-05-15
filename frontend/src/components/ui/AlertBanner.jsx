
import { AlertTriangle, Info } from 'lucide-react';

const AlertBanner = ({ title, message, variant = 'info' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          border: '#F43F5E',
          bg: 'linear-gradient(90deg, rgba(244,63,94,0.05) 0%, rgba(244,63,94,0) 100%)',
          icon: <AlertTriangle className="text-[#F43F5E]" size={20} />
        };
      case 'warning':
        return {
          border: '#F59E0B',
          bg: 'linear-gradient(90deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0) 100%)',
          icon: <AlertTriangle className="text-[#F59E0B]" size={20} />
        };
      case 'info':
      default:
        return {
          border: '#00C8E0',
          bg: 'linear-gradient(90deg, rgba(0,200,224,0.05) 0%, rgba(0,200,224,0) 100%)',
          icon: <Info className="text-[#00C8E0]" size={20} />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div 
      className="w-full p-4 flex gap-3 rounded-r-[10px] items-start border-l-[3px] border-y border-r border-y-[#1E2D45] border-r-[#1E2D45] mb-4"
      style={{ borderLeftColor: styles.border, background: styles.bg }}
    >
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex flex-col">
        <h4 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">{title}</h4>
        {message && <p className="font-['DM_Sans'] text-[13px] text-[#8899AE] mt-1">{message}</p>}
      </div>
    </div>
  );
};

export default AlertBanner;
