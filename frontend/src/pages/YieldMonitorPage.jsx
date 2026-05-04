import React, { useMemo } from 'react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import AlertBanner from '../components/ui/AlertBanner';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import useDashboardStore from '../store/dashboardStore';

const YieldMonitorPage = () => {
  const { data: spreadCompression, loading: scLoading } = useApi('/yields/spread-compression');
  const { data: yieldOverview, loading: yoLoading } = useApi('/yields/overview');
  const { data: tsData, loading: tsLoading } = useApi('/yields/time-series');
  const { data: indHeatmap, loading: heatmapLoading } = useApi('/yields/industry-heatmap');
  const { data: spreadCurve, loading: curveLoading } = useApi('/yields/spread-curve');

  const { selectedQuarter, setQuarter } = useDashboardStore();

  const wtdAvgYield = yieldOverview?.overall_weighted_yield ? (yieldOverview.overall_weighted_yield * 100).toFixed(2) : null;
  const impliedSpread = tsData && tsData.length > 0 ? (tsData[tsData.length - 1].implied_spread_over_sofr * 10000).toFixed(0) : null;
  const yieldRange = yieldOverview?.yield_range?.min !== undefined 
    ? `${(yieldOverview.yield_range.min * 100).toFixed(1)}% - ${(yieldOverview.yield_range.max * 100).toFixed(1)}%` 
    : '-';

  const isCompressing = spreadCompression?.analysis?.[0]?.trend === 'compressing';
  
  const formattedTsData = useMemo(() => {
    if (!tsData) return [];
    return tsData.map(q => ({
      ...q,
      overall_yield: q.overall_yield * 100,
      first_lien_yield: q.first_lien_yield * 100,
      unitranche_yield: q.unitranche_yield * 100,
      second_lien_yield: q.second_lien_yield * 100,
    }));
  }, [tsData]);

  const getGradientColor = (value, min, max) => {
    const ratio = (value - min) / (max - min || 1);
    return ratio > 0.5 ? '#F43F5E' : '#00C8E0'; 
  };

  const heatmapMax = indHeatmap && indHeatmap.length > 0 ? Math.max(...indHeatmap.map(d => d.weighted_yield)) : 1;
  const heatmapMin = indHeatmap && indHeatmap.length > 0 ? Math.min(...indHeatmap.map(d => d.weighted_yield)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 bg-[#0D1424] p-4 border border-[#1E2D45] rounded-[10px]">
        <div className="font-['DM_Sans'] text-[#8899AE] text-sm">Filters:</div>
        <select 
            className="bg-[#111827] border border-[#1E2D45] text-[#E8EDF5] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#00C8E0]"
            value={selectedQuarter || ""}
            onChange={(e) => setQuarter(e.target.value || null)}
          >
            <option value="">Latest Available</option>
            <option value="Q3_24">Q3 2024</option>
            <option value="Q2_24">Q2 2024</option>
            <option value="Q1_24">Q1 2024</option>
        </select>
        <div className="bg-[#111827] border border-[#1E2D45] text-[#8899AE] text-sm rounded px-3 py-1.5 cursor-not-allowed opacity-50">
          All BDCs
        </div>
        <div className="bg-[#111827] border border-[#1E2D45] text-[#8899AE] text-sm rounded px-3 py-1.5 cursor-not-allowed opacity-50">
          All Loan Types
        </div>
      </div>

      {spreadCompression && spreadCompression.narrative && (
        <AlertBanner 
          title={isCompressing ? "Spread Compression Detected" : "Spreads Widening"} 
          message={spreadCompression.narrative}
          variant={isCompressing ? "warning" : "info"}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="OVERALL WEIGHTED YIELD" value={wtdAvgYield} format="percent" loading={yoLoading} />
        <KPICard label="IMPLIED SPREAD OVER SOFR" value={impliedSpread} format="bps" accentColor="#8B5CF6" loading={tsLoading} />
        <KPICard label="YIELD RANGE (MIN-MAX)" value={yieldRange} accentColor="#10B981" loading={yoLoading} />
      </div>

      <ChartPanel title="Yield by Loan Type Over Time" height={400}>
        {tsLoading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedTsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
              <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="overall_yield" name="Overall Yield" stroke="#E8EDF5" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="first_lien_yield" name="First Lien" stroke="#00C8E0" strokeWidth={2} />
              <Line type="monotone" dataKey="unitranche_yield" name="Unitranche" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="second_lien_yield" name="Second Lien" stroke="#10B981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Yield by Industry" height={450}>
          {heatmapLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={indHeatmap ? indHeatmap.slice(0, 15) : []} margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val*100).toFixed(0)}%`} />
                <YAxis dataKey="industry_name" type="category" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} formatter={(val) => `${(val*100).toFixed(2)}%`} />
                <Bar dataKey="weighted_yield" name="Yield" radius={[0, 4, 4, 0]} barSize={16}>
                  {indHeatmap && indHeatmap.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getGradientColor(entry.weighted_yield, heatmapMin, heatmapMax)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="SOFR Spread Curve by Tenor" height={450}>
          {curveLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spreadCurve || []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
                <XAxis dataKey="tenor_label" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val} bps`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_spread_bps" name="Spread (bps)" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>
    </div>
  );
};

export default YieldMonitorPage;
