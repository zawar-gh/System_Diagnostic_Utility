// src/components/AnalysisUpgrades/UpgradeRecommendationsCard.tsx
import { AlertTriangle } from "lucide-react";
import { Card } from "./ui/card";

interface UpgradeRecommendationsCardProps {
  upgradeRecommendations: any[];
}

export function UpgradeRecommendationsCard({
  upgradeRecommendations,
}: UpgradeRecommendationsCardProps) {
  return (
    <Card
      className="bg-[#1a1a1a] border-2 border-red-600 p-6 flex flex-col h-full"
      style={{
        boxShadow: "0 0 30px rgba(255,0,0,0.4), 0 0 60px rgba(255,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3
          className="text-white"
          style={{
            fontSize: "1.10rem",
            fontFamily: "Orbitron, sans-serif",
          }}
        >
          LIMITING FACTOR
        </h3>
      </div>

      {/* Body */}
      <div className="flex-grow">
        {upgradeRecommendations.length === 0 ? (
          <div className="text-gray-400 p-3 text-sm">
            Run a benchmark to get personalized upgrade suggestions.
          </div>
        ) : (
          <div className="space-y-6">
            {upgradeRecommendations.map((item) => (
              <div key={item.id} className="transition-all duration-300">
                <div className="space-y-3">
                  <div className="text-gray-400 text-xs uppercase">
                    Component
                  </div>
                  <div
                    className="text-white text-sm"
                    style={{ fontFamily: "Orbitron, sans-serif" }}
                  >
                    {item.component}
                  </div>

                  <div className="text-gray-400 text-xs uppercase">Model</div>
                  <div className="text-white text-sm">{item.current}</div>

                  <div className="text-gray-400 text-xs uppercase">
                    Suggestion
                  </div>
                  <div className="text-white text-sm">{item.recommended}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
