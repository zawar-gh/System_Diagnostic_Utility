import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AuthScreen } from "./components/AuthScreen";
import { Dashboard } from "./components/Dashboard";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

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
    <motion.div
      initial={{ background: "linear-gradient(to bottom right, #000000, #000000)" }}
      animate={{
        background: [
          "linear-gradient(to bottom right, #000000, #000000)",
          "linear-gradient(to bottom right, #8B0000, #000000)",
          "linear-gradient(to bottom right, #ff0000, #000000)",
          "linear-gradient(to bottom right, #8B0000, #000000)",
          "linear-gradient(to bottom right, #000000, #000000)",
        ],
      }}
      transition={{
        duration: 6,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className="min-h-screen flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-700 drop-shadow-[0_0_10px_#ff0000]">
          Getting your system info...
        </h1>
      </motion.div>
    </motion.div>
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
