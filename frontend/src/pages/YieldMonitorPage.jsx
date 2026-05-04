import React, { useMemo } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Search } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const YieldMonitorPage = () => {
  const { data: yieldOverview, loading: yieldLoading } = useApi('/yields/overview');
  const { data: yieldTimeSeries, loading: tsLoading } = useApi('/yields/time-series');
  const { data: yieldByBDC, loading: bdcLoading } = useApi('/yields/by-bdc');

  const overallYield = yieldOverview?.overall_weighted_yield ? (yieldOverview.overall_weighted_yield * 100).toFixed(2) : null;

  const bdcYieldData = useMemo(() => {
    if (!yieldByBDC) return [];
    return Object.keys(yieldByBDC).map(ticker => ({
      ticker,
      yield: (yieldByBDC[ticker] * 100).toFixed(2),
      val: yieldByBDC[ticker] * 100
    })).sort((a, b) => b.val - a.val);
  }, [yieldByBDC]);

  const bdcColumns = [
    { header: 'BDC Ticker', accessorKey: 'ticker', cell: info => <span className="font-bold text-[var(--accent)]">{info.getValue()}</span> },
    { header: 'Current Yield', accessorKey: 'yield', cell: info => <span className="font-mono">{info.getValue()}%</span> },
    { header: 'Relative Rank', accessorKey: 'ticker', cell: (info) => {
       const index = bdcYieldData.findIndex(d => d.ticker === info.getValue());
       const pct = ((bdcYieldData.length - index) / bdcYieldData.length) * 100;
       return (
         <div className="w-24 h-1.5 bg-[#1E2D45] rounded-full overflow-hidden">
           <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#00C8E0]" style={{ width: `${pct}%` }} />
         </div>
       );
    }}
  ];

  const seriesData = useMemo(() => {
    if (!yieldTimeSeries) return [];
    return yieldTimeSeries.map(d => ({
      ...d,
      first_lien: (d.first_lien_yield * 100).toFixed(2),
      unitranche: (d.unitranche_yield * 100).toFixed(2),
      second_lien: (d.second_lien_yield * 100).toFixed(2),
    }));
  }, [yieldTimeSeries]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="Universe Weighted Yield" value={overallYield} format="percent" icon={TrendingUp} accentColor="#00C8E0" />
        <KPICard label="First Lien Avg" value={seriesData?.[0]?.first_lien} format="percent" icon={BarChart3} accentColor="#10B981" />
        <KPICard label="Second Lien Avg" value={seriesData?.[0]?.second_lien} format="percent" icon={PieChartIcon} accentColor="#8B5CF6" />
      </div>

      <ChartPanel title="Yield Trends by Asset Class" subtitle="Spread performance across first lien, second lien, and unitranche loans" height={450}>
        {tsLoading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" height={40} />
              <Line type="monotone" dataKey="first_lien" name="First Lien" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="unitranche" name="Unitranche" stroke="#00C8E0" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="second_lien" name="Second Lien" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartPanel title="BDC Yield Comparison" subtitle="Portfolio-wide weighted average yields by manager" height={400}>
          {bdcLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bdcYieldData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="ticker" type="category" axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="val" name="Yield %" radius={[0, 4, 4, 0]}>
                  {bdcYieldData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#00C8E0' : '#1E2D45'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <div className="premium-card bg-[#0D1424]/20 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[#1E2D45] bg-[#0D1424]/40 flex justify-between items-center">
            <h3 className="font-['Outfit'] text-[15px] font-bold text-[#F8FAFC]">Manager Yield Ranking</h3>
            <div className="p-1.5 bg-[#070B14] border border-[#1E2D45] rounded-lg text-[#475569]">
              <Search className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DataTable data={bdcYieldData} columns={bdcColumns} loading={bdcLoading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldMonitorPage;
