import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLock, FiLogIn, FiLoader, FiUserPlus } = FiIcons;

const LoginForm = () => {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('admin@restaurant.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const { signIn, signUp, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      }
    } else {
      const { data, error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else if (data.user) {
        setMessage('Account created successfully! Please check your email to verify your account.');
        setMode('signin');
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
            {mode === 'signin' ? 'Sign in to your restaurant dashboard' : 'Create your restaurant account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                required
                minLength={6}
              />
            </div>
          </div>

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
                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                <SafeIcon icon={mode === 'signin' ? FiLogIn : FiUserPlus} />
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </>
            )}
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
              setMessage('');
            }}
            className="text-primary-500 hover:text-primary-600 text-sm font-medium"
          >
            {mode === 'signin' 
              ? "Don't have an account? Create one" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>

        {mode === 'signin' && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Demo Credentials</h3>
            <p className="text-sm text-gray-600">
              Email: admin@restaurant.com<br />
              Password: password123
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Or create a new account to get started with your own restaurant!
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default LoginForm;