// src/components/AnalysisUpgrades/ResultsReviewsTabs.tsx
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { MessageSquare, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface ResultsReviewsTabsProps {
  user: any;
  benchmarks: any[];
  reviews: any[];
  newReview: string;
  editingReview: number | null;
  editText: string;
  setNewReview: (val: string) => void;
  setReviews: (val: any[]) => void;
  setEditingReview: (val: number | null) => void;
  setEditText: (val: string) => void;
  handleAddReview: () => void;
  handleEditReview: (id: number) => void;
  handleDeleteReview: (id: number) => void;
}

export function ResultsReviewsTabs({
  user,
  benchmarks,
  reviews,
  newReview,
  editingReview,
  editText,
  setNewReview,
  setReviews,
  setEditingReview,
  setEditText,
  handleAddReview,
  handleEditReview,
  handleDeleteReview,
}: ResultsReviewsTabsProps) {
  return (
    <Card
      className="bg-[#1a1a1a] border-2 border-red-600 p-4 overflow-visible"
      style={{
        boxShadow: "0 0 30px rgba(255,0,0,0.4), 0 0 60px rgba(255,0,0,0.2)",
      }}
    >
      <Tabs defaultValue="results" className="w-full">
        {/* Header Tabs */}
        <TabsList className="bg-black border border-red-600/30 flex justify-center">
          <TabsTrigger
            value="results"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 font-medium"
          >
            Benchmarks
          </TabsTrigger>
          <TabsTrigger
            value="reviews"
            className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400 font-medium"
          >
            Community Reviews
          </TabsTrigger>
        </TabsList>

        {/* =============== BENCHMARKS TAB =============== */}
        <TabsContent value="results" className="mt-4">
          {benchmarks.length === 0 ? (
            <div className="text-center text-gray-400 py-6 text-sm">
              No benchmark results yet.
            </div>
          ) : (
            <div
              className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#ff0033 #0a0a0a",
              }}
            >
              {benchmarks.map((result, index) => (
                <motion.div
                  key={index}
                  className="bg-black/50 border border-red-600/30 p-3 rounded transition-all duration-300"
                  whileHover={{
                    boxShadow:
                      "0 0 25px rgba(255,0,0,0.4), 0 0 50px rgba(255,0,0,0.2)",
                    scale: 1.01,
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="capitalize text-sm">
                        <span
                          className="text-red-500 font-semibold"
                          style={{ fontFamily: "Orbitron, sans-serif" }}
                        >
                          {result.username || "Anonymous"}
                        </span>
                        <span className="text-gray-400">
                          {" "}
                          — {result.type} Benchmark
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div
                      className="text-red-500 text-sm"
                      style={{ fontFamily: "Orbitron, sans-serif" }}
                    >
                      {result.overall_score ?? "-"}
                    </div>
                  </div>

                  {/* Detailed results */}
                  <div className="mt-2 border-t border-gray-800 pt-3 flex justify-center">
                    <div className="space-y-1 text-sm w-full max-w-xs">
                      {[
                        {
                          label: "CPU",
                          value: result.cpu_model,
                          score: result.cpu_score,
                        },
                        {
                          label: "GPU",
                          value: result.gpu_model,
                          score: result.gpu_score,
                        },
                        {
                          label: "RAM",
                          value: result.ram_type
                            ? `${result.ram_type} (${result.ram_gb ?? "?"}GB)`
                            : "Standard",
                          score: result.ram_score,
                        },
                        {
                          label: "DISK",
                          value: result.storage_type || "Standard",
                          score: result.disk_score,
                        },
                        {
                          label: "TEMP",
                          value: `${result.avg_temp ?? "-"}°C`,
                          score: null,
                        },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-white font-medium flex-shrink-0">
                            {item.label} ={" "}
                            <span className="text-gray-400">{item.value}</span>
                          </span>
                          <span className="text-red-500 font-medium">
                            {item.score !== null ? item.score : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =============== REVIEWS TAB =============== */}
        <TabsContent value="reviews" className="mt-4">
          {/* Review Input */}
          <div className="mb-4">
            <Textarea
              placeholder="Share your upgrade experience or recommendations..."
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              className="bg-black border border-red-600/50 text-white mb-3 text-sm focus:ring-1 focus:ring-red-600"
            />
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleAddReview}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 text-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Post Review
              </Button>
            </motion.div>
          </div>

          {/* Review List */}
          <div
            className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#ff0033 #0a0a0a",
            }}
          >
            {reviews.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">
                No community reviews yet.
              </p>
            ) : (
              reviews.map((review) => (
                <motion.div
                  key={review.id}
                  whileHover={{
                    backgroundColor: "rgba(255,0,0,0.05)",
                    boxShadow:
                      "0 0 25px rgba(255,0,0,0.3), 0 0 50px rgba(255,0,0,0.2)",
                    scale: 1.01,
                  }}
                  className="bg-black/50 border border-gray-800 p-3 rounded transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white text-sm">{review.user}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    {review.user === user.username && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingReview(review.id);
                            setEditText(review.comment);
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteReview(review.id)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {editingReview === review.id ? (
                    <div>
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="bg-black border border-red-600/50 text-white mb-2 text-sm focus:ring-1 focus:ring-red-600"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditReview(review.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingReview(null);
                            setEditText("");
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm">{review.comment}</p>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
