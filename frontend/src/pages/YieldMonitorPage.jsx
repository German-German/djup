import { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Search } from 'lucide-react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import DataTable from '../components/ui/DataTable';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const YieldMonitorPage = () => {
  const { data: yieldOverview } = useApi('/yields/overview');
  const { data: yieldTimeSeries, loading: tsLoading } = useApi('/yields/time-series');
  const { data: yieldByBDC, loading: bdcLoading } = useApi('/yields/by-bdc');

  const overallYield = yieldOverview?.overall_weighted_yield ? (yieldOverview.overall_weighted_yield * 100).toFixed(2) : null;

  const bdcYieldData = useMemo(() => {
    if (!yieldByBDC) return [];
    return Object.keys(yieldByBDC).map(ticker => ({
      ticker,
      yield: (yieldByBDC[ticker]).toFixed(2),
      val: yieldByBDC[ticker]
    })).sort((a, b) => b.val - a.val);
  }, [yieldByBDC]);

  const bdcColumns = [
    { header: 'TICKER', accessorKey: 'ticker', cell: info => <span className="font-bold text-[#F59E0B]">{info.getValue()}</span> },
    { header: 'YIELD', accessorKey: 'yield', cell: info => <span className="font-mono text-[#F0F0F0]">{info.getValue()}%</span> },
    { header: 'PERCENTILE', accessorKey: 'ticker', cell: (info) => {
       const index = bdcYieldData.findIndex(d => d.ticker === info.getValue());
       const pct = ((bdcYieldData.length - index) / bdcYieldData.length) * 100;
       return (
         <div className="w-24 h-1 bg-[#333333] rounded-full overflow-hidden">
           <div className="h-full bg-[#10B981]" style={{ width: `${pct}%` }} />
         </div>
       );
    }}
  ];

  
  const [showProjection, setShowProjection] = useState(false);
  const [trendData, setTrendData] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/forecast/yield-trends');
        setTrendData(response.data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  const combinedSeriesData = useMemo(() => {
    if (!yieldTimeSeries) return [];
    
    let combined = yieldTimeSeries.map(d => ({
      ...d,
      first_lien: (d.first_lien_yield).toFixed(2),
      unitranche: (d.unitranche_yield).toFixed(2),
      second_lien: (d.second_lien_yield).toFixed(2),
    }));
    
    if (showProjection && trendData && trendData.first_lien?.forecast) {
      const lastHist = combined[combined.length - 1];
      const connectionPoint = {
        quarter: lastHist.quarter,
        first_lien_proj: lastHist.first_lien,
        unitranche_proj: lastHist.unitranche,
        second_lien_proj: lastHist.second_lien,
      };
      
      const projections = trendData.first_lien.forecast.map((f, i) => {
        return {
          quarter: f.quarter,
          first_lien_proj: (trendData.first_lien.forecast[i].forecast_yield).toFixed(2),
          unitranche_proj: (trendData.unitranche.forecast[i].forecast_yield).toFixed(2),
          second_lien_proj: (trendData.second_lien.forecast[i].forecast_yield).toFixed(2),
        };
      });
      
      combined = [...combined, connectionPoint, ...projections];
    }
    
    return combined;
  }, [yieldTimeSeries, showProjection, trendData]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard label="UNIVERSE WEIGHTED YIELD" value={overallYield} format="percent" icon={TrendingUp} accentColor="#F59E0B" delta={1.1} />
        <KPICard label="FIRST LIEN AVERAGE" value={combinedSeriesData?.[0]?.first_lien} format="percent" icon={BarChart3} accentColor="#10B981" delta={0.5} />
        <KPICard label="SECOND LIEN AVERAGE" value={combinedSeriesData?.[0]?.second_lien} format="percent" icon={PieChartIcon} accentColor="#8B5CF6" delta={-0.2} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#F0F0F0]">Historical Yield Spreads</h2>
            <label className="flex items-center cursor-pointer bg-[#1E1E1E] px-3 py-1.5 rounded-full border border-[#333333]">
              <span className="mr-2 text-[11px] font-bold text-[#A0A0A0]">AI TREND PROJECTION</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showProjection} onChange={() => setShowProjection(!showProjection)} />
                <div className={`block w-8 h-4 rounded-full transition-colors ${showProjection ? 'bg-[#10B981]' : 'bg-[#333333]'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${showProjection ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          <ChartPanel subtitle="Time-series analysis of asset class performance">
            {tsLoading ? <LoadingSpinner /> : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={combinedSeriesData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#333333" />
                  <XAxis dataKey="quarter" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" align="right" height={40} />
                  <Line type="monotone" dataKey="first_lien" name="First Lien" stroke="#10B981" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="unitranche" name="Unitranche" stroke="#32D7FF" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="second_lien" name="Second Lien" stroke="#8B5CF6" strokeWidth={3} dot={false} />
                  {showProjection && (
                    <>
                      <Line type="monotone" dataKey="first_lien_proj" name="First Lien (Proj)" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="unitranche_proj" name="Unitranche (Proj)" stroke="#32D7FF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="second_lien_proj" name="Second Lien (Proj)" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </>
                  )}
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
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} stroke="#333333" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="ticker" type="category" axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="val" name="Yield %" radius={[0, 4, 4, 0]}>
                    {bdcYieldData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#F59E0B' : '#333333'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        </div>

        <div className="col-span-12 lg:col-span-6 binance-panel overflow-hidden flex flex-col h-[480px]">
          <div className="px-6 py-4 border-b border-[#333333] flex justify-between items-center bg-[#1E1E1E]">
            <h3 className="font-bold text-[14px] text-[#F0F0F0] uppercase tracking-wider">Manager Yield Ranking</h3>
            <Search className="w-4 h-4 text-[#707070]" />
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
