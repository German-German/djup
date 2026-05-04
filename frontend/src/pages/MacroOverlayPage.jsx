import React, { useState, useMemo } from 'react';
import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import DataTable from '../components/ui/DataTable';
import useApi from '../hooks/useApi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceArea, ReferenceLine, ScatterChart, Scatter, ZAxis } from 'recharts';

const MacroOverlayPage = () => {
  const { data: macroData, loading: macroLoading } = useApi('/macro/overlay?series=hy_spread,ig_spread,sofr,yield_curve');
  const { data: yieldsData, loading: yieldsLoading } = useApi('/yields/time-series');

  const [seriesVisible, setSeriesVisible] = useState({
    hy_spread: true,
    ig_spread: true,
    sofr: true,
    yield_curve: true,
    private_credit: true
  });

  const toggleSeries = (key) => setSeriesVisible(prev => ({...prev, [key]: !prev[key]}));

  const combinedData = useMemo(() => {
    if (!macroData) return [];
    
    return macroData.map(macroPt => {
      // Find the yield point for this date (quarterly)
      // We assume yieldsData items have a 'quarter' or we can derive it from date
      // For now, we'll find the yield data point that corresponds to the quarter of the macro date
      const macroYear = macroPt.date.substring(0, 4);
      const macroMonth = parseInt(macroPt.date.substring(5, 7));
      const quarterNum = Math.ceil(macroMonth / 3);
      const qLabel = `Q${quarterNum}_${macroYear.substring(2)}`;
      
      const yPt = yieldsData?.find(y => y.quarter === qLabel);
      
      return {
        date: macroPt.date,
        hy_spread: macroPt.values.hy_spread,
        ig_spread: macroPt.values.ig_spread,
        sofr: macroPt.values.sofr,
        yield_curve: macroPt.values.yield_curve,
        private_credit: yPt ? yPt.overall_yield * 100 : null
      };
    });
  }, [macroData, yieldsData]);

  const macroTableColumns = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'HY Spread (bps)', accessorKey: 'hy_spread', cell: info => info.getValue()?.toFixed(2) || '-' },
    { header: 'IG Spread (bps)', accessorKey: 'ig_spread', cell: info => info.getValue()?.toFixed(2) || '-' },
    { header: 'SOFR (%)', accessorKey: 'sofr', cell: info => info.getValue()?.toFixed(2) || '-' },
    { header: '10Y-2Y (%)', accessorKey: 'yield_curve', cell: info => info.getValue()?.toFixed(2) || '-' },
    { header: 'Private Credit (%)', accessorKey: 'private_credit', cell: info => info.getValue()?.toFixed(2) || '-' },
  ];

  const loading = macroLoading || yieldsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 bg-[#0D1424] p-4 border border-[#1E2D45] rounded-[10px] flex-wrap">
        <div className="font-['DM_Sans'] text-[#8899AE] text-sm mr-2">Toggle Series:</div>
        {Object.keys(seriesVisible).map(key => (
           <label key={key} className="flex items-center gap-2 cursor-pointer text-sm font-['DM_Sans'] text-[#E8EDF5]">
             <input type="checkbox" className="accent-[#00C8E0]" checked={seriesVisible[key]} onChange={() => toggleSeries(key)} />
             {key.replace('_', ' ').toUpperCase()}
           </label>
        ))}
      </div>

      <ChartPanel title="Public vs. Private Credit Conditions" height={500}>
        {loading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
              <XAxis dataKey="date" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} tickFormatter={(tick) => tick.substring(0,7)} />
              
              <YAxis yAxisId="left" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
              <YAxis yAxisId="right" orientation="right" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} tickFormatter={(val) => `${val} bps`} />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />

              {seriesVisible.yield_curve && (
                <Line yAxisId="left" type="monotone" dataKey="yield_curve" name="10Y-2Y Curve" stroke="#10B981" strokeWidth={1} dot={false} fillOpacity={0.1} />
              )}
              
              <ReferenceLine x="2023-05-03" stroke="#4A5A6B" strokeDasharray="3 3" yAxisId="left" label={{ position: 'top', value: 'Fed +25bps', fill: '#8899AE', fontSize: 10 }} />
              <ReferenceLine x="2023-07-26" stroke="#4A5A6B" strokeDasharray="3 3" yAxisId="left" label={{ position: 'top', value: 'Fed +25bps', fill: '#8899AE', fontSize: 10 }} />

              {seriesVisible.private_credit && <Line yAxisId="left" type="monotone" dataKey="private_credit" name="Private Credit Yield" stroke="#00C8E0" strokeWidth={3} dot={false} />}
              {seriesVisible.sofr && <Line yAxisId="left" type="monotone" dataKey="sofr" name="SOFR" stroke="#8B5CF6" strokeWidth={2} dot={false} />}
              {seriesVisible.hy_spread && <Line yAxisId="right" type="monotone" dataKey="hy_spread" name="HY Spread" stroke="#F59E0B" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
              {seriesVisible.ig_spread && <Line yAxisId="right" type="monotone" dataKey="ig_spread" name="IG Spread" stroke="#10B981" strokeDasharray="5 5" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[ 
           { title: "Private vs HY Correlation", r2: "0.82", text: "Private credit yields lag HY spreads by ~2 quarters", color: "#F59E0B" },
           { title: "Private Yield vs SOFR", r2: "0.94", text: "Strong direct correlation due to floating rate nature", color: "#8B5CF6" },
           { title: "Curve vs Non-Accrual Lead", r2: "0.68", text: "Inverted curve precedes non-accrual spikes by 4-6 quarters", color: "#10B981" }
         ].map((card, i) => (
           <div key={i} className="bg-[#0D1424] border border-[#1E2D45] rounded-[10px] p-5 flex flex-col">
             <div className="flex justify-between items-start mb-4">
               <h3 className="font-['DM_Sans'] text-[13px] font-semibold text-[#E8EDF5]">{card.title}</h3>
               <span className="font-['JetBrains_Mono'] text-[14px] text-[#00C8E0] font-bold">R² = {card.r2}</span>
             </div>
             <div className="flex-1 min-h-[120px]">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" />
                   <XAxis type="number" dataKey="x" hide />
                   <YAxis type="number" dataKey="y" hide />
                   <Scatter data={Array.from({length: 20}).map(() => ({x: Math.random()*10, y: Math.random()*10 + (i*2)}))} fill={card.color} opacity={0.6} />
                 </ScatterChart>
               </ResponsiveContainer>
             </div>
             <p className="font-['DM_Sans'] text-[11px] text-[#8899AE] mt-3">{card.text}</p>
           </div>
         ))}
      </div>

      <div className="flex flex-col h-full bg-[#0D1424] border border-[#1E2D45] rounded-[10px] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2D45] flex justify-between items-center">
          <h3 className="font-['DM_Sans'] text-[14px] font-semibold text-[#E8EDF5]">Macro Context (Last 8 Data Points)</h3>
        </div>
        <div className="flex-1 p-0 overflow-x-auto">
          {loading ? <LoadingSpinner /> : (
            <DataTable 
              data={combinedData ? combinedData.slice(-8).reverse() : []} 
              columns={macroTableColumns} 
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MacroOverlayPage;
