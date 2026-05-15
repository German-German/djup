import KPICard from '../components/ui/KPICard';
import ChartPanel, { CustomTooltip } from '../components/ui/ChartPanel';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import useApi from '../hooks/useApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const DealFlowPage = () => {
  const { data: trends, loading: trendsLoading } = useApi('/dealflow/trends');
  const { data: bySector, loading: sectorLoading } = useApi('/dealflow/by-sector');
  const { data: holdSizes, loading: holdLoading } = useApi('/dealflow/hold-sizes');

  const latestTrend = trends && trends.length > 0 ? trends[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard label="GROSS ORIGINATIONS (Q)" value={latestTrend?.total_new_originations_bn} format="currency" accentColor="#F59E0B" loading={trendsLoading} />
        <KPICard label="NET DEPLOYMENT (Q)" value={latestTrend?.net_deployment_bn} format="currency" accentColor="#10B981" loading={trendsLoading} />
        <KPICard label="AVG NEW LOAN YIELD" value={latestTrend?.avg_new_origination_yield ? latestTrend.avg_new_origination_yield * 100 : null} format="percent" accentColor="#8B5CF6" loading={trendsLoading} />
      </div>

      <ChartPanel title="Origination & Repayment Activity" height={400}>
        {trendsLoading ? <LoadingSpinner /> : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trends ? [...trends].reverse() : []} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} horizontal={false} />
              <XAxis dataKey="quarter_label" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} />
              <YAxis yAxisId="right" orientation="right" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}B`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Bar yAxisId="left" dataKey="total_new_originations_bn" name="Originations" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="left" dataKey="total_repayments_bn" name="Repayments" fill="#555555" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="net_deployment_bn" name="Net Deployment" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartPanel title="New Origination by Sector" height={450}>
          {sectorLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={bySector || []} margin={{ top: 0, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" horizontal={false} vertical={false} />
                <XAxis type="number" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}M`} />
                <YAxis dataKey="industry" type="category" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} formatter={(val) => `$${val}M`} />
                <Bar dataKey="fair_value_mm" name="Origination Vol" fill="#32D7FF" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Average Hold Size Trend" height={450}>
          {holdLoading ? <LoadingSpinner /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={holdSizes ? [...holdSizes].reverse() : []} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} horizontal={false} />
                <XAxis dataKey="quarter" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="avg_loan_size" name="Average Hold" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="median_loan_size" name="Median Hold" stroke="#8B5CF6" strokeDasharray="5 5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>
    </div>
  );
};

export default DealFlowPage;
