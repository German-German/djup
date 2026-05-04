import React, { useMemo } from 'react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import AlertBanner from '../components/ui/AlertBanner';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import useApi from '../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

const StressRadarPage = () => {
  const { data: dashboard, loading: dashLoading } = useApi('/stress/dashboard');
  const { data: nonAccrual, loading: naLoading } = useApi('/stress/non-accrual');
  const { data: navPremium, loading: navLoading } = useApi('/stress/nav-premium');
  const { data: watchlist, loading: watchLoading } = useApi('/stress/watchlist');

  const universe_non_accrual_rate = dashboard?.universe_non_accrual_rate || 0;
  const bdc_count_above_3pct = dashboard?.bdc_count_above_3pct || 0;
  const avgNavPremDis = navPremium && navPremium.length > 0 ? navPremium[navPremium.length - 1].universe_avg_premium_discount : 0;

  const naChartData = useMemo(() => {
    if (!nonAccrual) return [];
    return nonAccrual.map(item => ({
      quarter: item.quarter,
      universe_rate: item.universe_rate * 100,
      ...Object.keys(item.by_bdc).reduce((acc, key) => {
        acc[key] = item.by_bdc[key] * 100;
        return acc;
      }, {})
    }));
  }, [nonAccrual]);

  const bdcsInNA = useMemo(() => {
    if (!nonAccrual || nonAccrual.length === 0) return [];
    return Object.keys(nonAccrual[0].by_bdc);
  }, [nonAccrual]);

  const navChartData = useMemo(() => {
    if (!navPremium) return [];
    return navPremium.map(item => ({
      quarter: item.quarter,
      universe_avg: item.universe_avg_premium_discount * 100,
      ...Object.keys(item.by_bdc).reduce((acc, key) => {
        acc[key] = item.by_bdc[key] * 100;
        return acc;
      }, {})
    }));
  }, [navPremium]);

  const COLORS = ['#00C8E0', '#8B5CF6', '#10B981', '#F59E0B', '#3B82F6', '#EC4899'];

  const watchColumns = [
    { header: 'Borrower', accessorKey: 'borrower_name', cell: info => <span className="font-semibold text-white">{info.getValue()}</span> },
    { header: 'Industry', accessorKey: 'industry' },
    { header: '# BDCs Holding', accessorKey: 'bdc_count' },
    { header: 'Total Exposure ($M)', accessorKey: 'total_fair_value_mm', cell: info => `$${info.getValue().toFixed(1)}M` },
    { header: 'Avg Fair/Par', accessorKey: 'avg_fair_to_par', cell: info => `${(info.getValue() * 100).toFixed(1)}%` },
    { header: 'Non-Accrual', accessorKey: 'is_non_accrual_any', cell: info => info.getValue() ? <Badge label="Non-Accrual" variant="non-accrual" /> : <Badge label="Performing" variant="loan-type" /> },
    { header: 'BDC List', accessorKey: 'bdc_list', cell: info => <span className="text-[#8899AE] text-xs">{info.getValue().join(', ')}</span> }
  ];

  const sortedWatchlist = useMemo(() => {
    if (!watchlist) return [];
    return [...watchlist].sort((a, b) => {
      if (a.is_non_accrual_any && !b.is_non_accrual_any) return -1;
      if (!a.is_non_accrual_any && b.is_non_accrual_any) return 1;
      return a.avg_fair_to_par - b.avg_fair_to_par;
    });
  }, [watchlist]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {universe_non_accrual_rate > 0.03 && (
          <AlertBanner title="Elevated Systemic Risk Detected" message={`Universe average non-accrual rate has crossed the 3% threshold (Currently ${(universe_non_accrual_rate * 100).toFixed(2)}%).`} variant="danger" />
        )}
        {bdc_count_above_3pct > 3 && (
          <AlertBanner title="Broad Manager Stress" message={`${bdc_count_above_3pct} BDCs are currently reporting non-accrual rates above 3%.`} variant="warning" />
        )}
        {avgNavPremDis < 0 && (
          <AlertBanner title="Market Discount" message={`The BDC universe is trading at an average discount to NAV (${(avgNavPremDis * 100).toFixed(2)}%).`} variant="warning" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="UNIVERSE NON-ACCRUAL" value={dashboard?.universe_non_accrual_rate ? dashboard.universe_non_accrual_rate * 100 : null} format="percent" accentColor="#F43F5E" loading={dashLoading} />
        <KPICard label="BDCs > 3% NON-ACCRUAL" value={bdc_count_above_3pct} accentColor="#F59E0B" loading={dashLoading} />
        <KPICard label="DISTRESSED LOANS" value={dashboard?.total_distressed_fair_value_mm} format="currency" accentColor="#F43F5E" loading={dashLoading} />
        <KPICard label="AVG NAV PREM/DIS" value={avgNavPremDis * 100} format="percent" accentColor="#8B5CF6" loading={navLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Non-Accrual Rate by BDC Over Time" height={400}>
          {naLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={naChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={3} stroke="#F43F5E" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="universe_rate" name="Universe Avg" stroke="#E8EDF5" strokeWidth={3} dot={{ r: 4 }} />
                {bdcsInNA.map((bdc, i) => (
                  <Line key={bdc} type="monotone" dataKey={bdc} name={bdc} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="NAV Premium / Discount History" height={400}>
          {navLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={navChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={0} stroke="#E8EDF5" />
                <Line type="monotone" dataKey="universe_avg" name="Universe Avg" stroke="#E8EDF5" strokeWidth={3} dot={{ r: 4 }} />
                {bdcsInNA.map((bdc, i) => (
                  <Line key={bdc} type="monotone" dataKey={bdc} name={bdc} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      <div className="flex flex-col h-full bg-[#0D1424] border border-[#1E2D45] rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2D45] flex justify-between items-center">
          <h3 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">Watchlist Borrowers</h3>
        </div>
        <div className="flex-1 p-0 overflow-y-auto max-h-[500px]">
          {watchLoading ? <LoadingSpinner /> : (
            <DataTable 
              data={sortedWatchlist} 
              columns={watchColumns} 
              loading={watchLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StressRadarPage;
