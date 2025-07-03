import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLock, FiLogIn, FiLoader, FiUserPlus, FiPlay, FiZap, FiSettings, FiShield } = FiIcons;

const LoginForm = () => {
  const [mode, setMode] = useState('signin'); // Default to signin for superadmin
  const [email, setEmail] = useState('kostas@pos.eu');
  const [password, setPassword] = useState('1234567');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signIn, signUp, setupSuperAdmin, accessDemo, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message || 'Invalid email or password.');
      }
    } else if (mode === 'signup') {
      const { data, error } = await signUp(email, password);
      if (error) {
        setError(error.message || 'Account creation failed.');
      } else {
        setMessage('Account created! Please check your email for confirmation.');
      }
    } else if (mode === 'demo') {
      const { data, error } = await accessDemo();
      if (error) {
        setError('Demo access failed. Please try again.');
      } else if (data?.user) {
        setMessage('Demo access granted! Setting up your restaurant...');
      }
    }
  };

  // Initialize superadmin
  const handleSetupSuperAdmin = async () => {
    setError('');
    setMessage('Setting up superadmin...');
    const result = await setupSuperAdmin();
    if (result.error) {
      setError('Superadmin setup failed. Please try again.');
    } else {
      setMessage('✅ Superadmin created! You can now sign in with kostas@pos.eu / 1234567');
      setEmail('kostas@pos.eu');
      setPassword('1234567');
      setMode('signin');
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
                 'Setting Up Demo...'}
              </>
            ) : (
              <>
                <SafeIcon icon={mode === 'signin' ? FiLogIn : 
                              mode === 'signup' ? FiUserPlus : 
                              FiZap} />
                {mode === 'signin' ? 'Sign In' : 
                 mode === 'signup' ? 'Create Account' : 
                 'Quick Demo Access'}
              </>
            )}
          </motion.button>
        </form>

        {/* Setup Superadmin Button */}
        <div className="mt-4">
          <button
            onClick={handleSetupSuperAdmin}
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <SafeIcon icon={FiShield} />
            🚀 Setup Superadmin
          </button>
        </div>

        <div className="mt-6 space-y-2 text-center">
          <div className="flex gap-2">
            <button
              onClick={() => {setMode('demo'); setError(''); setMessage('');}}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'demo' ? 'bg-success-100 text-success-700' : 'text-success-600 hover:bg-success-50'
              }`}
            >
              Demo
            </button>
            <button
              onClick={() => {setMode('signup'); setError(''); setMessage('');}}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-primary-100 text-primary-700' : 'text-primary-600 hover:bg-primary-50'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => {setMode('signin'); setError(''); setMessage('');}}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'signin' ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Sign In
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <SafeIcon icon={FiShield} className="text-yellow-500" />
            🔑 Superadmin Credentials
          </h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Email:</strong> kostas@pos.eu</p>
            <p><strong>Password:</strong> 1234567</p>
            <p className="text-xs text-gray-500 mt-2">
              ⚡ Click "🚀 Setup Superadmin" first, then sign in with these credentials.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;