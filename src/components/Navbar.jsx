import React from 'react';
import { Sun, Moon, Receipt, Radio, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { connected } = useSocket();

  return (
    <header className="h-13 sm:h-16 bg-white dark:bg-charcoal-900 border-b border-gray-200 dark:border-charcoal-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-sm">
      {/* Left: Brand Welcome / Mobile Brand Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="block lg:hidden">
          <span className="font-serif font-black text-xs sm:text-sm text-gray-900 dark:text-white tracking-wider block">
            NAGULAN <span className="text-[10px] text-gold-500 font-sans font-bold">POS</span>
          </span>
        </div>

        <div className="hidden sm:block">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
            Welcome, <span className="text-gold-600 dark:text-gold-400 font-bold">{user?.fullName || 'User'}</span>
          </h2>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Real-time Socket Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${
            connected
              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
              : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
          }`}
          title={connected ? 'Live real-time sync active' : 'Connecting to live sync...'}
        >
          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="hidden md:inline">{connected ? 'Live' : 'Connecting'}</span>
        </div>

        {/* Quick New Bill Button */}
        <Link
          to="/billing"
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-[11px] sm:text-xs transition-all shadow-sm"
        >
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>New Bill</span>
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-colors"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold-400" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-charcoal-700" />}
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-gray-200 dark:border-charcoal-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-charcoal-800 text-gold-400 flex items-center justify-center font-bold text-[11px] sm:text-xs border border-gold-500/40">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <span className="block text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[110px]">
              {user?.fullName}
            </span>
            <span className="block text-[9px] text-gray-500 dark:text-gray-400 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
