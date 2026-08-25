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
  UserCheck,
  ShieldAlert,
  UserSquare2,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    { label: 'Staff Management', path: '/staff', icon: UserCheck, visible: isAdmin },
    { label: 'Admin Management', path: '/admins', icon: ShieldAlert, visible: isSuperAdmin },
    { label: 'Customers', path: '/customers', icon: UserSquare2, visible: true },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3, visible: isAdmin },
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
      {/* Brand Header */}
      <div className="h-14 sm:h-16 px-2 lg:px-4 flex items-center justify-center lg:justify-between border-b border-charcoal-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          {/* Logo Badge (Always visible on mobile & desktop) */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-black border border-gold-500 flex items-center justify-center shrink-0 shadow-sm">
            <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-gold-500 transform -rotate-45" />
          </div>

          {/* Brand Name Text (Hidden on mobile & hidden when collapsed on desktop) */}
          <div className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:block'} truncate`}>
            <span className="font-serif font-bold text-base text-white tracking-wider block leading-tight">
              NAGULAN
            </span>
            <span className="text-[9px] tracking-widest text-gold-400 uppercase font-bold block">
              UNISEX SALON
            </span>
          </div>
        </div>

        {/* Collapse Toggle for Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Role Badge (Desktop expanded only) */}
      <div className={`hidden ${isCollapsed ? 'lg:hidden' : 'lg:block'} px-4 py-2.5 border-b border-charcoal-800/60 bg-charcoal-950/40 shrink-0`}>
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
