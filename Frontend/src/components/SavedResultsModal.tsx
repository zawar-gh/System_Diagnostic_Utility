// components/SavedResultsModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BenchmarkChart } from './BenchmarkChart';
import { API } from '../api/axiosConfig';
import { toast } from 'sonner@2.0.3';

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
  const [savedResults, setSavedResults] = useState<BenchmarkResult[]>([]);

  const fetchBenchmarks = async () => {
    try {
      const { data } = await API.get('/benchmarks/');
      setSavedResults(data);
    } catch (err) {
      toast.error('Failed to load benchmarks');
      setSavedResults([]);
    }
  };

  useEffect(() => {
    if (open) fetchBenchmarks();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-red-500 text-lg">Saved Benchmark Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {savedResults.length === 0 ? (
            <div className="text-gray-400 text-xs">No saved results yet</div>
          ) : (
            savedResults.map((result) => (
              <div key={result.id} className="bg-black/50 border border-red-600/30 p-2 rounded">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-white text-xs capitalize">{result.type} Benchmark</div>
                  <div className="text-red-500 text-xs">{new Date(result.timestamp).toLocaleDateString()}</div>
                </div>
                <div className="h-48">
                  <BenchmarkChart data={result.metrics} />
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
