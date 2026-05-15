import { useEffect, useRef, useMemo } from 'react';
import KPICard from '../components/ui/KPICard';
import ChartPanel from '../components/ui/ChartPanel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import * as d3 from 'd3';

const D3Heatmap = ({ data }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !containerRef.current) return;
    
    d3.select(containerRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 30, left: 60 },
      width = containerRef.current.clientWidth - margin.left - margin.right,
      height = 300 - margin.top - margin.bottom;

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const myGroups = Array.from(new Set(data.map(d => d.quarter)));
    const myVars = Array.from(new Set(data.map(d => d.bdc)));

    const x = d3.scaleBand()
      .range([ 0, width ])
      .domain(myGroups)
      .padding(0.05);
      
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x))
      .select(".domain").remove();
      
    svg.selectAll(".tick text").attr("fill", "#A0A0A0").attr("font-family", "Inter").attr("font-size", "11px");

    const y = d3.scaleBand()
      .range([ height, 0 ])
      .domain(myVars)
      .padding(0.05);
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .select(".domain").remove();
      
    svg.selectAll(".tick text").attr("fill", "#A0A0A0").attr("font-family", "Inter").attr("font-size", "11px").attr("font-weight", "bold");

    const myColor = d3.scaleLinear()
      .range(["#EF4444", "#1E1E1E", "#10B981"])
      .domain([-1, 0, 1]);

    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "absolute bg-[#121212] border border-[#333333] p-3 rounded font-['JetBrains_Mono'] text-[12px] text-[#F0F0F0] pointer-events-none z-10");

    svg.selectAll()
      .data(data, function(d) {return d.quarter+':'+d.bdc;})
      .enter()
      .append("rect")
      .attr("x", function(d) { return x(d.quarter) })
      .attr("y", function(d) { return y(d.bdc) })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.score)} )
      .style("stroke-width", 1)
      .style("stroke", "#121212")
      .on("mouseover", function() {
        tooltip.style("opacity", 1)
        d3.select(this).style("stroke", "#F59E0B").style("stroke-width", 2)
      })
      .on("mousemove", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip
          .html(`<b>${d.bdc}</b> - ${d.quarter}<br>Score: ${d.score.toFixed(2)}`)
          .style("left", (xPos + margin.left + 20) + "px")
          .style("top", (yPos + margin.top) + "px")
      })
      .on("mouseleave", function() {
        tooltip.style("opacity", 0)
        d3.select(this).style("stroke", "#121212").style("stroke-width", 1)
      })

  }, [data]);

  return <div ref={containerRef} className="w-full relative h-[300px]"></div>;
};

const SentimentPage = () => {
  const { data: overview, loading: overviewLoading } = useApi('/sentiment/overview');
  const { data: timeSeries, loading: tsLoading } = useApi('/sentiment/time-series');
  const { data: keywordsData, loading: kwLoading } = useApi('/sentiment/keywords');

  const heatmapData = useMemo(() => {
    if (!timeSeries) return [];
    let data = [];
    timeSeries.forEach(ts => {
      Object.keys(ts).forEach(k => {
        if (k !== 'quarter' && k !== 'universe') {
           data.push({ bdc: k, quarter: ts.quarter, score: ts[k] });
        }
      });
    });
    return data;
  }, [timeSeries]);

  const bdcsToGraph = useMemo(() => {
     if (!timeSeries || timeSeries.length === 0) return [];
     const keys = Object.keys(timeSeries[0]).filter(k => k !== 'quarter' && k !== 'universe');
     return keys.slice(0, 3); // Just graph top 3 to avoid clutter
  }, [timeSeries]);

  const colors = ['#32D7FF', '#8B5CF6', '#F59E0B'];

  const latestKWs = keywordsData && keywordsData.length > 0 ? keywordsData[keywordsData.length - 1] : null;
  const prevKWs = keywordsData && keywordsData.length > 1 ? keywordsData[keywordsData.length - 2] : null;

  const kwHighlights = useMemo(() => {
    if (!latestKWs || !prevKWs) return [];
    const fields = [
      { key: 'spread_compression', label: 'Spread Compression', color: '#EF4444', desc: "Mentions vs prior quarter" },
      { key: 'dry_powder', label: 'Dry Powder', color: '#10B981', desc: "Capital availability discussions" },
      { key: 'non_accrual', label: 'Non-Accrual', color: '#F59E0B', desc: "Credit quality concerns" },
      { key: 'competition', label: 'Competition', color: '#32D7FF', desc: "Direct lending vs BSL themes" }
    ];
    
    return fields.map(f => ({
      word: f.label,
      count: latestKWs[f.key] || 0,
      prev: prevKWs[f.key] || 0,
      color: f.color,
      text: f.desc
    }));
  }, [latestKWs, prevKWs]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          label="UNIVERSE SENTIMENT SCORE" 
          value={overview?.avg_sentiment} 
          format="number" 
          accentColor="#10B981" 
          loading={overviewLoading} 
        />
        <KPICard 
          label="MOST POSITIVE BDC" 
          value={overview?.top_performer?.ticker || '-'} 
          format="string" 
          delta={overview?.top_performer?.score} 
          deltaLabel="score" 
          accentColor="#32D7FF" 
          loading={overviewLoading} 
        />
        <KPICard 
          label="MOST NEGATIVE BDC" 
          value={overview?.bottom_performer?.ticker || '-'} 
          format="string" 
          delta={overview?.bottom_performer?.score} 
          deltaLabel="score" 
          accentColor="#EF4444" 
          loading={overviewLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Manager Sentiment Over Time" height={350}>
          {tsLoading ? <LoadingSpinner /> : timeSeries?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...timeSeries].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} horizontal={false} />
                <XAxis dataKey="quarter" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} domain={[-1, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333333', color: '#F0F0F0' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <ReferenceLine y={0} stroke="#555555" />
                <Line type="monotone" dataKey="universe" name="Universe Avg" stroke="#F0F0F0" strokeWidth={4} dot={{ r: 4 }} />
                {bdcsToGraph.map((bdc, i) => (
                  <Line key={bdc} type="monotone" dataKey={bdc} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No sentiment data found" />}
        </ChartPanel>

        <ChartPanel title="Keyword Frequency Tracker" height={350}>
          {kwLoading ? <LoadingSpinner /> : keywordsData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} horizontal={false} />
                <XAxis dataKey="quarter" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333333', color: '#F0F0F0', fontFamily: 'JetBrains Mono' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="spread_compression" name="Spread Compression" stackId="a" fill="#EF4444" />
                <Bar dataKey="competition" name="Competition" stackId="a" fill="#32D7FF" />
                <Bar dataKey="non_accrual" name="Non-Accrual" stackId="a" fill="#F59E0B" />
                <Bar dataKey="dry_powder" name="Dry Powder" stackId="a" fill="#10B981" />
                <Bar dataKey="deal_flow" name="Deal Flow" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No keyword data found" />}
        </ChartPanel>
      </div>

      <ChartPanel title="BDC Sentiment Heatmap" subtitle="NLP score from Earnings Call Transcripts (-1 to +1)" height={380}>
         {tsLoading ? <LoadingSpinner /> : heatmapData.length > 0 ? (
           <D3Heatmap data={heatmapData} />
         ) : <EmptyState message="No heatmap data found" />}
      </ChartPanel>

      {kwHighlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kwHighlights.map((kw, i) => (
            <div key={i} className="bg-[#1E1E1E] border border-[#333333] rounded-[12px] p-5 relative overflow-hidden" style={{ borderTop: `2px solid ${kw.color}` }}>
               <h4 className="font-['Inter'] text-[12px] uppercase text-[#A0A0A0] font-semibold tracking-wider">{kw.word}</h4>
               <div className="flex items-end gap-3 mt-2">
                  <span className="font-['JetBrains_Mono'] text-[24px] text-[#F0F0F0] font-bold">{kw.count}</span>
                  <span className={`text-[11px] mb-1 font-['JetBrains_Mono'] ${kw.count > kw.prev ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                    {kw.count > kw.prev ? '▲' : '▼'} {Math.abs(kw.count - kw.prev)} vs prev
                  </span>
               </div>
               <p className="font-['Inter'] text-[11px] text-[#707070] mt-3">{kw.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentPage;
