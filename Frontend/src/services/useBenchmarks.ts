import { useState, useEffect } from "react";
import { toast } from "sonner";
import { API } from "../api/axiosConfig";

export function useBenchmarks(user: any) {
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bottleneckData, setBottleneckData] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [throttleResult, setThrottleResult] = useState<any | null>(null);
  const [upgradeRecommendations, setUpgradeRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchBenchmarks = async () => {
      setLoading(true);
      try {
        const resp = await API.get("/benchmarks/");
        if (cancelled) return;
        const data = Array.isArray(resp.data) ? resp.data : [];
        setBenchmarks(data);

        if (data.length > 0) {
          const latest = data[0];

          // --- Fetch bottleneck details ---
          const bottleneckResp = await API.get(`/benchmarks/bottleneck/?benchmark_id=${latest.id}`);
          const bottleneck = bottleneckResp.data;

          // --- Prepare PieChart data ---
          setBottleneckData([
            { name: "CPU", value: Math.min(Math.round(bottleneck.component_scores?.CPU || latest.cpu_score || 0), 100), color: "#ff0033" },
            { name: "GPU", value: Math.min(Math.round(bottleneck.component_scores?.GPU || latest.gpu_score || 0), 100), color: "#9333ea" },
            { name: "RAM", value: Math.min(Math.round((bottleneck.component_scores?.RAM || latest.ram_gb * 3) || 0), 100), color: "#22d3ee" },
            { name: "Storage", value: Math.min(Math.round(bottleneck.component_scores?.Storage || 0), 100), color: "#10b981" },
            { name: "Temp", value: Math.min(Math.round(latest.avg_temp || 0), 100), color: "#f59e0b" },
          ]);

          // --- Handle Throttle Result & Recommendations ---
          if (bottleneck && bottleneck.throttleResult) {
            setThrottleResult(bottleneck.throttleResult);

            if (bottleneck.topThrottle) {
              const top = bottleneck.topThrottle;
              const isGpuIGPU = top.component === "GPU" && latest.gpu_model?.toLowerCase().includes("intel");

              setUpgradeRecommendations([
                {
                  id: 1,
                  component: isGpuIGPU ? "CPU" : top.component,
                  current: isGpuIGPU ? latest.cpu_model : latest?.[`${top.component.toLowerCase()}_model`] || "Unknown",
                  recommended: isGpuIGPU
                    ? `Your CPU is the limiting factor for your Intel iGPU. Upgrade CPU instead.`
                    : `Your ${top.component} is the Main Bottleneck in Your System, Upgrade recommended.`,
                  boost: top.dip_percent,
                  color:
                    isGpuIGPU || top.component === "CPU"
                      ? "#ff0033"
                      : top.component === "GPU"
                      ? "#9333ea"
                      : top.component === "RAM"
                      ? "#22d3ee"
                      : "#10b981",
                },
              ]);
            }
          } else {
            setThrottleResult(latest?.throttleResult ?? null);
          }

          // --- Comparison Fetch ---
          const compareResp = await API.get(
            `/benchmarks/compare/?cpu_model=${latest.cpu_model}&gpu_model=${latest.gpu_model}&ram_gb=${latest.ram_gb}`
          );
          setComparison(compareResp.data);
        } else {
          setBottleneckData([
            { name: "CPU", value: 0, color: "#ff0033" },
            { name: "GPU", value: 0, color: "#9333ea" },
            { name: "RAM", value: 0, color: "#22d3ee" },
            { name: "Temp", value: 0, color: "#10b981" },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch benchmarks", err);
        toast.error("Failed to load benchmarks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBenchmarks();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const latest = benchmarks[0] ?? null;

  return {
    benchmarks,
    bottleneckData,
    comparison,
    throttleResult,
    upgradeRecommendations,
    latest,
    loading,
  };
}
