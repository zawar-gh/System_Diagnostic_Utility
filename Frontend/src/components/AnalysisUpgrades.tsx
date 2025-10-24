// components/AnalysisUpgrades.tsx
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, Bookmark, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { API } from '../api/axiosConfig';

interface AnalysisUpgradesProps {
  user: any;
}

export function AnalysisUpgrades({ user }: AnalysisUpgradesProps) {
  if (!user) return <p className="text-white text-center mt-20">Loading user...</p>;

  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [bottleneckData, setBottleneckData] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('sdu_reviews');
    return saved ? JSON.parse(saved) : [];
  });
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  // --- Fetch latest benchmarks ---
  useEffect(() => {
    let cancelled = false;

    const fetchBenchmarks = async () => {
      setLoading(true);
      try {
        const resp = await API.get('/benchmarks/');
        if (cancelled) return;
        const data = Array.isArray(resp.data) ? resp.data : [];
        setBenchmarks(data);

        if (data.length > 0) {
          const latest = data[0];

          // --- Bottleneck fetch ---
          const bottleneckResp = await API.get(`/benchmarks/bottleneck/?benchmark_id=${latest.id}`);
          const bottleneck = bottleneckResp.data;

          setBottleneckData([
            { name: 'CPU', value: bottleneck.cpu_score ? Math.min(Math.round(bottleneck.cpu_score), 100) : 0, color: '#ff0033' },
            { name: 'GPU', value: bottleneck.gpu_score ? Math.min(Math.round(bottleneck.gpu_score), 100) : 0, color: '#9333ea' },
            { name: 'RAM', value: latest.ram_gb ? Math.min(Math.round((latest.ram_gb / 32) * 100), 100) : 0, color: '#22d3ee' },
            { name: 'Temp', value: latest.avg_temp ? Math.min(Math.round(latest.avg_temp), 100) : 0, color: '#10b981' },
          ]);

          // --- Comparison fetch ---
          const compareResp = await API.get(`/benchmarks/compare/?cpu_model=${latest.cpu_model}&gpu_model=${latest.gpu_model}&ram_gb=${latest.ram_gb}`);
          setComparison(compareResp.data);
        } else {
          setBottleneckData([
            { name: 'CPU', value: 0, color: '#ff0033' },
            { name: 'GPU', value: 0, color: '#9333ea' },
            { name: 'RAM', value: 0, color: '#22d3ee' },
            { name: 'Temp', value: 0, color: '#10b981' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch benchmarks', err);
        toast.error('Failed to load benchmarks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBenchmarks();
    return () => { cancelled = true; };
  }, [user]);

  // --- Reviews handlers ---
  const handleAddReview = () => {
    if (!newReview.trim()) return;
    const review = { id: Date.now(), user: user.username || 'Anonymous', comment: newReview, timestamp: new Date().toISOString() };
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    setNewReview('');
    toast.success('Review added');
  };

  const handleEditReview = (id: number) => {
    if (!editText.trim()) return;
    const updated = reviews.map(r => r.id === id ? { ...r, comment: editText } : r);
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    setEditingReview(null);
    setEditText('');
    toast.success('Review updated');
  };

  const handleDeleteReview = (id: number) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    toast.success('Review deleted');
  };

  const handleSaveWishlist = (item: any) => toast.success(`${item.recommended ?? item.component} added to wishlist`);

  const latest = benchmarks[0] ?? null;

  const upgradeRecommendations = latest ? [
    {
      id: 1, component: 'CPU',
      current: latest.cpu_model || 'Unknown CPU',
      recommended: 'Consider higher single-thread clocks or more cores depending on workload',
      boost: latest.cpu_score && latest.cpu_score < 200 ? 35 : 12, price: '$—', color: '#ff0033'
    },
    {
      id: 2, component: 'GPU',
      current: latest.gpu_model || 'Unknown GPU',
      recommended: 'Consider next-tier GPU for rendering / gaming workloads',
      boost: latest.gpu_score && latest.gpu_score < 100 ? 30 : 10, price: '$—', color: '#9333ea'
    },
    {
      id: 3, component: 'RAM',
      current: `${latest.ram_gb ?? 'Unknown'} GB`,
      recommended: 'Upgrade RAM if usage is high while CPU idle',
      boost: 10, price: '$—', color: '#22d3ee'
    }
  ] : [];

  return (
    <div className="space-y-6">
      <motion.h2 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-red-500" style={{ fontSize: '1.75rem', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033, 0 0 40px #ff0033' }}>SYSTEM ANALYSIS</motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bottleneck Card */}
        <Card className="bg-[#1a1a1a] border-2 border-red-600 p-6" style={{ boxShadow: '0 0 30px rgba(255,0,0,0.4), 0 0 60px rgba(255,0,0,0.2)' }}>
          <div className="flex items-center gap-3 mb-6">
            <motion.div animate={{ filter: ['drop-shadow(0 0 5px #ff0033)', 'drop-shadow(0 0 15px #ff0033)', 'drop-shadow(0 0 5px #ff0033)'] }} transition={{ duration: 2, repeat: Infinity }}>
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </motion.div>
            <h3 className="text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>BOTTLENECK DETECTION</h3>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={bottleneckData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${Math.round(value)}%`}>
                {bottleneckData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Performance Scores Card */}
        <Card className="bg-[#1a1a1a] border-2 border-purple-600 p-6" style={{ boxShadow: '0 0 30px rgba(147,51,234,0.4),0 0 60px rgba(147,51,234,0.2)' }}>
          <div className="flex items-center gap-3 mb-6">
            <motion.div animate={{ filter: ['drop-shadow(0 0 5px #9333ea)', 'drop-shadow(0 0 15px #9333ea)', 'drop-shadow(0 0 5px #9333ea)'] }} transition={{ duration: 2, repeat: Infinity }}>
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </motion.div>
            <h3 className="text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>PERFORMANCE SCORES</h3>
          </div>

          <div className="space-y-4">
            {latest ? (
              <div>
                <div className="flex justify-between mb-2"><span className="text-gray-400">CPU Score</span><span className="text-white">{latest.cpu_score}</span></div>
                <Progress value={Math.min((latest.cpu_score ?? 0), 100)} className="h-3" />
                <div className="flex justify-between mb-2"><span className="text-gray-400">GPU Score</span><span className="text-white">{latest.gpu_score}</span></div>
                <Progress value={Math.min((latest.gpu_score ?? 0), 100)} className="h-3" />
                <div className="flex justify-between mb-2"><span className="text-gray-400">Average Temp</span><span className="text-white">{latest.avg_temp}°C</span></div>
                <Progress value={Math.min(latest.avg_temp ?? 0, 100)} className="h-3" />
              </div>
            ) : <p className="text-gray-400 text-sm">No benchmark data available.</p>}
          </div>
        </Card>
      </div>

      {/* Upgrade Recommendations */}
      <div>
        <h3 className="text-red-500 mb-4" style={{ fontSize: '1.25rem', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}>UPGRADE RECOMMENDATIONS</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgradeRecommendations.length === 0 ? <div className="text-gray-400 p-3">Run a benchmark to get personalized upgrade suggestions.</div> :
            upgradeRecommendations.map(item => (
              <motion.div key={item.id} whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${item.color}60,0 0 80px ${item.color}30` }} whileTap={{ scale: 0.98 }}>
                <Card className="bg-[#1a1a1a] border-2 p-4" style={{ borderColor: item.color, boxShadow: `0 0 25px ${item.color}40,0 0 50px ${item.color}20` }}>
                  <div className="space-y-3">
                    <div className="text-gray-400 text-xs">Component</div><div className="text-white text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{item.component}</div>
                    <div className="text-gray-400 text-xs">Current</div><div className="text-white text-sm">{item.current}</div>
                    <div className="text-gray-400 text-xs">Recommended</div><div className="text-white text-sm">{item.recommended}</div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                      <div className="text-gray-400 text-xs">Performance Boost</div><div className="text-green-500 text-sm">+{item.boost}%</div>
                      <div className="text-gray-400 text-xs">Price Range</div><div className="text-white text-sm">{item.price}</div>
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button onClick={() => handleSaveWishlist(item)} className="w-full bg-transparent border-2 hover:bg-opacity-20 transition-all duration-300 text-sm py-2" style={{ borderColor: item.color, color: item.color, backgroundColor: `${item.color}10`, boxShadow: `0 0 15px ${item.color}40` }}>
                        <Bookmark className="mr-2 h-3 w-3" /> Save to Wishlist
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Results & Reviews */}
      <Card className="bg-[#1a1a1a] border-2 border-red-600 p-4" style={{ boxShadow: '0 0 30px rgba(255,0,0,0.4),0 0 60px rgba(255,0,0,0.2)' }}>
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="bg-black border border-red-600/30">
            <TabsTrigger value="results" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">My Benchmarks</TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400">Community Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="mt-4">
            {benchmarks.length === 0 ? <div className="text-center text-gray-400 py-6 text-sm">No benchmark results yet.</div> :
              <div className="space-y-3">
                {benchmarks.map((result, index) => (
                  <motion.div key={index} className="bg-black/50 border border-red-600/30 p-3 rounded" whileHover={{ boxShadow: '0 0 20px rgba(255,0,0,0.3)' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white capitalize text-sm">{result.type} Benchmark</div>
                        <div className="text-gray-400 text-xs">{new Date(result.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="text-red-500 text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{result.overall_score ?? '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><div className="text-gray-400">CPU Score</div><div className="text-white">{result.cpu_score ?? '-'}</div></div>
                      <div><div className="text-gray-400">GPU Score</div><div className="text-white">{result.gpu_score ?? '-'}</div></div>
                      <div><div className="text-gray-400">Avg Temp</div><div className="text-white">{result.avg_temp ?? '-'}°C</div></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            }
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="mb-4">
              <Textarea placeholder="Share your upgrade experience or recommendations..." value={newReview} onChange={(e) => setNewReview(e.target.value)} className="bg-black border-red-600/50 text-white mb-3 text-sm" />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button onClick={handleAddReview} className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 text-sm">
                  <MessageSquare className="mr-2 h-4 w-4" /> Post Review
                </Button>
              </motion.div>
            </div>

            <div className="space-y-3">
              {reviews.map((review) => (
                <motion.div key={review.id} whileHover={{ backgroundColor: 'rgba(255,0,0,0.05)', boxShadow: '0 0 20px rgba(255,0,0,0.2)' }} className="bg-black/50 border border-gray-700 p-3 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div><div className="text-white text-sm">{review.user}</div><div className="text-gray-400 text-xs">{new Date(review.timestamp).toLocaleDateString()}</div></div>
                    {review.user === user.username && (
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setEditingReview(review.id); setEditText(review.comment); }} className="text-cyan-500 hover:text-cyan-400">
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleDeleteReview(review.id)} className="text-red-500 hover:text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {editingReview === review.id ? (
                    <div>
                      <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="bg-black border-red-600/50 text-white mb-2 text-sm" />
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => handleEditReview(review.id)} className="bg-red-600 hover:bg-red-700 text-white" size="sm">Save</Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button onClick={() => { setEditingReview(null); setEditText(''); }} variant="outline" size="sm">Cancel</Button>
                        </motion.div>
                      </div>
                    </div>
                  ) : <p className="text-gray-300 text-sm">{review.comment}</p>}
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
