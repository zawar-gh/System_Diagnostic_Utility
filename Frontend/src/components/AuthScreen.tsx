import { useState } from 'react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload } from 'lucide-react';
import { MatrixBackground } from './MatrixBackground';

interface AuthScreenProps {
  onLogin: (user: any) => void;
  onSignup: (user: any) => void;
}

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = {
        id: Date.now(),
        username: loginData.username,
        email: `${loginData.username}@example.com`,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        joinedDate: new Date().toISOString()
      };
      onLogin(user);
      setLoading(false);
      setShowLogin(false);
    }, 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = {
        id: Date.now(),
        username: signupData.username,
        email: signupData.email,
        avatar: signupData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        joinedDate: new Date().toISOString()
      };
      onSignup(user);
      setLoading(false);
      setShowSignup(false);
    }, 1000);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignupData({ ...signupData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
      <MatrixBackground />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{
            textShadow: [
              '0 0 20px #ff0000',
              '0 0 40px #ff0000',
              '0 0 20px #ff0000'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-12"
        >
          <h1
            className="mb-4"
            style={{
              fontSize: '4rem',
              fontFamily: 'Orbitron, sans-serif',
              background: 'linear-gradient(90deg, #ff0000, #ff4d4d)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            SYSTEM DIAGNOSTIC
          </h1>
          <h2
            className="text-white"
            style={{
              fontSize: '2rem',
              fontFamily: 'Orbitron, sans-serif',
              letterSpacing: '0.3em'
            }}
          >
            UTILITY
          </h2>
        </motion.div>

        <div className="flex gap-6 justify-center">
          <motion.div
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 40px rgba(255, 0, 0, 0.6), 0 0 80px rgba(255, 0, 0, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30 transition-all duration-300 px-8 py-6"
              style={{
                boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), 0 0 60px rgba(255, 0, 0, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}
            >
              LOGIN
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ 
              scale: 1.05,
              boxShadow: '0 0 40px rgba(255, 0, 0, 0.6), 0 0 80px rgba(255, 0, 0, 0.3)'
            }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={() => setShowSignup(true)}
              className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30 transition-all duration-300 px-8 py-6"
              style={{
                boxShadow: '0 0 30px rgba(255, 0, 0, 0.5), 0 0 60px rgba(255, 0, 0, 0.3)',
                fontFamily: 'Orbitron, sans-serif'
              }}
            >
              SIGN UP
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Login Modal */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.5)' }}>
          <DialogHeader>
            <DialogTitle className="text-red-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}>
              LOGIN
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="bg-black border-red-600/50 text-white focus:border-red-600"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                required
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="bg-black border-red-600/50 text-white focus:border-red-600"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                required
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                disabled={loading}
                style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.5)' }}
              >
                {loading ? (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Loading...
                  </motion.div>
                ) : (
                  'LOGIN'
                )}
              </Button>
            </motion.div>
            <p className="text-center text-sm text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setShowSignup(true);
                }}
                className="text-red-500 hover:text-red-400"
              >
                Sign up
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white" style={{ boxShadow: '0 0 50px rgba(255, 0, 0, 0.5)' }}>
          <DialogHeader>
            <DialogTitle className="text-red-500" style={{ fontFamily: 'Orbitron, sans-serif', textShadow: '0 0 20px #ff0033' }}>
              CREATE ACCOUNT
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer block w-24 h-24 rounded-full border-2 border-red-600 overflow-hidden bg-black"
                  style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)' }}
                >
                  {signupData.avatar ? (
                    <img src={signupData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-red-500" />
                    </div>
                  )}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                value={signupData.username}
                onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                className="bg-black border-red-600/50 text-white focus:border-red-600"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                required
              />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className="bg-black border-red-600/50 text-white focus:border-red-600"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                required
              />
            </div>
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                className="bg-black border-red-600/50 text-white focus:border-red-600"
                style={{ boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)' }}
                required
              />
            </div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                disabled={loading}
                style={{ boxShadow: '0 0 25px rgba(255, 0, 0, 0.5)' }}
              >
                {loading ? (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Creating...
                  </motion.div>
                ) : (
                  'CREATE ACCOUNT'
                )}
              </Button>
            </motion.div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}