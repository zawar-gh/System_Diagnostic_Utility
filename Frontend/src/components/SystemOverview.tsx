import { useState } from 'react';
import { motion } from 'motion/react';
import { Cpu, HardDrive, MemoryStick, Monitor, Play, RotateCw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { BenchmarkChart } from './BenchmarkChart';

interface SystemOverviewProps {
  user: any;
}

const mockSystemData = {
  os: {
    name: 'Windows 11 Pro',
    version: '23H2',
    build: '22631.2715'
  },
  cpu: {
    model: 'AMD Ryzen 9 5950X',
    cores: 16,
    threads: 32,
    usage: 45
  },
  gpu: {
    model: 'NVIDIA RTX 4080',
    vram: '16GB GDDR6X',
    utilization: 23
  },
  ram: {
    total: '64GB',
    speed: 'DDR4-3600MHz',
    usage: 62
  },
  storage: {
    type: 'NVMe SSD',
    size: '2TB',
    usage: 58
  }
};

export function SystemOverview({ user }: SystemOverviewProps) {
  const [systemData, setSystemData] = useState(mockSystemData);
  const [scanning, setScanning] = useState(false);
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarkResults, setBenchmarkResults] = useState<any>(null);
  const [benchmarkType, setBenchmarkType] = useState<string>('gaming');

  const handleRescan = () => {
    setScanning(true);
    toast.info('Scanning system...');
    setTimeout(() => {
      setScanning(false);
      toast.success('System scan complete');
    }, 2000);
  };

  const handleBenchmark = (type: string) => {
    setBenchmarkType(type);
    setBenchmarking(true);
    setBenchmarkProgress(0);

    const interval = setInterval(() => {
      setBenchmarkProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setBenchmarking(false);
          
          // Generate mock results
          const results = {
            type,
            timestamp: new Date().toISOString(),
            cpuScore: Math.floor(Math.random() * 2000) + 8000,
            gpuScore: Math.floor(Math.random() * 3000) + 12000,
            ramScore: Math.floor(Math.random() * 1000) + 5000,
            overallScore: Math.floor(Math.random() * 5000) + 20000,
            fps: Math.floor(Math.random() * 80) + 120,
            cpuTemp: Math.floor(Math.random() * 20) + 65,
            gpuTemp: Math.floor(Math.random() * 25) + 70,
            chartData: [
              { time: '0s', cpu: 45, gpu: 30, temp: 60 },
              { time: '30s', cpu: 78, gpu: 65, temp: 72 },
              { time: '60s', cpu: 92, gpu: 88, temp: 78 },
              { time: '90s', cpu: 95, gpu: 94, temp: 82 },
              { time: '120s', cpu: 89, gpu: 91, temp: 80 }
            ]
          };
          
          setBenchmarkResults(results);
          
          // Save to localStorage
          const saved = JSON.parse(localStorage.getItem('sdu_benchmarks') || '[]');
          saved.unshift(results);
          localStorage.setItem('sdu_benchmarks', JSON.stringify(saved.slice(0, 10)));
          
          toast.success('Benchmark complete!');
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const SystemCard = ({ icon: Icon, title, data, color, usage }: any) => (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        boxShadow: `0 0 50px ${color}80, 0 0 80px ${color}40`,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className="bg-[#1a1a1a] border-2 p-4 relative overflow-hidden h-full"
        style={{
          borderColor: color,
          boxShadow: `0 0 30px ${color}50, 0 0 60px ${color}20`
        }}
      >
        <motion.div 
          className="absolute top-0 right-0 w-24 h-24 opacity-5"
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Icon className="w-full h-full" style={{ color }} />
        </motion.div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{
                filter: [
                  `drop-shadow(0 0 5px ${color})`,
                  `drop-shadow(0 0 15px ${color})`,
                  `drop-shadow(0 0 5px ${color})`
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </motion.div>
            <h3 className="text-white text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {title}
            </h3>
          </div>
          
          <div className="space-y-1.5">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="text-gray-400 capitalize">{key}:</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
            
            {usage !== undefined && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Usage:</span>
                  <span className="text-white">{usage}%</span>
                </div>
                <Progress value={usage} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-red-500"
          style={{ 
            fontSize: '2rem', 
            fontFamily: 'Orbitron, sans-serif',
            textShadow: '0 0 20px #ff0033, 0 0 40px #ff0033'
          }}
        >
          SYSTEM SPECIFICATIONS
        </motion.h2>
        
        <div className="flex gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleRescan}
              disabled={scanning}
              className="bg-transparent border-2 border-purple-600 text-white hover:bg-purple-600/30 transition-all duration-300"
              style={{ boxShadow: '0 0 25px rgba(147, 51, 234, 0.5), 0 0 50px rgba(147, 51, 234, 0.3)' }}
            >
              <RotateCw className={`mr-2 h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
              Re-Scan Specs
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowBenchmark(true)}
              className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30 transition-all duration-300"
              style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.5), 0 0 50px rgba(255, 0, 0, 0.3)' }}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Benchmark
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SystemCard
          icon={Monitor}
          title="OPERATING SYSTEM"
          data={systemData.os}
          color="#00ffff"
        />
        
        <SystemCard
          icon={Cpu}
          title="PROCESSOR"
          data={{
            model: systemData.cpu.model,
            cores: systemData.cpu.cores,
            threads: systemData.cpu.threads
          }}
          usage={systemData.cpu.usage}
          color="#ff0033"
        />
        
        <SystemCard
          icon={Monitor}
          title="GRAPHICS CARD"
          data={{
            model: systemData.gpu.model,
            vram: systemData.gpu.vram
          }}
          usage={systemData.gpu.utilization}
          color="#9333ea"
        />
        
        <SystemCard
          icon={MemoryStick}
          title="MEMORY (RAM)"
          data={{
            total: systemData.ram.total,
            speed: systemData.ram.speed
          }}
          usage={systemData.ram.usage}
          color="#22d3ee"
        />
        
        <SystemCard
          icon={HardDrive}
          title="STORAGE"
          data={{
            type: systemData.storage.type,
            size: systemData.storage.size
          }}
          usage={systemData.storage.usage}
          color="#10b981"
        />
      </div>

      {/* Benchmark Modal */}
      <Dialog open={showBenchmark} onOpenChange={setShowBenchmark}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white max-w-3xl" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.5)' }}>
          <DialogHeader>
            <DialogTitle className="text-red-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}>
              {benchmarking ? 'RUNNING BENCHMARK' : benchmarkResults ? 'BENCHMARK RESULTS' : 'SELECT BENCHMARK TYPE'}
            </DialogTitle>
          </DialogHeader>
          
          {!benchmarking && !benchmarkResults && (
            <div className="grid grid-cols-2 gap-6 py-6">
              {[
                { name: 'Gaming', icon: '🎮', color: '#ff0033', gradient: 'from-red-900 to-red-950' },
                { name: 'Office', icon: '💼', color: '#22d3ee', gradient: 'from-cyan-900 to-cyan-950' },
                { name: 'Editing', icon: '🎬', color: '#9333ea', gradient: 'from-purple-900 to-purple-950' },
                { name: 'AI-ML', icon: '🤖', color: '#10b981', gradient: 'from-green-900 to-green-950' }
              ].map((type) => (
                <motion.div
                  key={type.name}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: `0 0 40px ${type.color}80, 0 0 80px ${type.color}40`
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => handleBenchmark(type.name.toLowerCase())}
                    className={`bg-gradient-to-br ${type.gradient} border-2 text-white h-32 w-full flex flex-col items-center justify-center gap-3 relative overflow-hidden group transition-all duration-300`}
                    style={{ 
                      borderColor: type.color,
                      boxShadow: `0 0 25px ${type.color}60, 0 0 50px ${type.color}30`
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                      animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                    />
                    <span className="text-4xl relative z-10">{type.icon}</span>
                    <span className="relative z-10" style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '1.1rem' }}>
                      {type.name}
                    </span>
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 opacity-50"
                      style={{ backgroundColor: type.color }}
                      animate={{
                        scaleX: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
          
          {benchmarking && (
            <div className="py-8">
              <div className="mb-4 text-center text-gray-400">
                Testing system performance...
              </div>
              <Progress value={benchmarkProgress} className="h-4 mb-2" />
              <div className="text-center text-white">{benchmarkProgress}%</div>
            </div>
          )}
          
          {benchmarkResults && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/50 p-3 rounded border border-red-600/30">
                  <div className="text-gray-400 text-xs">CPU Score</div>
                  <div className="text-white text-sm">{benchmarkResults.cpuScore}</div>
                </div>
                <div className="bg-black/50 p-3 rounded border border-purple-600/30">
                  <div className="text-gray-400 text-xs">GPU Score</div>
                  <div className="text-white text-sm">{benchmarkResults.gpuScore}</div>
                </div>
                <div className="bg-black/50 p-3 rounded border border-cyan-600/30">
                  <div className="text-gray-400 text-xs">RAM Score</div>
                  <div className="text-white text-sm">{benchmarkResults.ramScore}</div>
                </div>
                <div className="bg-black/50 p-3 rounded border border-green-600/30">
                  <div className="text-gray-400 text-xs">Overall Score</div>
                  <div className="text-white text-sm">{benchmarkResults.overallScore}</div>
                </div>
              </div>
              
              <div className="h-56">
                <BenchmarkChart data={benchmarkResults.chartData} />
              </div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => {
                    setBenchmarkResults(null);
                    setShowBenchmark(false);
                  }}
                  className="w-full bg-red-600 hover:bg-red-700 transition-all duration-300"
                  style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.5)' }}
                >
                  Close
                </Button>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}