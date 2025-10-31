// src/components/AnalysisUpgrades/PerformanceComparisonCard.tsx
import { motion } from "motion/react";
import { TrendingUp } from "lucide-react";
import { Card } from "./ui/card";

interface PerformanceComparisonCardProps {
  throttleResult: Record<string, number> | null;
  latest: any;
}

export function PerformanceComparisonCard({
  throttleResult,
  latest,
}: PerformanceComparisonCardProps) {
  return (
    <div className="flex flex-col h-full">
      <Card
        className="bg-[#1a1a1a] border-2 flex flex-col h-full p-6"
        style={{
          borderColor: "#22d3ee",
          boxShadow: "0 0 25px #22d3ee40, 0 0 50px #22d3ee20",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <motion.div
            animate={{
              filter: [
                "drop-shadow(0 0 5px #22d3ee)",
                "drop-shadow(0 0 15px #22d3ee)",
                "drop-shadow(0 0 5px #22d3ee)",
              ],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <TrendingUp className="w-6 h-6 text-cyan-400" />
          </motion.div>
          <h3
            className="text-white"
            style={{ fontFamily: "Orbitron, sans-serif" }}
          >
            PERFORMANCE COMPARISON
          </h3>
        </div>

        {/* Body */}
        <div className="flex-grow">
          {throttleResult ? (
            <div className="space-y-2 text-sm">
              {Object.entries(throttleResult).map(([component, value]) => {
                let percent = Number(value || 0);

                // Fix for Intel iGPU: use CPU value instead
                if (
                  component === "GPU" &&
                  latest?.gpu_model?.toLowerCase().includes("intel")
                ) {
                  percent = Number(throttleResult.CPU || latest.cpu_score || 0);
                }

                return (
                  <div
                    key={component}
                    className="flex justify-between items-center border-b border-gray-800 pb-1"
                  >
                    <span className="text-gray-300">{component}</span>
                    <span className="text-white">
                      {percent < -5
                        ? `-${Math.abs(percent)}% (Bad)`
                        : percent > 5
                        ? `+${percent}% (Good)`
                        : `(As Expected)`}
                    </span>
                  </div>
                );
              })}

              <p className="text-gray-400 text-xs mt-3 text-center">
                Based on average results from similar PC components.
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              Not enough community data to compute throttle results yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
