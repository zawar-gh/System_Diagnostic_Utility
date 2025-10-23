import { useState } from 'react';
import { motion } from 'motion/react';
import { User, LogOut, Settings, Save } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { SystemOverview } from './SystemOverview';
import { AnalysisUpgrades } from './AnalysisUpgrades';
import { ProfileModal } from './ProfileModal';
import { MatrixBackground } from './MatrixBackground';

interface DashboardProps {
  user: any;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis'>('overview');
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <MatrixBackground />
      
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-20 border-b-2 border-red-600/30 bg-black/80 backdrop-blur-sm"
        style={{ boxShadow: '0 4px 30px rgba(255, 0, 0, 0.4), 0 8px 60px rgba(255, 0, 0, 0.2)' }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            animate={{
              textShadow: [
                '0 0 10px #ff0000',
                '0 0 20px #ff0000',
                '0 0 10px #ff0000'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-3"
          >
            <div
              className="text-red-500"
              style={{
                fontSize: '1.5rem',
                fontFamily: 'Orbitron, sans-serif',
                background: 'linear-gradient(90deg, #ff0000, #ff4d4d)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              SDU
            </div>
          </motion.div>

          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                fontFamily: 'Orbitron, sans-serif',
                textShadow: activeTab === 'overview' ? '0 0 15px #ff0033' : 'none'
              }}
            >
              SYSTEM OVERVIEW
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 transition-all duration-300 ${
                activeTab === 'analysis'
                  ? 'text-red-500 border-b-2 border-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              style={{ 
                fontFamily: 'Orbitron, sans-serif',
                textShadow: activeTab === 'analysis' ? '0 0 15px #ff0033' : 'none'
              }}
            >
              ANALYSIS & UPGRADES
            </motion.button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-10 h-10 border-2 border-red-600" style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}>
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-white">{user.username}</span>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a0a0a] border-red-600 text-white" style={{ boxShadow: '0 0 30px rgba(255, 0, 0, 0.5)' }}>
              <DropdownMenuItem
                onClick={() => setShowProfile(true)}
                className="cursor-pointer hover:bg-red-600/20"
              >
                <User className="mr-2 h-4 w-4" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowProfile(true)}
                className="cursor-pointer hover:bg-red-600/20"
              >
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowProfile(true)}
                className="cursor-pointer hover:bg-red-600/20"
              >
                <Save className="mr-2 h-4 w-4" />
                Saved Results
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onLogout}
                className="cursor-pointer hover:bg-red-600/20 text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' ? (
            <SystemOverview user={user} />
          ) : (
            <AnalysisUpgrades user={user} />
          )}
        </motion.div>
      </div>

      <ProfileModal
        user={user}
        open={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={onLogout}
      />
    </div>
  );
}