import React, { useMemo } from 'react';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Search, Info } from 'lucide-react';
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
    { header: 'TICKER', accessorKey: 'ticker', cell: info => <span className="font-bold text-[#FCD535]">{info.getValue()}</span> },
    { header: 'YIELD', accessorKey: 'yield', cell: info => <span className="font-mono text-[#EAECEF]">{info.getValue()}%</span> },
    { header: 'PERCENTILE', accessorKey: 'ticker', cell: (info) => {
       const index = bdcYieldData.findIndex(d => d.ticker === info.getValue());
       const pct = ((bdcYieldData.length - index) / bdcYieldData.length) * 100;
       return (
         <div className="w-24 h-1 bg-[#2B2F36] rounded-full overflow-hidden">
           <div className="h-full bg-[#0ECB81]" style={{ width: `${pct}%` }} />
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
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="UNIVERSE WEIGHTED YIELD" value={overallYield} format="percent" icon={TrendingUp} accentColor="#FCD535" delta={1.1} />
        <KPICard label="FIRST LIEN AVERAGE" value={seriesData?.[0]?.first_lien} format="percent" icon={BarChart3} accentColor="#0ECB81" delta={0.5} />
        <KPICard label="SECOND LIEN AVERAGE" value={seriesData?.[0]?.second_lien} format="percent" icon={PieChartIcon} accentColor="#8B5CF6" delta={-0.2} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ChartPanel title="Historical Yield Spreads" subtitle="Time-series analysis of asset class performance">
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={seriesData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2B2F36" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" height={40} />
                  <Line type="monotone" dataKey="first_lien" name="First Lien" stroke="#0ECB81" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="unitranche" name="Unitranche" stroke="#32D7FF" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="second_lien" name="Second Lien" stroke="#8B5CF6" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <ChartPanel title="Manager Performance Dispersion" subtitle="Weighted average yields by BDC manager">
            {bdcLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={bdcYieldData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#2B2F36" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="ticker" type="category" axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="val" name="Yield %" radius={[0, 2, 2, 0]}>
                    {bdcYieldData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#FCD535' : '#2B2F36'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        <div className="col-span-12 lg:col-span-6 binance-panel overflow-hidden flex flex-col h-[480px]">
          <div className="px-6 py-4 border-b border-[#2B2F36] flex justify-between items-center bg-[#1E2329]/50">
            <h3 className="font-bold text-[14px] text-[#EAECEF] uppercase tracking-wider">Manager Yield Ranking</h3>
            <Search className="w-4 h-4 text-[#474D57]" />
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
