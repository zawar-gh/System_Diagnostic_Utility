// src/components/AnalysisUpgrades/SystemScoresCard.tsx
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";

interface SystemScoresCardProps {
  latest: any;
}

export function SystemScoresCard({ latest }: SystemScoresCardProps) {
  return (
    <Card
      className="bg-[#1a1a1a] border-2 border-purple-600 p-6"
      style={{
        boxShadow: "0 0 30px rgba(147,51,234,0.4), 0 0 60px rgba(147,51,234,0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{
            filter: [
              "drop-shadow(0 0 5px #9333ea)",
              "drop-shadow(0 0 15px #9333ea)",
              "drop-shadow(0 0 5px #9333ea)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <TrendingUp className="w-6 h-6 text-purple-500" />
        </motion.div>
        <h3
          className="text-white"
          style={{ fontFamily: "Orbitron, sans-serif" }}
        >
          SYSTEM SCORES
        </h3>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {latest ? (
          <div>
            {/* CPU Score */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">CPU Score</span>
              <span className="text-white">{latest.cpu_score}</span>
            </div>
            <Progress
              value={Math.min(latest.cpu_score ?? 0, 100)}
              className="h-3"
            />

            {/* GPU Score */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">GPU Score</span>
              <span className="text-white">
                {latest.gpu_model?.toLowerCase().includes("intel")
                  ? "Same as CPU (iGPU)"
                  : latest.gpu_score}
              </span>
            </div>
            <Progress
              value={Math.min(latest.gpu_score ?? 0, 100)}
              className="h-3"
            />

            {/* Temp */}
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Average Temp</span>
              <span className="text-white">{latest.avg_temp}°C</span>
            </div>
            <Progress
              value={Math.min(latest.avg_temp ?? 0, 100)}
              className="h-3"
            />

            {/* RAM Speed */}
            {latest?.ram_result && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">RAM Speed</span>
                  <span className="text-white">
                    {latest.ram_result.ram_speed_gbps} GB/s
                  </span>
                </div>
                <Progress
                  value={Math.min(latest.ram_result.ram_speed_gbps ?? 0, 100)}
                  className="h-3"
                />
              </>
            )}

            {/* Disk Speed */}
            {latest?.disk_result && (
              <>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Disk Speed</span>
                  <span className="text-white">
                    {latest.disk_result.read_speed} MB/s
                  </span>
                </div>
                <Progress
                  value={
                    Math.min(latest.disk_result.read_speed ?? 0, 1000) / 10
                  }
                  className="h-3"
                />
              </>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            No benchmark data available.
          </p>
        )}
      </div>
    </Card>
  );
}
