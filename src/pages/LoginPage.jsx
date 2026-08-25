import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NagulanBanner from '../components/NagulanBanner';
import { Lock, User, Eye, EyeOff, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your username/email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await login(identifier, password);
      toast.success(`Welcome back, ${data.user.fullName}!`);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-charcoal-950 flex flex-col justify-center items-center p-4 sm:p-6 select-none transition-colors">
      <div className="w-full max-w-xl space-y-6">
        {/* Official NAGULAN Banner at Top */}
        <NagulanBanner />

        {/* Login Card */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl shadow-xl border border-gray-200 dark:border-charcoal-800 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold font-serif uppercase tracking-wider text-gray-900 dark:text-white">
              Salon Management Portal
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sign in with your authorized credentials to access billing and operations
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g., superadmin or admin@nagulan.com"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all shadow-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300 text-gold-500 focus:ring-gold-500 dark:bg-charcoal-800"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => toast('Please contact Super Admin for password recovery.', { icon: 'ℹ️' })}
                className="text-gold-600 dark:text-gold-400 hover:underline font-medium"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-500">
          NAGULAN Unisex Salon Billing & Management System • v1.0.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
