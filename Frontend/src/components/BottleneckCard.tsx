// src/components/AnalysisUpgrades/BottleneckCard.tsx
import { motion } from "motion/react";
import { AlertTriangle } from "lucide-react";
import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface BottleneckCardProps {
  bottleneckData: any[];
  latest: any;
}

export function BottleneckCard({ bottleneckData, latest }: BottleneckCardProps) {
  return (
    <Card
      className="bg-[#1a1a1a] border-2 border-red-600 p-6"
      style={{
        boxShadow: "0 0 30px rgba(255,0,0,0.4), 0 0 60px rgba(255,0,0,0.2)",
      }}
    >
      {/* 🔻 Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 5px #ff0033)",
              "drop-shadow(0 0 15px #ff0033)",
              "drop-shadow(0 0 5px #ff0033)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </motion.div>
        <h3
          className="text-white"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          BOTTLENECK DETECTION
        </h3>
      </div>

      {/* 🧠 Pie Chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={bottleneckData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            label={({ name, value }) => `${name}: ${Math.round(value)}%`}
          >
            {bottleneckData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* 🌡️ Overall Health */}
      {latest?.bottleneckAnalysis && (
        <p className="text-gray-300 text-sm mt-3 text-center">
          Overall System Health:{" "}
          <span
            className={
              latest.bottleneckAnalysis.overall_health === "Excellent"
                ? "text-green-400"
                : latest.bottleneckAnalysis.overall_health === "Moderate"
                ? "text-yellow-400"
                : "text-red-400"
            }
          >
            {latest.bottleneckAnalysis.overall_health}
          </span>
        </p>
      )}
    </Card>
  );
}
