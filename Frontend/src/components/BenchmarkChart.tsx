// BenchmarkChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BenchmarkChartProps {
  data: any[];
}

export function BenchmarkChart({ data }: BenchmarkChartProps) {
  return (
    // ✅ Fixed height wrapper to prevent infinite stretching
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="time"
            stroke="#fff"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#fff"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0a0a0a',
              border: '1px solid #ff0033',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />

          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#ff0033"
            strokeWidth={2}
            dot={false}
            name="CPU Usage %"
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="gpu"
            stroke="#9333ea"
            strokeWidth={2}
            dot={false}
            name="GPU Usage %"
            isAnimationActive={true}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            name="Temperature °C"
            isAnimationActive={true}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
