import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Upload } from "lucide-react";
import { MatrixBackground } from "./MatrixBackground";

interface AuthScreenProps {
  onLogin: (user: any) => void;
  onSignup: (user: any) => void;
}

export function AuthScreen({ onLogin, onSignup }: AuthScreenProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(false);


  // 🧠 Login Handler
  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await onLogin(loginData);
    setShowLogin(false);
  } catch (error: any) {
    console.error("Login error:", error);
    toast.error(error.response?.data?.detail || "Login failed. Try again.");
  } finally {
    setLoading(false);
  }
};


  // 🧠 Signup Handler (Real API)
  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const { username, email, password } = signupData;
    await onSignup({ username, email, password });
    toast.success("Account created successfully!");
    setShowSignup(false);
  } catch (error: any) {
    console.error("Signup error:", error);
    toast.error(error.response?.data?.detail || "Signup failed. Try again.");
  } finally {
    setLoading(false);
  }
};


  // 🧠 Avatar Upload
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
        {/* Title */}
        <motion.div
          animate={{
            textShadow: [
              "0 0 20px #ff0000",
              "0 0 40px #ff0000",
              "0 0 20px #ff0000",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-12"
        >
          <h1
            className="mb-4"
            style={{
              fontSize: "4rem",
              fontFamily: "Orbitron, sans-serif",
              background: "linear-gradient(90deg, #ff0000, #ff4d4d)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SYSTEM DIAGNOSTIC
          </h1>
          <h2
            className="text-white"
            style={{
              fontSize: "2rem",
              fontFamily: "Orbitron, sans-serif",
              letterSpacing: "0.3em",
            }}
          >
            UTILITY
          </h2>
        </motion.div>

        {/* Buttons */}
        <div className="flex gap-6 justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30 px-8 py-6 transition-all duration-300"
            >
              LOGIN
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => setShowSignup(true)}
              className="bg-transparent border-2 border-red-600 text-white hover:bg-red-600/30 px-8 py-6 transition-all duration-300"
            >
              SIGN UP
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">LOGIN</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Loading..." : "LOGIN"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="bg-[#0a0a0a] border-2 border-red-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-red-500">CREATE ACCOUNT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="flex justify-center">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer block w-24 h-24 rounded-full border-2 border-red-600 overflow-hidden bg-black"
              >
                {signupData.avatar ? (
                  <img
                    src={signupData.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
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

            <div>
              <Label>Username</Label>
              <Input
                value={signupData.username}
                onChange={(e) =>
                  setSignupData({ ...signupData, username: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={signupData.email}
                onChange={(e) =>
                  setSignupData({ ...signupData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={signupData.password}
                onChange={(e) =>
                  setSignupData({ ...signupData, password: e.target.value })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? "Creating..." : "CREATE ACCOUNT"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
