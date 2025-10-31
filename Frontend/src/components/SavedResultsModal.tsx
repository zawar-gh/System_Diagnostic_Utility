// components/SavedResultsModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BenchmarkChart } from './BenchmarkChart';
import { API } from '../api/axiosConfig';
import { toast } from 'sonner';

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

interface SavedResultsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SavedResultsModal({ open, onClose }: SavedResultsModalProps) {
  const [latestResult, setLatestResult] = useState<BenchmarkResult | null>(null);

  const fetchBenchmarks = async () => {
    try {
      const { data } = await API.get<BenchmarkResult[]>('/benchmarks/');
      if (data.length > 0) {
        // Sort by timestamp descending and pick the latest
        const latest = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        setLatestResult(latest);
      } else {
        setLatestResult(null);
      }
    } catch (err) {
      toast.error('Failed to load benchmarks');
      setLatestResult(null);
    }
  };

  useEffect(() => {
    if (open) fetchBenchmarks();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-red-500 text-lg">Saved Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {!latestResult ? (
            <div className="text-gray-400 text-xs">No saved results yet</div>
          ) : (
            <div key={latestResult.id} className="bg-black/50 border border-red-600/30 p-2 rounded">
              <div className="flex justify-between items-center mb-2">
                <div className="text-white text-xs capitalize">{latestResult.type} Benchmark</div>
                <div className="text-red-500 text-xs">{new Date(latestResult.timestamp).toLocaleDateString()}</div>
              </div>
              <div className="h-48">
                <BenchmarkChart data={latestResult.metrics} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
