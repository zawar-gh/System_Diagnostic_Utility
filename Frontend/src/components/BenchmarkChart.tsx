import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BenchmarkChartProps {
  data: any[];
}

export function BenchmarkChart({ data }: BenchmarkChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="time" stroke="#fff" style={{ fontSize: '12px' }} />
        <YAxis stroke="#fff" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #ff0033',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line
          type="monotone"
          dataKey="cpu"
          stroke="#ff0033"
          strokeWidth={2}
          dot={{ fill: '#ff0033', r: 3 }}
          name="CPU Usage %"
        />
        <Line
          type="monotone"
          dataKey="gpu"
          stroke="#9333ea"
          strokeWidth={2}
          dot={{ fill: '#9333ea', r: 3 }}
          name="GPU Usage %"
        />
        <Line
          type="monotone"
          dataKey="temp"
          stroke="#22d3ee"
          strokeWidth={2}
          dot={{ fill: '#22d3ee', r: 3 }}
          name="Temperature °C"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}