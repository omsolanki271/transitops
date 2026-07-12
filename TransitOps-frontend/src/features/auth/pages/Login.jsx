import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { isMockMode } from '../../../api/client';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    // Attempt login
    const result = await login(email, password, isMockMode());
    
    setIsSubmitting(false);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error);
    }
  };

  const handleQuickFill = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 select-none">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        {/* Brand Logo */}
        <div className="bg-primary text-white p-3 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105">
          <ShieldCheck className="h-10 w-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-on-surface tracking-tight">
          Welcome to TransitOps
        </h2>
        <p className="mt-2 text-center text-sm text-on-surface-variant max-w">
          Smart Transport Operations Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-xl border border-gray-100 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                {error}
              </div>
            )}

            {/* Email input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3.5 py-2.5 border border-outline-variant/60 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-primary/20 focus:border-primary sm:text-sm font-medium transition-all duration-200"
                  placeholder="name@transitops.com"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Password
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3.5 py-2.5 border border-outline-variant/60 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-3 focus:ring-primary/20 focus:border-primary sm:text-sm font-medium pr-10 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-container hover:to-secondary hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          {/* Quick-fill Role Selectors */}
          <div className="mt-8 border-t border-gray-150 pt-6">
            <h3 className="text-center text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Demo Credentials (Role Selection)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <button
                type="button"
                onClick={() => handleQuickFill('manager@transitops.com')}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-xs font-medium text-on-surface bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-150 cursor-pointer"
              >
                Fleet Manager
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('dispatcher@transitops.com')}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-xs font-medium text-on-surface bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-150 cursor-pointer"
              >
                Dispatcher
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('safety@transitops.com')}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-xs font-medium text-on-surface bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-150 cursor-pointer"
              >
                Safety Officer
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('finance@transitops.com')}
                className="px-2.5 py-2 border border-gray-200 rounded-md text-xs font-medium text-on-surface bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-150 cursor-pointer"
              >
                Financial Analyst
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
