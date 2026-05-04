import { create } from 'zustand';

const useDashboardStore = create((set) => ({
  selectedQuarter: null,
  selectedBDCs: [],
  lastUpdated: new Date().toISOString(),
  isLoading: false,
  error: null,
  
  setQuarter: (quarter) => set({ selectedQuarter: quarter }),
  setSelectedBDCs: (tickers) => set({ selectedBDCs: tickers }),
  setLastUpdated: (date) => set({ lastUpdated: date }),
  setLoading: (status) => set({ isLoading: status }),
  setError: (err) => set({ error: err })
}));

export default useDashboardStore;
