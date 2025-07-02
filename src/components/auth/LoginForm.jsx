import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLock, FiLogIn, FiLoader, FiUserPlus, FiPlay } = FiIcons;

const LoginForm = () => {
  const [mode, setMode] = useState('demo'); // Start with demo mode
  const [email, setEmail] = useState('admin@restaurant.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { signIn, signUp, createDemoUser, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Invalid email or password. Try creating a demo account first.');
      }
    } else if (mode === 'signup') {
      const { data, error } = await signUp(email, password);
      if (error) {
        if (error.message.includes('email_not_confirmed') || error.message.includes('Email not confirmed')) {
          setError('Email confirmation is required. Please check your email or try the demo account instead.');
        } else {
          setError(error.message);
        }
      } else if (data.user) {
        setMessage('Account created successfully! Signing you in...');
        // Auto-sign in after successful signup
        setTimeout(async () => {
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            setError('Account created but sign-in failed. Please try signing in manually.');
            setMode('signin');
          }
        }, 1000);
      }
    } else if (mode === 'demo') {
      const { data, error } = await createDemoUser();
      if (error) {
        setError('Failed to create demo account. Please try manual signup.');
        setMode('signup');
      } else if (data?.user) {
        setMessage('Demo account created and signed in successfully!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="bg-primary-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <SafeIcon icon={FiUser} className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">SaaS POS System</h1>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' ? 'Sign in to your restaurant dashboard' : 
             mode === 'signup' ? 'Create your restaurant account' :
             'Try the demo restaurant instantly'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode !== 'demo' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <SafeIcon icon={FiUser} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <SafeIcon icon={FiLock} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your password"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-danger-50 border border-danger-200 text-danger-600 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-success-50 border border-success-200 text-success-600 px-4 py-3 rounded-lg text-sm"
            >
              {message}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <SafeIcon icon={FiLoader} className="animate-spin" />
                {mode === 'signin' ? 'Signing In...' : 
                 mode === 'signup' ? 'Creating Account...' : 
                 'Creating Demo...'}
              </>
            ) : (
              <>
                <SafeIcon icon={mode === 'signin' ? FiLogIn : mode === 'signup' ? FiUserPlus : FiPlay} />
                {mode === 'signin' ? 'Sign In' : 
                 mode === 'signup' ? 'Create Account' : 
                 'Try Demo Now'}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('demo');
                setError('');
                setMessage('');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'demo' 
                  ? 'bg-success-100 text-success-700' 
                  : 'text-success-600 hover:bg-success-50'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
                setMessage('');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup' 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {
                setMode('signin');
                setError('');
                setMessage('');
              }}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signin' 
                  ? 'bg-gray-100 text-gray-700' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">
            {mode === 'demo' ? '🚀 Instant Demo' : 
             mode === 'signup' ? '📝 Create Account' : 
             '🔑 Existing User'}
          </h3>
          {mode === 'demo' ? (
            <p className="text-sm text-gray-600">
              Click "Try Demo Now" to instantly create and access a fully functional restaurant POS system with sample data.
            </p>
          ) : mode === 'signup' ? (
            <p className="text-sm text-gray-600">
              Create your account with the pre-filled credentials or use your own email to get started with a demo restaurant setup.
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              Sign in if you already have an account. If not, try the demo or create a new account.
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            All modes include a complete demo restaurant with menu items, tables, and sample data.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;