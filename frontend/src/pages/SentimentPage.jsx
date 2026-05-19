import { useEffect, useRef, useMemo } from 'react';
import KPICard from '../components/ui/KPICard';
import TerminalPanel from '../components/ui/TerminalPanel';
import Badge from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import useApi from '../hooks/useApi';
import AIInsightCard from '../components/ui/AIInsightCard';
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
      
    svg.selectAll(".tick text").attr("fill", "var(--djup-text-muted)").attr("font-family", "JetBrains Mono").attr("font-size", "10px");

    const y = d3.scaleBand()
      .range([ height, 0 ])
      .domain(myVars)
      .padding(0.05);
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .select(".domain").remove();
      
    svg.selectAll(".tick text").attr("fill", "var(--djup-text-muted)").attr("font-family", "JetBrains Mono").attr("font-size", "10px").attr("font-weight", "bold");

    const myColor = d3.scaleLinear()
      .range(["var(--djup-red)", "var(--djup-bg-panel)", "var(--djup-green)"])
      .domain([-1, 0, 1]);

    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "absolute bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 rounded-sm font-mono text-[11px] text-[var(--djup-text)] pointer-events-none z-10");

    svg.selectAll()
      .data(data, function(d) {return d.quarter+':'+d.bdc;})
      .enter()
      .append("rect")
      .attr("x", function(d) { return x(d.quarter) })
      .attr("y", function(d) { return y(d.bdc) })
      .attr("rx", 1)
      .attr("ry", 1)
      .attr("width", x.bandwidth() )
      .attr("height", y.bandwidth() )
      .style("fill", function(d) { return myColor(d.score)} )
      .style("stroke-width", 1)
      .style("stroke", "var(--djup-bg-panel)")
      .on("mouseover", function() {
        tooltip.style("opacity", 1)
        d3.select(this).style("stroke", "var(--djup-primary)").style("stroke-width", 2)
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
        d3.select(this).style("stroke", "var(--djup-bg-panel)").style("stroke-width", 1)
      })

  }, [data]);

  return <div ref={containerRef} className="w-full relative h-[300px]"></div>;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--djup-bg-main)] border border-[var(--djup-border)] p-3 rounded-sm shadow-xl">
        <p className="text-[11px] font-mono text-[var(--djup-text-muted)] mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-3 text-[12px] font-mono mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[var(--djup-text)]">{entry.name}:</span>
            <span className="font-bold text-[var(--djup-primary)]">{entry.value.toFixed ? entry.value.toFixed(2) : entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
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

  const colors = ['var(--djup-cyan)', 'var(--djup-purple)', 'var(--djup-primary)'];

  const latestKWs = keywordsData && keywordsData.length > 0 ? keywordsData[keywordsData.length - 1] : null;
  const prevKWs = keywordsData && keywordsData.length > 1 ? keywordsData[keywordsData.length - 2] : null;

  const kwHighlights = useMemo(() => {
    if (!latestKWs || !prevKWs) return [];
    const fields = [
      { key: 'spread_compression', label: 'Spread Compression', color: 'var(--djup-red)', desc: "Mentions vs prior quarter" },
      { key: 'dry_powder', label: 'Dry Powder', color: 'var(--djup-green)', desc: "Capital availability discussions" },
      { key: 'non_accrual', label: 'Non-Accrual', color: 'var(--djup-primary)', desc: "Credit quality concerns" },
      { key: 'competition', label: 'Competition', color: 'var(--djup-cyan)', desc: "Direct lending vs BSL themes" }
    ];
    
    return fields.map(f => ({
      word: f.label,
      count: latestKWs[f.key] || 0,
      prev: prevKWs[f.key] || 0,
      color: f.color,
      text: f.desc
    }));
  }, [latestKWs, prevKWs]);

  const rawSentiment = overview?.avg_sentiment ? (overview.avg_sentiment).toFixed(2) : '0.45';

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-semibold text-[var(--djup-text)] tracking-tight mb-2">NLP Sentiment</h1>
          <p className="text-[14px] text-[var(--djup-text-muted)] max-w-2xl leading-relaxed">
            Earnings transcript analysis: quantifying BDC executive confidence, competitive pressures, and credit outlook.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge label="Live Universe" variant="live" />
          <Badge label="NLP Engine" variant="ai" />
          <Badge label="Institutional" />
        </div>
      </div>

      <AIInsightCard
        page="sentiment"
        style="news"
        ready={!!overview && !!latestKWs}
        context={{
          universe_score: overview?.avg_sentiment,
          top: overview?.top_performer,
          bottom: overview?.bottom_performer,
          latest_keywords: latestKWs,
          prior_keywords: prevKWs,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          label="UNIVERSE SENTIMENT SCORE"
          value={rawSentiment} 
          loading={overviewLoading && !overview} 
          highlight
        />
        <KPICard 
          label="MOST POSITIVE BDC" 
          value={overview?.top_performer?.ticker || 'MAIN'} 
          delta={overview?.top_performer?.score || 0.68} 
        />
        <KPICard 
          label="MOST NEGATIVE BDC" 
          value={overview?.bottom_performer?.ticker || 'BKCC'} 
          delta={overview?.bottom_performer?.score || -0.12} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TerminalPanel title="Manager Sentiment Over Time" className="h-[350px]">
          <div className="w-full h-full pt-4 pb-8 pr-4">
            {tsLoading ? <LoadingSpinner /> : timeSeries?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" vertical={false} horizontal={false} />
                  <XAxis dataKey="quarter" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} domain={[-1, 1]} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />
                  <ReferenceLine y={0} stroke="rgba(255, 190, 80, 0.15)" />
                  <Line type="monotone" dataKey="universe" name="Universe Avg" stroke="var(--djup-text)" strokeWidth={3} dot={{ r: 3, fill: 'var(--djup-text)' }} />
                  {bdcsToGraph.map((bdc, i) => (
                    <Line key={bdc} type="monotone" dataKey={bdc} stroke={colors[i % colors.length]} strokeWidth={1.5} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No sentiment data found" />}
          </div>
        </TerminalPanel>

        <TerminalPanel title="Keyword Frequency Tracker" className="h-[350px]">
          <div className="w-full h-full pt-4 pb-8 pr-4">
            {kwLoading ? <LoadingSpinner /> : keywordsData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keywordsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 190, 80, 0.05)" vertical={false} horizontal={false} />
                  <XAxis dataKey="quarter" stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis stroke="var(--djup-text-muted)" tick={{ fill: 'var(--djup-text-muted)', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--djup-text-muted)' }} />
                  <Bar dataKey="spread_compression" name="Spread Compression" stackId="a" fill="var(--djup-red)" />
                  <Bar dataKey="competition" name="Competition" stackId="a" fill="var(--djup-cyan)" />
                  <Bar dataKey="non_accrual" name="Non-Accrual" stackId="a" fill="var(--djup-primary)" />
                  <Bar dataKey="dry_powder" name="Dry Powder" stackId="a" fill="var(--djup-green)" />
                  <Bar dataKey="deal_flow" name="Deal Flow" stackId="a" fill="var(--djup-purple)" radius={[1, 1, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="No keyword data found" />}
          </div>
        </TerminalPanel>
      </div>

      <TerminalPanel title="BDC Sentiment Heatmap" className="h-[380px]" subtitle="NLP score from Earnings Call Transcripts (-1 to +1)">
         <div className="w-full h-full pb-8">
           {tsLoading ? <LoadingSpinner /> : heatmapData.length > 0 ? (
             <D3Heatmap data={heatmapData} />
           ) : <EmptyState message="No heatmap data found" />}
         </div>
      </TerminalPanel>

      {kwHighlights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kwHighlights.map((kw, i) => (
            <div key={i} className="bg-[var(--djup-bg-panel)] border border-[var(--djup-border)] p-4 relative overflow-hidden rounded-sm" style={{ borderTop: `2px solid ${kw.color}` }}>
               <h4 className="font-mono text-[10px] uppercase text-[var(--djup-text-muted)] font-bold tracking-wider">{kw.word}</h4>
               <div className="flex items-end gap-3 mt-2">
                  <span className="font-mono text-[22px] text-[var(--djup-text)] font-bold">{kw.count}</span>
                  <span className={`text-[10px] mb-1 font-mono ${kw.count > kw.prev ? 'text-[var(--djup-red)]' : 'text-[var(--djup-green)]'}`}>
                    {kw.count > kw.prev ? '▲' : '▼'} {Math.abs(kw.count - kw.prev)} vs prev
                  </span>
               </div>
               <p className="font-mono text-[10px] text-[var(--djup-text-faint)] mt-3 leading-relaxed">{kw.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SentimentPage;
