// ProfileModal.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Upload, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  token: string; // JWT token
}

interface UserData {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

interface BenchmarkResult {
  type: string;
  timestamp: string;
  overallScore: number;
}

export function ProfileModal({ open, onClose, onLogout, token }: ProfileModalProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>({ id: 0, username: '', email: '', avatar: '' });
  const [savedResults, setSavedResults] = useState<BenchmarkResult[]>([]);

  // Fetch profile from backend
  const fetchProfile = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/users/profile/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setUser(data);
      setFormData({ ...data, avatar: data.avatar || '' });
    } catch (err) {
      toast.error('Could not load profile');
      console.error(err);
    }
  };

  // Fetch saved benchmarks (optional, fallback to localStorage)
  const fetchBenchmarks = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/benchmarks/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch benchmarks');
      const data = await res.json();
      setSavedResults(data);
    } catch {
      const local = JSON.parse(localStorage.getItem('sdu_benchmarks') || '[]');
      setSavedResults(local);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProfile();
      fetchBenchmarks();
    }
  }, [open]);

  const handleSave = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/users/profile/update/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: formData.username, email: formData.email }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      setUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData({ ...formData, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/users/profile/delete/', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete account');
      toast.success('Account deleted');
      onLogout();
    } catch (err) {
      toast.error('Failed to delete account');
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white max-w-xl" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.5)' }}>
        <DialogHeader>
          <DialogTitle className="text-red-500 text-lg" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}>
            USER PROFILE
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-red-600" style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), 0 0 60px rgba(255, 0, 0, 0.3)' }}>
                <AvatarImage src={editing ? formData.avatar : user.avatar} />
                <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {editing && (
                <motion.label
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  htmlFor="profile-avatar-upload"
                  className="absolute bottom-0 right-0 bg-red-600 p-1.5 rounded-full cursor-pointer hover:bg-red-700"
                  style={{ boxShadow: '0 0 15px rgba(255, 0, 0, 0.5)' }}
                >
                  <Upload className="w-3 h-3" />
                  <input id="profile-avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </motion.label>
              )}
            </div>

            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="edit-username" className="text-xs">Username</Label>
                    <Input id="edit-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="bg-black border-red-600/50 text-white text-sm h-8" style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }} />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-xs">Email</Label>
                    <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-black border-red-600/50 text-white text-sm h-8" style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div>
                    <div className="text-gray-400 text-xs">Username</div>
                    <div className="text-white text-sm">{user.username}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Email</div>
                    <div className="text-white text-sm">{user.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Joined</div>
                    <div className="text-white text-sm">{new Date(user.joinedDate || Date.now()).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Saved Results */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-white mb-3 text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              SAVED BENCHMARK RESULTS ({savedResults.length})
            </h4>
            {savedResults.length === 0 ? (
              <div className="text-gray-400 text-xs">No saved results yet</div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {savedResults.map((result, index) => (
                  <motion.div key={index} whileHover={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.3)' }} className="bg-black/50 border border-red-600/30 p-2 rounded flex justify-between items-center">
                    <div>
                      <div className="text-white capitalize text-xs">{result.type} Benchmark</div>
                      <div className="text-gray-400 text-xs">{new Date(result.timestamp).toLocaleDateString()}</div>
                    </div>
                    <div className="text-red-500 text-xs">{result.overallScore}</div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-gray-700 pt-4">
            {editing ? (
              <>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleSave} className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300 text-sm h-9" style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.5)' }}>
                    <Save className="mr-2 h-3 w-3" /> Save Changes
                  </Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => { setEditing(false); setFormData({ username: user.username, email: user.email, avatar: user.avatar }); }} variant="outline" className="w-full text-sm h-9">Cancel</Button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => setEditing(true)} className="w-full bg-transparent border-2 border-red-600 text-white hover:bg-red-600/20 transition-all duration-300 text-sm h-9" style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.4)' }}>Edit Profile</Button>
                </motion.div>
                <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={handleDeleteAccount} variant="destructive" className="w-full text-sm h-9" style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.4)' }}>
                    <Trash2 className="mr-2 h-3 w-3" /> Delete Account
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
