import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  History,
  CreditCard,
  Scissors,
  Package,
  Armchair,
  Users,
  UserSquare2,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NAGULAN_BANNER_BASE64 from '../assets/bannerBase64';

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout, isSuperAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, visible: true },
    { label: 'Billing / POS', path: '/billing', icon: Receipt, visible: true },
    { label: 'Sales History', path: '/sales', icon: History, visible: true },
    { label: 'Payments', path: '/payments', icon: CreditCard, visible: true },
    { label: 'Services & Menu', path: '/services', icon: Scissors, visible: true },
    { label: 'Products & Stock', path: '/products', icon: Package, visible: true },
    { label: 'Chairs & Stations', path: '/chairs', icon: Armchair, visible: true },
    { label: 'Attendants', path: '/attendants', icon: Users, visible: true },
    { label: 'Customers', path: '/customers', icon: UserSquare2, visible: true },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, visible: isAdmin },
    { label: 'Admin Management', path: '/admin-management', icon: ShieldCheck, visible: isSuperAdmin },
    { label: 'Activity Logs', path: '/activity-logs', icon: FileSpreadsheet, visible: isSuperAdmin },
    { label: 'Salon Settings', path: '/settings', icon: Settings, visible: true },
  ];

  const filteredItems = navItems.filter((item) => item.visible);

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-full bg-charcoal-900 text-gray-200 border-r border-charcoal-800 transition-all duration-300 flex flex-col w-14 sm:w-16 ${
        isCollapsed ? 'lg:w-20' : 'lg:w-64'
      }`}
    >
      {/* Brand Header with Official Banner */}
      <div className="min-h-14 sm:min-h-16 px-1.5 lg:px-2.5 py-2 flex items-center justify-between border-b border-charcoal-800 shrink-0 bg-black/70">
        {/* Full Banner (Visible when sidebar is expanded on desktop) */}
        <div className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:flex'} items-center flex-1 pr-1.5 overflow-hidden`}>
          <img
            src={NAGULAN_BANNER_BASE64}
            alt="NAGULAN Unisex Salon"
            className="w-full h-auto max-h-12 object-contain rounded-md shadow-xs"
          />
        </div>

        {/* Compact Logo Emblem (Visible on mobile or when collapsed on desktop) */}
        <div className={`flex items-center justify-center ${isCollapsed ? 'w-full' : 'lg:hidden w-full'}`}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black border border-gold-500 flex items-center justify-center shrink-0 shadow-sm">
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500 transform -rotate-45" />
          </div>
        </div>

        {/* Collapse Toggle for Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors shrink-0"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Role Badge (Desktop expanded only) */}
      <div className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:block'} px-4 py-2 border-b border-charcoal-800/60 bg-charcoal-950/40 shrink-0`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 truncate max-w-[110px] text-[11px] font-medium">{user?.fullName}</span>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
              isSuperAdmin
                ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                : isAdmin
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-1.5 sm:px-2 lg:px-3 py-3 space-y-1 scrollbar-none">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40 font-bold shadow-sm'
                  : 'text-gray-400 hover:bg-charcoal-800 hover:text-white'
              } ${isCollapsed ? 'lg:justify-center' : ''}`
            }
            title={item.label}
          >
            <item.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:inline'} truncate`}>
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout Action */}
      <div className="p-1.5 sm:p-2 lg:p-3 border-t border-charcoal-800 shrink-0">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${
            isCollapsed ? 'lg:justify-center' : ''
          }`}
          title="Secure Logout"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:inline'} font-semibold truncate`}>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
