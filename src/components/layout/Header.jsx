import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBell, FiMapPin, FiWifi, FiWifiOff } = FiIcons;

const Header = ({ activeView }) => {
  const { currentLocation } = useAuthStore();
  
  const getViewTitle = (view) => {
    const titles = {
      tables: 'Table Management',
      kitchen: 'Kitchen Display',
      analytics: 'Analytics Dashboard',
      menu: 'Menu Management',
      customers: 'Customer Management',
      staff: 'Staff Management',
      payments: 'Payment Processing',
      settings: 'Settings'
    };
    return titles[view] || 'POS System';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getViewTitle(activeView)}
          </h1>
          {currentLocation && (
            <div className="flex items-center gap-2 mt-1">
              <SafeIcon icon={FiMapPin} className="text-gray-400 text-sm" />
              <span className="text-sm text-gray-600">
                {currentLocation.name || 'Main Location'}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <SafeIcon 
              icon={FiWifi} 
              className="text-success-500" 
              title="Connected"
            />
            <span className="text-sm text-gray-600">Online</span>
          </motion.div>

          {/* Notifications */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiBell} className="text-xl" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </motion.button>

          {/* Current Time */}
          <div className="text-sm text-gray-600">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;