//BenchmarkChart.tsx
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
  return (
    <div className="w-full h-[350px] bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-3 shadow-lg">
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

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#222" />
          <XAxis
            dataKey="time"
            stroke="#aaa"
            style={{ fontSize: "11px" }}
            tickFormatter={(t) => `${t}s`}
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
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: "#fff",
              paddingTop: "5px",
            }}
          />

          {/* CPU line */}
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

          {/* GPU line */}
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

          {/* Temperature line */}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
