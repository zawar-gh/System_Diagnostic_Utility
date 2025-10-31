// src/components/AnalysisUpgrades.tsx
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { API } from "../api/axiosConfig";
import "../index.css";

// 🧩 Modular Cards (same folder: src/components/)
import { BottleneckCard } from "./BottleneckCard";
import { SystemScoresCard } from "./SystemScoresCard";
import { PerformanceComparisonCard } from "./PerformanceComparisonCard";
import { UpgradeRecommendationsCard } from "./UpgradeRecommendationsCard";
import { ResultsReviewsTabs } from "./ResultsReviewsTabs";

interface AnalysisUpgradesProps {
  user: any;
}

export function AnalysisUpgrades({ user }: AnalysisUpgradesProps) {
  if (!user)
    return <p className="text-white text-center mt-20">Loading user...</p>;

  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bottleneckData, setBottleneckData] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [throttleResult, setThrottleResult] = useState<any | null>(null);
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem("sdu_reviews");
    return saved ? JSON.parse(saved) : [];
  });
  const [newReview, setNewReview] = useState("");
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [upgradeRecommendations, setUpgradeRecommendations] = useState<any[]>(
    []
  );

  // --- Fetch latest benchmarks ---
  useEffect(() => {
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

          // --- Bottleneck fetch ---
          const bottleneckResp = await API.get(
            `/benchmarks/bottleneck/?benchmark_id=${latest.id}`
          );
          const bottleneck = bottleneckResp.data;

          // Prepare bottleneck data
          setBottleneckData([
            {
              name: "CPU",
              value: Math.min(
                Math.round(bottleneck.component_scores?.CPU || latest.cpu_score || 0),
                100
              ),
              color: "#ff0033",
            },
            {
              name: "GPU",
              value: Math.min(
                Math.round(bottleneck.component_scores?.GPU || latest.gpu_score || 0),
                100
              ),
              color: "#9333ea",
            },
            {
              name: "RAM",
              value: Math.min(
                Math.round(
                  (bottleneck.component_scores?.RAM || latest.ram_gb * 3) || 0
                ),
                100
              ),
              color: "#22d3ee",
            },
            {
              name: "Storage",
              value: Math.min(
                Math.round(bottleneck.component_scores?.Storage || 0),
                100
              ),
              color: "#10b981",
            },
            {
              name: "Temp",
              value: Math.min(Math.round(latest.avg_temp || 0), 100),
              color: "#f59e0b",
            },
          ]);

          // --- Throttle results & upgrade logic ---
          if (bottleneck?.throttleResult) {
            setThrottleResult(bottleneck.throttleResult);

            if (bottleneck.topThrottle) {
              const top = bottleneck.topThrottle;
              const isGpuIGPU =
                top.component === "GPU" &&
                latest.gpu_model?.toLowerCase().includes("intel");

              setUpgradeRecommendations([
                {
                  id: 1,
                  component: isGpuIGPU ? "CPU" : top.component,
                  current: isGpuIGPU
                    ? latest.cpu_model
                    : latest?.[`${top.component.toLowerCase()}_model`] || "Unknown",
                  recommended: isGpuIGPU
                    ? `Your CPU is the limiting factor for your Intel iGPU. Upgrade CPU instead.`
                    : `Your ${top.component} is the Main Bottleneck in your System, Upgrade recommended.`,
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

          // --- Comparison fetch ---
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

  // --- Review Handlers ---
  const handleAddReview = () => {
    if (!newReview.trim()) return;
    const review = {
      id: Date.now(),
      user: user.username || "Anonymous",
      comment: newReview,
      timestamp: new Date().toISOString(),
    };
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    setNewReview("");
    toast.success("Review added");
  };

  const handleEditReview = (id: number) => {
    if (!editText.trim()) return;
    const updated = reviews.map((r) =>
      r.id === id ? { ...r, comment: editText } : r
    );
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    setEditingReview(null);
    setEditText("");
    toast.success("Review updated");
  };

  const handleDeleteReview = (id: number) => {
    const updated = reviews.filter((r) => r.id !== id);
    setReviews(updated);
    localStorage.setItem("sdu_reviews", JSON.stringify(updated));
    toast.success("Review deleted");
  };

  const latest = benchmarks[0] ?? null;

  // --- JSX Render ---
  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-red-500"
        style={{
          fontSize: "1.75rem",
          fontFamily: "Orbitron, sans-serif",
          textShadow: "0 0 20px #ff0033, 0 0 40px #ff0033",
        }}
      >
        SYSTEM ANALYSIS
      </motion.h2>

      {/* 🔴 Bottleneck + 🟣 System Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BottleneckCard bottleneckData={bottleneckData} latest={latest} />
        <SystemScoresCard latest={latest} />
      </div>

      {/* 🩵 Performance Comparison + 🔺 Upgrade Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceComparisonCard
          throttleResult={throttleResult}
          latest={latest}
        />
        <UpgradeRecommendationsCard
          upgradeRecommendations={upgradeRecommendations}
        />
      </div>

      {/* 🧾 Results & Reviews */}
      <ResultsReviewsTabs
        user={user}
        benchmarks={benchmarks}
        reviews={reviews}
        newReview={newReview}
        editingReview={editingReview}
        editText={editText}
        setNewReview={setNewReview}
        setReviews={setReviews}
        setEditingReview={setEditingReview}
        setEditText={setEditText}
        handleAddReview={handleAddReview}
        handleEditReview={handleEditReview}
        handleDeleteReview={handleDeleteReview}
      />
    </div>
  );
}
