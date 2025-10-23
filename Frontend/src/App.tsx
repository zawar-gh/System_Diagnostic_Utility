import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('sdu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('sdu_user', JSON.stringify(userData));
    toast.success('Login successful');
  };

  const handleSignup = (userData: any) => {
    setUser(userData);
    localStorage.setItem('sdu_user', JSON.stringify(userData));
    toast.success('Account created successfully');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sdu_user');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" theme="dark" />
      <AnimatePresence mode="wait">
        {!user ? (
          <AuthScreen key="auth" onLogin={handleLogin} onSignup={handleSignup} />
        ) : (
          <Dashboard key="dashboard" user={user} onLogout={handleLogout} />
        )}
      </AnimatePresence>
    </>
  );
}
