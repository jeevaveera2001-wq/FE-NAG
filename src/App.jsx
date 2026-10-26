import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BillingPage from './pages/BillingPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import PaymentsPage from './pages/PaymentsPage';
import ServicesPage from './pages/ServicesPage';
import ProductsPage from './pages/ProductsPage';
import ChairsPage from './pages/ChairsPage';
import AttendantsPage from './pages/AttendantsPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import SettingsPage from './pages/SettingsPage';
import AdminManagementPage from './pages/AdminManagementPage';

// Protected Route Guard
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-charcoal-950">
        <div className="w-8 h-8 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-charcoal-950 transition-colors">
      {/* Icon-Only Compact Mobile Sidebar & Full Desktop Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 flex flex-col min-h-screen pl-14 sm:pl-16 ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <Navbar />

        <main className="flex-1 p-2 sm:p-4 md:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Role Guard Component
const RoleGuard = ({ allowedRoles, children, fallbackPath }) => {
  const { user, hasRole, isReception } = useAuth();

  if (!user || !hasRole(allowedRoles)) {
    const target = fallbackPath || (isReception ? '/billing' : '/');
    return <Navigate to={target} replace />;
  }

  return children;
};

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated Dashboard Routes */}
      <Route element={<ProtectedLayout />}>
        {/* Admin & Super Admin Only for Dashboard, Chairs, Attendants, Payments */}
        <Route
          path="/"
          element={
            <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackPath="/billing">
              <DashboardPage />
            </RoleGuard>
          }
        />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/sales" element={<SalesHistoryPage />} />
        <Route
          path="/payments"
          element={
            <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackPath="/billing">
              <PaymentsPage />
            </RoleGuard>
          }
        />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/chairs"
          element={
            <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackPath="/billing">
              <ChairsPage />
            </RoleGuard>
          }
        />
        <Route
          path="/attendants"
          element={
            <RoleGuard allowedRoles={['admin', 'superadmin']} fallbackPath="/billing">
              <AttendantsPage />
            </RoleGuard>
          }
        />
        <Route path="/customers" element={<CustomersPage />} />

        {/* Super Admin Only */}
        <Route
          path="/settings"
          element={
            <RoleGuard allowedRoles={['superadmin']}>
              <SettingsPage />
            </RoleGuard>
          }
        />

        {/* Admin & Super Admin Only */}
        <Route
          path="/reports"
          element={
            <RoleGuard allowedRoles={['admin', 'superadmin']}>
              <ReportsPage />
            </RoleGuard>
          }
        />

        {/* Super Admin Only */}
        <Route
          path="/admin-management"
          element={
            <RoleGuard allowedRoles={['superadmin']}>
              <AdminManagementPage />
            </RoleGuard>
          }
        />
        <Route
          path="/activity-logs"
          element={
            <RoleGuard allowedRoles={['superadmin']}>
              <ActivityLogsPage />
            </RoleGuard>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
