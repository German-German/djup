import React, { useEffect, useRef } from 'react';
import KPICard from '../components/ui/KPICard';
import ChartPanel from '../components/ui/ChartPanel';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as d3 from 'd3';

const MOCK_HEATMAP_DATA = [
  { bdc: 'ARCC', quarter: 'Q1_23', score: 0.8 },
  { bdc: 'ARCC', quarter: 'Q2_23', score: 0.6 },
  { bdc: 'ARCC', quarter: 'Q3_23', score: 0.2 },
  { bdc: 'ARCC', quarter: 'Q4_23', score: -0.1 },
  { bdc: 'ARCC', quarter: 'Q1_24', score: 0.4 },
  { bdc: 'OBDC', quarter: 'Q1_23', score: 0.9 },
  { bdc: 'OBDC', quarter: 'Q2_23', score: 0.7 },
  { bdc: 'OBDC', quarter: 'Q3_23', score: 0.4 },
  { bdc: 'OBDC', quarter: 'Q4_23', score: -0.3 },
  { bdc: 'OBDC', quarter: 'Q1_24', score: 0.1 },
  { bdc: 'FSK', quarter: 'Q1_23', score: 0.2 },
  { bdc: 'FSK', quarter: 'Q2_23', score: 0.1 },
  { bdc: 'FSK', quarter: 'Q3_23', score: -0.4 },
  { bdc: 'FSK', quarter: 'Q4_23', score: -0.8 },
  { bdc: 'FSK', quarter: 'Q1_24', score: -0.2 },
];

const D3Heatmap = ({ data }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;
    
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
      
    svg.selectAll(".tick text").attr("fill", "#8899AE").attr("font-family", "DM Sans").attr("font-size", "11px");

    const y = d3.scaleBand()
      .range([ height, 0 ])
      .domain(myVars)
      .padding(0.05);
      
    svg.append("g")
      .call(d3.axisLeft(y))
      .select(".domain").remove();
      
    svg.selectAll(".tick text").attr("fill", "#8899AE").attr("font-family", "DM Sans").attr("font-size", "11px").attr("font-weight", "bold");

    const myColor = d3.scaleLinear()
      .range(["#F43F5E", "#1E2D45", "#10B981"])
      .domain([-1, 0, 1]);

    const tooltip = d3.select(containerRef.current)
      .append("div")
      .style("opacity", 0)
      .attr("class", "absolute bg-[#0D1424] border border-[#334155] p-3 rounded font-['JetBrains_Mono'] text-[12px] text-[#E8EDF5] pointer-events-none z-10");

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
      .style("stroke", "#111827")
      .on("mouseover", function(event, d) {
        tooltip.style("opacity", 1)
        d3.select(this).style("stroke", "#00C8E0").style("stroke-width", 2)
      })
      .on("mousemove", function(event, d) {
        const [xPos, yPos] = d3.pointer(event);
        tooltip
          .html(`<b>${d.bdc}</b> - ${d.quarter}<br>Score: ${d.score.toFixed(2)}<br><span class="text-[#8899AE] text-[10px]">Dominant: spread compression</span>`)
          .style("left", (xPos + margin.left + 20) + "px")
          .style("top", (yPos + margin.top) + "px")
      })
      .on("mouseleave", function(event, d) {
        tooltip.style("opacity", 0)
        d3.select(this).style("stroke", "#111827").style("stroke-width", 1)
      })

  }, [data]);

  return <div ref={containerRef} className="w-full relative h-[300px]"></div>;
};

const SentimentPage = () => {
  const lineData = [
    { quarter: 'Q1_23', ARCC: 0.8, OBDC: 0.9, FSK: 0.2, universe: 0.63 },
    { quarter: 'Q2_23', ARCC: 0.6, OBDC: 0.7, FSK: 0.1, universe: 0.46 },
    { quarter: 'Q3_23', ARCC: 0.2, OBDC: 0.4, FSK: -0.4, universe: 0.06 },
    { quarter: 'Q4_23', ARCC: -0.1, OBDC: -0.3, FSK: -0.8, universe: -0.4 },
    { quarter: 'Q1_24', ARCC: 0.4, OBDC: 0.1, FSK: -0.2, universe: 0.1 },
  ];

  const barData = [
    { quarter: 'Q1_23', 'spread compression': 10, 'dry powder': 40, 'deal flow': 30, 'competition': 20, 'non-accrual': 5 },
    { quarter: 'Q2_23', 'spread compression': 15, 'dry powder': 35, 'deal flow': 35, 'competition': 25, 'non-accrual': 8 },
    { quarter: 'Q3_23', 'spread compression': 45, 'dry powder': 30, 'deal flow': 20, 'competition': 40, 'non-accrual': 15 },
    { quarter: 'Q4_23', 'spread compression': 80, 'dry powder': 20, 'deal flow': 10, 'competition': 50, 'non-accrual': 40 },
    { quarter: 'Q1_24', 'spread compression': 60, 'dry powder': 25, 'deal flow': 15, 'competition': 45, 'non-accrual': 30 },
  ];

  const keywords = [
    { word: "spread compression", count: 60, prev: 80, color: "#F43F5E", text: "Mentions decreased vs prior quarter, but remain historically elevated." },
    { word: "dry powder", count: 25, prev: 20, color: "#10B981", text: "Managers highlighting capital availability for new deployments." },
    { word: "non-accrual", count: 30, prev: 40, color: "#F59E0B", text: "Credit quality discussions softening slightly after Q4 peak." },
    { word: "competition", count: 45, prev: 50, color: "#00C8E0", text: "Direct lending vs BSL competition remains a dominant theme." },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="UNIVERSE SENTIMENT SCORE" value={0.10} format="percent" delta={0.5} deltaLabel="vs Q4 23" accentColor="#10B981" />
        <KPICard label="MOST POSITIVE BDC" value="ARCC" format="string" delta={0.4} deltaLabel="sentiment score" accentColor="#00C8E0" />
        <KPICard label="MOST NEGATIVE BDC" value="FSK" format="string" delta={-0.2} deltaLabel="sentiment score" accentColor="#F43F5E" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="Manager Sentiment Over Time" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
              <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} domain={[-1, 1]} />
              <Tooltip contentStyle={{ backgroundColor: '#0D1424', borderColor: '#334155', color: '#E8EDF5' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <ReferenceLine y={0} stroke="#4A5A6B" />
              <Line type="monotone" dataKey="universe" name="Universe Avg" stroke="#E8EDF5" strokeWidth={4} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ARCC" stroke="#00C8E0" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="OBDC" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="FSK" stroke="#F43F5E" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Keyword Frequency Tracker" height={350}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D45" vertical={false} />
              <XAxis dataKey="quarter" stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#8899AE" tick={{ fill: '#8899AE', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0D1424', borderColor: '#334155', color: '#E8EDF5', fontFamily: 'JetBrains Mono' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="spread compression" stackId="a" fill="#F43F5E" />
              <Bar dataKey="competition" stackId="a" fill="#00C8E0" />
              <Bar dataKey="non-accrual" stackId="a" fill="#F59E0B" />
              <Bar dataKey="dry powder" stackId="a" fill="#10B981" />
              <Bar dataKey="deal flow" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <ChartPanel title="BDC Sentiment Heatmap" subtitle="NLP score from Earnings Call Transcripts (-1 to +1)" height={380}>
         <D3Heatmap data={MOCK_HEATMAP_DATA} />
      </ChartPanel>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keywords.map((kw, i) => (
          <div key={i} className="bg-[#0D1424] border border-[#1E2D45] rounded-[10px] p-5 relative overflow-hidden" style={{ borderTop: `2px solid ${kw.color}` }}>
             <h4 className="font-['DM_Sans'] text-[12px] uppercase text-[#8899AE] font-semibold tracking-wider">{kw.word}</h4>
             <div className="flex items-end gap-3 mt-2">
                <span className="font-['JetBrains_Mono'] text-[24px] text-[#E8EDF5] font-bold">{kw.count}</span>
                <span className={`text-[11px] mb-1 font-['JetBrains_Mono'] ${kw.count > kw.prev ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
                  {kw.count > kw.prev ? '▲' : '▼'} {Math.abs(kw.count - kw.prev)} vs prev
                </span>
             </div>
             <p className="font-['DM_Sans'] text-[11px] text-[#4A5A6B] mt-3">{kw.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SentimentPage;
