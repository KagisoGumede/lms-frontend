'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'manager') router.push('/manager/dashboard');
      else router.push('/employee/dashboard');
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authAPI.login(email, password);
      if (res.success) {
        const userData = res.data;
        login({
          id: userData.id,
          name: userData.firstName,
          surname: userData.surname,
          email: userData.emailAddress,
          role: userData.role.toLowerCase(),
          department: userData.department
        });
      } else {
        setError(res.message || 'Invalid email or password');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Cannot connect to server. Make sure backend is running.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-[#0f1f3d] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, #3b82f6 0%, transparent 50%)' }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-[#0f1f3d] font-black text-sm">LMS</span>
            </div>
            <span className="text-white font-bold text-lg">LeaveMS</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-6">
            Streamline your<br />
            <span className="text-blue-400">leave management</span><br />
            process
          </h2>
          <p className="text-blue-200 leading-relaxed max-w-sm">
            A professional leave management platform trusted by companies to manage employee time off efficiently.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            'Role-based access for Admin, Managers & Employees',
            'Automated email notifications',
            'Real-time reports & analytics',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-blue-200 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 bg-[#0f1f3d] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">LMS</span>
            </div>
            <span className="text-[#0f1f3d] font-bold text-lg">LeaveMS</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#0f1f3d] mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d] outline-none transition placeholder-gray-400 text-sm"
                placeholder="your.email@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-[#0f1f3d] focus:border-[#0f1f3d] outline-none transition placeholder-gray-400 text-sm pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  {showPassword ? 'HIDE' : 'SHOW'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-[#0f1f3d] hover:text-blue-700 text-sm font-medium transition"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 bg-[#0f1f3d] hover:bg-[#1a3260] text-white font-bold rounded-xl transition text-sm shadow-lg ${
                isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Role pills */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 font-medium uppercase tracking-wider">
              Available Portals
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['Administrator', 'Manager', 'Employee'].map((role) => (
                <div key={role} className="text-center py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-gray-600 text-xs font-semibold">{role}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-gray-600 text-xs transition"
            >
              Back to home
            </button>
          </div>

          <p className="text-center text-gray-400 text-xs mt-4">
            Leave Management System © {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}