<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart
} from 'recharts';
import { Info, AlertTriangle } from 'lucide-react';

export default function YieldMonitorPage() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showProjection, setShowProjection] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/forecast/yield-trends');
        setData(response.data);
      } catch (err) {
        setError('Failed to load yield data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading yield trends...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const loanTypes = [
    { key: 'first_lien', label: 'First Lien', color: '#2563eb' },
    { key: 'unitranche', label: 'Unitranche', color: '#16a34a' },
    { key: 'second_lien', label: 'Second Lien', color: '#dc2626' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Yield Monitor</h1>
          <p className="text-gray-500">Track and analyze historical yields across private credit loan types.</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <label htmlFor="projection-toggle" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center">
            <span className="mr-3">Show Trend Projection</span>
            <div className="relative">
              <input
                id="projection-toggle"
                type="checkbox"
                className="sr-only"
                checked={showProjection}
                onChange={() => setShowProjection(!showProjection)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showProjection ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showProjection ? 'transform translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>
      </div>

      {showProjection && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Trend projection — not a forecast</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Directional trend based on historical pattern. Private credit yields are influenced by many factors not captured here.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {loanTypes.map((type) => {
          const typeData = data[type.key];
          if (!typeData || !typeData.historical) return null;

          // Combine historical and forecast data for the chart
          const combinedData = [...typeData.historical];
          
          if (showProjection && typeData.forecast && typeData.forecast.length > 0) {
            // Append forecast points
            typeData.forecast.forEach(f => {
              combinedData.push({
                quarter: f.quarter,
                forecast_yield: f.forecast_yield,
                lower_bound: f.lower_bound,
                upper_bound: f.upper_bound
              });
            });
            // Connect the last historical point to the forecast
            if (combinedData.length > typeData.forecast.length) {
              const lastHistoricalIndex = combinedData.length - typeData.forecast.length - 1;
              combinedData[lastHistoricalIndex].forecast_yield = combinedData[lastHistoricalIndex].weighted_yield;
            }
          }

          return (
            <div key={type.key} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                {type.label} Yields
                {showProjection && (
                  <div className="group relative ml-2">
                    <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                    <div className="invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-gray-800 text-xs text-white rounded shadow-lg z-10 text-center">
                      Directional trend based on historical pattern. Private credit yields are influenced by many factors not captured here.
                    </div>
                  </div>
                )}
              </h2>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="quarter" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                    <YAxis 
                      tickFormatter={(val) => `${(val * 100).toFixed(1)}%`}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        const formatted = `${(value * 100).toFixed(2)}%`;
                        if (name === 'weighted_yield') return [formatted, 'Historical Yield'];
                        if (name === 'forecast_yield') return [formatted, 'Trend Projection'];
                        return [formatted, name];
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 600 }}
                    />
                    <Legend />
                    
                    {/* Historical Line */}
                    <Line 
                      type="monotone" 
                      dataKey="weighted_yield" 
                      stroke={type.color} 
                      strokeWidth={2}
                      dot={{ r: 4, fill: type.color, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                      name="Historical Yield"
                    />

                    {/* Projection Line and Band */}
                    {showProjection && (
                      <>
                        <Area 
                          type="monotone" 
                          dataKey="upper_bound" 
                          stroke="none" 
                          fill={type.color} 
                          fillOpacity={0.1}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="lower_bound" 
                          stroke="none" 
                          fill="#ffffff" 
                          fillOpacity={1}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="forecast_yield" 
                          stroke={type.color} 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          opacity={0.6}
                          dot={{ r: 4, fill: type.color, strokeWidth: 0, opacity: 0.6 }}
                          name="Trend Projection"
                        />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
>>>>>>> 84a527c (Implement BDC Analytics suite: stress prediction, yield forecast, and AI commentary)
