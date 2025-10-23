import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, DollarSign, Bookmark, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { RadialBarChart, RadialBar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalysisUpgradesProps {
  user: any;
}

const bottleneckData = [
  { name: 'CPU', value: 98, color: '#ff0033' },
  { name: 'GPU', value: 75, color: '#9333ea' },
  { name: 'RAM', value: 88, color: '#22d3ee' },
  { name: 'Storage', value: 45, color: '#10b981' }
];

const upgradeRecommendations = [
  {
    id: 1,
    component: 'CPU',
    current: 'AMD Ryzen 9 5950X',
    recommended: 'AMD Ryzen 9 7950X3D',
    boost: 35,
    price: '$699',
    color: '#ff0033'
  },
  {
    id: 2,
    component: 'GPU',
    current: 'NVIDIA RTX 4080',
    recommended: 'NVIDIA RTX 4090',
    boost: 25,
    price: '$1,599',
    color: '#9333ea'
  },
  {
    id: 3,
    component: 'RAM',
    current: '64GB DDR4-3600',
    recommended: '64GB DDR5-6000',
    boost: 15,
    price: '$299',
    color: '#22d3ee'
  },
  {
    id: 4,
    component: 'Storage',
    current: '2TB NVMe SSD',
    recommended: '4TB Gen5 NVMe SSD',
    boost: 40,
    price: '$599',
    color: '#10b981'
  }
];

export function AnalysisUpgrades({ user }: AnalysisUpgradesProps) {
  const [savedResults] = useState(() => {
    return JSON.parse(localStorage.getItem('sdu_benchmarks') || '[]');
  });
  
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem('sdu_reviews');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        user: 'TechEnthusiast',
        comment: 'Upgraded to Ryzen 9 7950X3D and the performance boost is incredible! Gaming FPS increased by 40%.',
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 2,
        user: 'GamerPro',
        comment: 'DDR5 RAM made a huge difference in productivity tasks. Highly recommend the upgrade.',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  });
  
  const [newReview, setNewReview] = useState('');
  const [editingReview, setEditingReview] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const handleAddReview = () => {
    if (!newReview.trim()) return;
    
    const review = {
      id: Date.now(),
      user: user.username,
      comment: newReview,
      timestamp: new Date().toISOString()
    };
    
    const updated = [review, ...reviews];
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    setNewReview('');
    toast.success('Review added');
  };

  const handleEditReview = (id: number) => {
    if (!editText.trim()) return;
    
    const updated = reviews.map((r: any) =>
      r.id === id ? { ...r, comment: editText } : r
    );
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    setEditingReview(null);
    setEditText('');
    toast.success('Review updated');
  };

  const handleDeleteReview = (id: number) => {
    const updated = reviews.filter((r: any) => r.id !== id);
    setReviews(updated);
    localStorage.setItem('sdu_reviews', JSON.stringify(updated));
    toast.success('Review deleted');
  };

  const handleSaveWishlist = (item: any) => {
    toast.success(`${item.recommended} added to wishlist`);
  };

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-red-500"
        style={{ fontSize: '1.75rem', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033, 0 0 40px #ff0033' }}
      >
        SYSTEM ANALYSIS
      </motion.h2>

     {/* Bottleneck Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          className="bg-[#1a1a1a] border-2 border-red-600 p-6"
          style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.4), 0 0 60px rgba(255, 0, 0, 0.2)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 5px #ff0033)',
                  'drop-shadow(0 0 15px #ff0033)',
                  'drop-shadow(0 0 5px #ff0033)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </motion.div>
            <h3 className="text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              BOTTLENECK DETECTION
            </h3>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={bottleneckData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {bottleneckData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-6 space-y-3">
            <motion.div 
              className="bg-red-600/10 border border-red-600/30 p-3 rounded"
              whileHover={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
                <div>
                  <div className="text-white">CPU at 98% usage</div>
                  <div className="text-gray-400 text-sm">Primary bottleneck detected</div>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-cyan-600/10 border border-cyan-600/30 p-3 rounded"
              whileHover={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' }}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-500 mt-1" />
                <div>
                  <div className="text-white">RAM near capacity (88%)</div>
                  <div className="text-gray-400 text-sm">Upgrade recommended</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Card>

        <Card
          className="bg-[#1a1a1a] border-2 border-purple-600 p-6"
          style={{ boxShadow: '0 0 30px rgba(147, 51, 234, 0.4), 0 0 60px rgba(147, 51, 234, 0.2)' }}
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 5px #9333ea)',
                  'drop-shadow(0 0 15px #9333ea)',
                  'drop-shadow(0 0 5px #9333ea)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </motion.div>
            <h3 className="text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              PERFORMANCE SCORES
            </h3>
          </div>
          
          <div className="space-y-4">
            {bottleneckData.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">{item.name}</span>
                  <span className="text-white">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-3" />
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Overall System Score</span>
              <span
                className="text-purple-500"
                style={{ fontSize: '1.5rem', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 15px #9333ea' }}
              >
                23,450
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Upgrade Recommendations */}
      <div>
        <h3
          className="text-red-500 mb-4"
          style={{ fontSize: '1.25rem', fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}
        >
          UPGRADE RECOMMENDATIONS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upgradeRecommendations.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02, boxShadow: `0 0 40px ${item.color}60, 0 0 80px ${item.color}30` }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="bg-[#1a1a1a] border-2 p-4"
                style={{
                  borderColor: item.color,
                  boxShadow: `0 0 25px ${item.color}40, 0 0 50px ${item.color}20`
                }}
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400 text-xs">Component</div>
                    <div className="text-white text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                      {item.component}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs">Current</div>
                    <div className="text-white text-sm">{item.current}</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 text-xs">Recommended</div>
                    <div className="text-white text-sm">{item.recommended}</div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-700">
                    <div>
                      <div className="text-gray-400 text-xs">Performance Boost</div>
                      <div className="text-green-500 text-sm">+{item.boost}%</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Price Range</div>
                      <div className="text-white text-sm">{item.price}</div>
                    </div>
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => handleSaveWishlist(item)}
                      className="w-full bg-transparent border-2 hover:bg-opacity-20 transition-all duration-300 text-sm py-2"
                      style={{
                        borderColor: item.color,
                        color: item.color,
                        backgroundColor: `${item.color}10`,
                        boxShadow: `0 0 15px ${item.color}40`
                      }}
                    >
                      <Bookmark className="mr-2 h-3 w-3" />
                      Save to Wishlist
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Results & Reviews */}
      <Card
        className="bg-[#1a1a1a] border-2 border-red-600 p-4"
        style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.4), 0 0 60px rgba(255, 0, 0, 0.2)' }}
      >
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList className="bg-black border border-red-600/30">
            <TabsTrigger 
              value="results" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400"
            >
              My Saved Results
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-400"
            >
              Community Reviews
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="mt-4">
            {savedResults.length === 0 ? (
              <div className="text-center text-gray-400 py-6 text-sm">
                No saved benchmark results yet. Run a benchmark to see results here.
              </div>
            ) : (
              <div className="space-y-3">
                {savedResults.map((result: any, index: number) => (
                  <motion.div
                    key={index}
                    className="bg-black/50 border border-red-600/30 p-3 rounded"
                    whileHover={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white capitalize text-sm">{result.type} Benchmark</div>
                        <div className="text-gray-400 text-xs">
                          {new Date(result.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-red-500 text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        {result.overallScore}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400">CPU Score</div>
                        <div className="text-white">{result.cpuScore}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">GPU Score</div>
                        <div className="text-white">{result.gpuScore}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">RAM Score</div>
                        <div className="text-white">{result.ramScore}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-4">
            <div className="mb-4">
              <Textarea
                placeholder="Share your upgrade experience or recommendations..."
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                className="bg-black border-red-600/50 text-white mb-3 text-sm"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleAddReview}
                  className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300 text-sm"
                  style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.4)' }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Review
                </Button>
              </motion.div>
            </div>
            
            <div className="space-y-3">
              {reviews.map((review: any) => (
                <motion.div
                  key={review.id}
                  whileHover={{ 
                    backgroundColor: 'rgba(255, 0, 0, 0.05)',
                    boxShadow: '0 0 20px rgba(255, 0, 0, 0.2)'
                  }}
                  className="bg-black/50 border border-gray-700 p-3 rounded transition-all duration-300"
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
                          className="text-cyan-500 hover:text-cyan-400"
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
                        className="bg-black border-red-600/50 text-white mb-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={() => handleEditReview(review.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            Save
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={() => {
                              setEditingReview(null);
                              setEditText('');
                            }}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm">{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}