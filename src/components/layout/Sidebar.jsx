import React from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { 
  FiGrid, FiUsers, FiBarChart3, FiSettings, FiLogOut, 
  FiChef, FiDollarSign, FiMenu, FiUserCheck 
} = FiIcons;

const Sidebar = ({ activeView, setActiveView }) => {
  const { signOut, currentTenant, user } = useAuthStore();

  const menuItems = [
    { id: 'tables', label: 'Tables', icon: FiGrid },
    { id: 'kitchen', label: 'Kitchen', icon: FiChef },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart3 },
    { id: 'menu', label: 'Menu', icon: FiMenu },
    { id: 'customers', label: 'Customers', icon: FiUsers },
    { id: 'staff', label: 'Staff', icon: FiUserCheck },
    { id: 'payments', label: 'Payments', icon: FiDollarSign },
    { id: 'settings', label: 'Settings', icon: FiSettings }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <SafeIcon icon={FiGrid} className="text-white text-lg" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{currentTenant?.name}</h2>
            <p className="text-sm text-gray-600 capitalize">{currentTenant?.plan}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              onClick={() => setActiveView(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                ${activeView === item.id
                  ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <SafeIcon icon={item.icon} className="text-lg" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <SafeIcon icon={FiUsers} className="text-gray-600 text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500">Staff Member</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
        >
          <SafeIcon icon={FiLogOut} />
          <span className="text-sm font-medium">Sign Out</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Sidebar;