import re

with open('frontend/src/pages/YieldMonitorPage.jsx', 'r') as f:
    content = f.read()

head_match = re.search(r'<<<<<<< HEAD\n(.*?)=======', content, re.DOTALL)
if not head_match:
    print("Merge markers not found in YieldMonitorPage.jsx")
    exit(1)

head_content = head_match.group(1)

# 1. Update Imports
head_content = head_content.replace(
    "import React, { useMemo } from 'react';",
    "import React, { useMemo, useState, useEffect } from 'react';\nimport axios from 'axios';"
)
head_content = head_content.replace(
    "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';",
    "import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, ComposedChart, Area } from 'recharts';"
)

# 2. Add State and Logic for Projections
logic_to_add = """
  const [showProjection, setShowProjection] = useState(false);
  const [trendData, setTrendData] = useState({});
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/forecast/yield-trends');
        setTrendData(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setTrendLoading(false);
      }
    }
    fetchData();
  }, []);

  const combinedSeriesData = useMemo(() => {
    if (!yieldTimeSeries) return [];
    
    let combined = yieldTimeSeries.map(d => ({
      ...d,
      first_lien: (d.first_lien_yield * 100).toFixed(2),
      unitranche: (d.unitranche_yield * 100).toFixed(2),
      second_lien: (d.second_lien_yield * 100).toFixed(2),
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
          first_lien_proj: (trendData.first_lien.forecast[i].forecast_yield * 100).toFixed(2),
          unitranche_proj: (trendData.unitranche.forecast[i].forecast_yield * 100).toFixed(2),
          second_lien_proj: (trendData.second_lien.forecast[i].forecast_yield * 100).toFixed(2),
        };
      });
      
      combined = [...combined, connectionPoint, ...projections];
    }
    
    return combined;
  }, [yieldTimeSeries, showProjection, trendData]);
"""
head_content = head_content.replace(
    "const seriesData = useMemo(() => {",
    logic_to_add + "\n  const oldSeriesData = useMemo(() => {"
)
# We don't need oldSeriesData anymore, so let's just replace the whole seriesData block
head_content = re.sub(
    r'const seriesData = useMemo\(\(\) => \{.*?\n  \}, \[yieldTimeSeries\]\);',
    logic_to_add.strip(),
    head_content,
    flags=re.DOTALL
)

# 3. Add UI toggle
toggle_ui = """
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-[#EAECEF]">Historical Yield Spreads</h2>
            <label className="flex items-center cursor-pointer bg-[#1E2329] px-3 py-1.5 rounded-full border border-[#2B2F36]">
              <span className="mr-2 text-[11px] font-bold text-[#848E9C]">AI TREND PROJECTION</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={showProjection} onChange={() => setShowProjection(!showProjection)} />
                <div className={`block w-8 h-4 rounded-full transition-colors ${showProjection ? 'bg-[#0ECB81]' : 'bg-[#2B2F36]'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${showProjection ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          <ChartPanel subtitle="Time-series analysis of asset class performance">
"""
head_content = head_content.replace(
    '<ChartPanel title="Historical Yield Spreads" subtitle="Time-series analysis of asset class performance">',
    toggle_ui.strip()
)

# 4. Update the LineChart
chart_lines = """
                  <Line type="monotone" dataKey="first_lien" name="First Lien" stroke="#0ECB81" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="unitranche" name="Unitranche" stroke="#32D7FF" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="second_lien" name="Second Lien" stroke="#8B5CF6" strokeWidth={3} dot={false} />
                  {showProjection && (
                    <>
                      <Line type="monotone" dataKey="first_lien_proj" name="First Lien (Proj)" stroke="#0ECB81" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="unitranche_proj" name="Unitranche (Proj)" stroke="#32D7FF" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="second_lien_proj" name="Second Lien (Proj)" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </>
                  )}
"""
head_content = re.sub(
    r'<Line type="monotone" dataKey="first_lien".*?dot=\{false\} />',
    chart_lines.strip(),
    head_content,
    flags=re.DOTALL
)

# fix seriesData reference
head_content = head_content.replace('data={seriesData}', 'data={combinedSeriesData}')
head_content = head_content.replace('value={seriesData?.[0]?.first_lien}', 'value={combinedSeriesData?.[0]?.first_lien}')
head_content = head_content.replace('value={seriesData?.[0]?.second_lien}', 'value={combinedSeriesData?.[0]?.second_lien}')


with open('frontend/src/pages/YieldMonitorPage.jsx', 'w') as f:
    f.write(head_content)

print("YieldMonitorPage fixed successfully.")
