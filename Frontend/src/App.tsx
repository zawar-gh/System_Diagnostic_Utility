import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";

import { loginUser, signupUser, getProfile } from "./services/authService";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load saved session on app start
  useEffect(() => {
    const stored = localStorage.getItem("sdu_user");
    if (!stored) {
      setLoading(false);
      return;
    }

    const { access } = JSON.parse(stored);
    if (!access) {
      setLoading(false);
      return;
    }

    // Try to fetch user profile using stored JWT
    getProfile()
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("sdu_user");
      })
      .finally(() => setLoading(false));
  }, []);

  // Handle login
  const handleLogin = async (credentials: { username: string; password: string }) => {
    try {
      const tokens = await loginUser(credentials);
      localStorage.setItem("sdu_user", JSON.stringify(tokens));
      const profile = await getProfile();
      setUser(profile);
      toast.success("Login successful");
    } catch (err: any) {
      console.error(err);
      toast.error("Invalid credentials");
    }
  };

  // Handle signup
  const handleSignup = async (data: { username: string; email: string; password: string }) => {
    try {
      await signupUser(data);
      toast.success("Account created successfully! Please log in.");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Signup failed");
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("sdu_user");
    setUser(null);
    toast.success("Logged out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white text-lg"
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
