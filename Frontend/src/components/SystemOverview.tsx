import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, HardDrive, MemoryStick, Monitor, Play, RotateCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { BenchmarkChart } from './BenchmarkChart';
import { API } from '../api/axiosConfig'; // your axios instance

interface BenchmarkMetric {
  time: number;
  cpu: number;
  gpu: number;
  temp: number;
}

interface BenchmarkResult {
  id: number;
  type: string;
  timestamp: string;
  metrics: BenchmarkMetric[];
}

export function SystemOverview() {
  const [systemData, setSystemData] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult | null>(null);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>([]);
  const [benchmarkType, setBenchmarkType] = useState<string>('gaming');

  // Fetch system info from backend
  const fetchSystemData = async (cache: boolean = true) => {
    setScanning(true);
    try {
      const { data } = await API.get('/diagnostics/collect/');
      setSystemData(data);
      toast.success('System info loaded');

      if (cache) localStorage.setItem('systemData', JSON.stringify(data));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load system info');
    } finally {
      setScanning(false);
    }
  };

  // Fetch saved benchmarks from backend
  const fetchBenchmarks = async () => {
    try {
      const { data } = await API.get('/benchmarks/');
      setBenchmarks(data);
    } catch (err) {
      console.error(err);
      setBenchmarks([]);
      toast.error('Failed to load benchmarks');
    }
  };

  useEffect(() => {
    const cachedData = localStorage.getItem('systemData');
    if (cachedData) {
      setSystemData(JSON.parse(cachedData));
    } else {
      fetchSystemData();
    }
    fetchBenchmarks();
  }, []);

  const handleRescan = () => fetchSystemData();

  const handleBenchmark = async (type: string) => {
    setBenchmarkType(type);
    setBenchmarking(true);
    setBenchmarkProgress(0);

    const interval = setInterval(() => {
      setBenchmarkProgress(prev => Math.min(prev + 2, 100));
    }, 100);

    try {
      const metrics: BenchmarkMetric[] = [
        { time: 0, cpu: 20, gpu: 15, temp: 35 },
        { time: 30, cpu: 50, gpu: 45, temp: 50 },
        { time: 60, cpu: 70, gpu: 60, temp: 60 },
      ];

      const { data: result } = await API.post('/benchmarks/', { type, metrics });

      setBenchmarkResults({
        ...result,
        cpuScore: metrics.reduce((sum, m) => sum + m.cpu, 0),
        gpuScore: metrics.reduce((sum, m) => sum + m.gpu, 0),
        overallScore: metrics.reduce((sum, m) => sum + m.cpu + m.gpu, 0),
        chartData: metrics.map(m => ({ time: `${m.time}s`, cpu: m.cpu, gpu: m.gpu, temp: m.temp })),
      });

      fetchBenchmarks();
      toast.success('Benchmark complete!');
    } catch (err) {
      console.error(err);
      toast.error('Benchmark failed');
    } finally {
      clearInterval(interval);
      setBenchmarking(false);
      setBenchmarkProgress(100);
    }
  };

  if (!systemData) return <div className="text-green-400 font-mono">Loading system info...</div>;

const SystemCard = ({ icon: Icon, title, data, color, usage }: any) => {
  const fields: { key: string; label: string }[] = [
    { key: 'name', label: 'NAME' },
    { key: 'version', label: 'VERSION' },
    { key: 'build', label: 'BUILD' },
    { key: 'model', label: 'MODEL' },
    { key: 'cores', label: 'CORES' },
    { key: 'threads', label: 'THREADS' },
    { key: 'usage', label: 'USAGE' },
    { key: 'total', label: 'TOTAL' },
    { key: 'speed', label: 'SPEED' },
    { key: 'type', label: 'TYPE' },
    { key: 'size', label: 'SIZE' },
    { key: 'error', label: 'ERROR' },
  ];

  return (
    <motion.div
      whileHover={{ scale: 1.05, boxShadow: `0 0 50px ${color}80,0 0 80px ${color}40` }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className="bg-[#0a0a0a] border-2 p-4 relative overflow-hidden h-full"
        style={{ borderColor: color, boxShadow: `0 0 30px ${color}50,0 0 60px ${color}20` }}
      >
        <div className="relative z-10">
          {/* Card title in bright, colorful neon */}
          <h3
            className="font-mono font-extrabold text-lg mb-2"
            style={{ color: color, textShadow: `0 0 10px ${color}, 0 0 20px ${color}` }}
          >
            {title}
          </h3>

          {/* Field labels and values in white/light grey */}
          {fields.map(({ key, label }) =>
            data[key] !== undefined ? (
              <div key={key} className="flex justify-between text-xs font-mono mb-1">
                <span className="font-bold text-gray-300">{label}:</span>
                <span className="text-white">{data[key]}</span>
              </div>
            ) : null
          )}

          {usage !== undefined && <Progress value={usage} className="h-2 mt-1" />}
        </div>
      </Card>
    </motion.div>
  );
};


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-green-400 text-3xl font-mono font-extrabold" style={{ textShadow: '0 0 20px #00ff00, 0 0 40px #00ff00' }}>
          SYSTEM SPECIFICATIONS
        </h2>
        <div className="flex gap-4">
          <Button onClick={handleRescan} disabled={scanning} className="bg-transparent border-2 border-green-600 text-white hover:bg-green-600/30">
            <RotateCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} /> Re-Scan Specs
          </Button>
          <Button onClick={() => setShowBenchmark(true)} className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30">
            <Play className="mr-2 h-4 w-4" /> Run Benchmark
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SystemCard icon={Monitor} title="OS" data={systemData.os} color="#00ffff" />
        <SystemCard icon={Cpu} title="CPU" data={systemData.cpu} usage={systemData.cpu.usage} color="#ff0033" />
        <SystemCard icon={Monitor} title="GPU" data={systemData.gpu} usage={systemData.gpu.utilization} color="#9333ea" />
        <SystemCard icon={MemoryStick} title="RAM" data={systemData.ram} usage={systemData.ram.usage} color="#22d3ee" />
        <SystemCard icon={HardDrive} title="Storage" data={systemData.storage} usage={systemData.storage.usage} color="#10b981" />
      </div>

      {/* Benchmark Modal */}
      <Dialog open={showBenchmark} onOpenChange={setShowBenchmark}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-500">{benchmarking ? 'RUNNING BENCHMARK' : benchmarkResults ? 'BENCHMARK RESULTS' : 'SELECT BENCHMARK TYPE'}</DialogTitle>
          </DialogHeader>

          {!benchmarking && !benchmarkResults && (
            <div className="grid grid-cols-2 gap-6 py-6">
              {['Gaming', 'Office', 'Editing', 'AI-ML'].map(type => (
                <Button key={type} onClick={() => handleBenchmark(type.toLowerCase())} className="h-32 flex flex-col justify-center items-center border-2 text-white">
                  {type}
                </Button>
              ))}
            </div>
          )}

          {benchmarking && (
            <div className="py-8">
              <Progress value={benchmarkProgress} className="h-4 mb-2" />
              <div className="text-white text-center">{benchmarkProgress}%</div>
            </div>
          )}

          {benchmarkResults && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>CPU Score: {benchmarkResults.cpuScore}</div>
                <div>GPU Score: {benchmarkResults.gpuScore}</div>
                <div>Overall: {benchmarkResults.overallScore}</div>
              </div>
              <BenchmarkChart data={benchmarkResults.chartData} />
              <Button onClick={() => { setBenchmarkResults(null); setShowBenchmark(false); }}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
