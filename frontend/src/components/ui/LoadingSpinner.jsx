export const LoadingSpinner = ({ label = 'Loading market data' }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[160px] gap-3">
      <div className="w-6 h-6 border border-[var(--djup-border-strong)] border-t-[var(--djup-primary)] rounded-full animate-spin" />
      <div className="djup-section-label">{label}</div>
    </div>
  );
};
