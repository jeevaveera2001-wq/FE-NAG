import React from 'react';
import { Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-13 sm:h-16 bg-white border-b border-gray-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Brand Welcome / Mobile Brand Badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex lg:hidden items-center gap-1.5">
          <img
            src="/vs-logo.png"
            alt="VS Scissor Logo"
            className="w-7 h-7 object-contain rounded-lg border border-gold-500/50 bg-black p-0.5 shadow-xs"
          />
          <span className="font-serif font-black text-xs sm:text-sm text-gray-900 tracking-wider block">
            NAGULAN <span className="text-[10px] text-gold-500 font-sans font-bold">POS</span>
          </span>
        </div>

        <div className="hidden sm:block">
          <h2 className="text-xs sm:text-sm font-semibold text-gray-800">
            Welcome, <span className="text-gold-600 font-bold">{user?.fullName || 'User'}</span>
          </h2>
          <p className="text-[10px] text-gray-500">
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
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Bill Button */}
        <Link
          to="/billing"
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-black text-white hover:bg-charcoal-800 font-bold text-[11px] sm:text-xs transition-all shadow-sm"
        >
          <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>New Bill</span>
        </Link>

        {/* User Avatar */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-charcoal-800 text-gold-400 flex items-center justify-center font-bold text-[11px] sm:text-xs border border-gold-500/40">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <span className="block text-xs font-semibold text-gray-900 truncate max-w-[110px]">
              {user?.fullName}
            </span>
            <span className="block text-[9px] text-gray-500 capitalize">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
