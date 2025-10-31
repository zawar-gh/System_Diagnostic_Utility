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
} from "recharts";
import { motion } from "motion/react";

interface BenchmarkChartProps {
  data: any[];
  isRunning?: boolean;
}

export function BenchmarkChart({ data, isRunning }: BenchmarkChartProps) {
  // Compute start time to show relative seconds
  const startTime = data[0]?.time || 0;

  const formatTime = (t: number) => {
    const elapsed = t - startTime;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="w-full h-[400px] bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-3 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-orbitron text-sm tracking-wider">
          {isRunning ? "📡 Live Performance Feed" : "📈 Benchmark Overview"}
        </h2>
        {isRunning && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-[11px] text-red-400"
          >
            Streaming live metrics...
          </motion.div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="time"
            stroke="#aaa"
            style={{ fontSize: "11px" }}
            tickFormatter={formatTime}
          />
          <YAxis
            stroke="#aaa"
            style={{ fontSize: "11px" }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #ff0033",
              borderRadius: "6px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any, name: string) =>
              typeof value === "number" ? value.toFixed(2) : value
            }
            labelFormatter={(label: any) => `Time: ${formatTime(label)}`}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#fff",
              paddingTop: "5px",
            }}
          />

          {/* CPU Usage */}
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#ff0033"
            strokeWidth={2}
            dot={false}
            name="CPU Usage %"
            isAnimationActive={isRunning}
            animationDuration={500}
          />

          {/* GPU Usage */}
          <Line
            type="monotone"
            dataKey="gpu"
            stroke="#9333ea"
            strokeWidth={2}
            dot={false}
            name="GPU Usage %"
            isAnimationActive={isRunning}
            animationDuration={500}
          />

          {/* RAM Bandwidth */}
          <Line
            type="monotone"
            dataKey="ram_speed_gbps"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
            name="RAM Bandwidth GB/s"
            isAnimationActive={isRunning}
            animationDuration={500}
          />

          {/* Disk Speed */}
          <Line
            type="monotone"
            dataKey="disk_speed"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Disk Speed MB/s"
            isAnimationActive={isRunning}
            animationDuration={500}
          />

          {/* Temperature */}
          <Line
            type="monotone"
            dataKey="temp"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={false}
            name="Temperature °C"
            isAnimationActive={isRunning}
            animationDuration={500}
          />

          {/* Optional: Overall Score */}
          <Line
            type="monotone"
            dataKey="overall_score"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={false}
            name="Overall Score"
            isAnimationActive={isRunning}
            animationDuration={500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
