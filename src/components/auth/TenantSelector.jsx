import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiBuilding, FiMapPin, FiArrowRight, FiCrown, FiStar, FiZap, FiLoader } = FiIcons;

const TenantSelector = () => {
  const { tenants, locations, currentTenant, selectTenant, selectLocation, user, loading } = useAuthStore();

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'enterprise': return FiCrown;
      case 'pro': return FiStar;
      default: return FiZap;
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'enterprise': return 'text-yellow-500';
      case 'pro': return 'text-purple-500';
      default: return 'text-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="text-center">
          <SafeIcon icon={FiLoader} className="text-4xl text-primary-500 animate-spin mb-4" />
          <p className="text-gray-600">Setting up your restaurant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600">Select your restaurant to continue</p>
        </motion.div>

        {!currentTenant ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <SafeIcon icon={FiBuilding} className="text-6xl text-gray-300 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">Setting up your restaurant...</h3>
                <p className="text-gray-500">Please wait while we prepare your demo restaurant.</p>
              </motion.div>
            ) : (
              tenants.map((tenant, index) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => selectTenant(tenant.id)}
                  className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-primary-100 w-12 h-12 rounded-full flex items-center justify-center">
                      <SafeIcon icon={FiBuilding} className="text-primary-600 text-xl" />
                    </div>
                    <div className="flex items-center gap-1">
                      <SafeIcon icon={getPlanIcon(tenant.plan)} className={`${getPlanColor(tenant.plan)} text-sm`} />
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {tenant.plan}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tenant.name}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Role: {tenant.role}
                    </span>
                    <SafeIcon icon={FiArrowRight} className="text-primary-500" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl p-6 shadow-lg mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiBuilding} className="text-primary-600 text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentTenant.name}</h2>
                  <p className="text-gray-600">Select a location to access POS</p>
                </div>
              </div>
              <button
                onClick={() => selectTenant(null)}
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                ← Switch Restaurant
              </button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center py-12"
                >
                  <SafeIcon icon={FiMapPin} className="text-6xl text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Setting up your location...</h3>
                  <p className="text-gray-500">Please wait while we prepare your demo location.</p>
                </motion.div>
              ) : (
                locations.map((location, index) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => selectLocation(location.id)}
                    className="bg-white rounded-xl p-6 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200"
                  >
                    <div className="bg-success-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <SafeIcon icon={FiMapPin} className="text-success-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {location.name || 'Main Location'}
                    </h3>
                    {location.address && (
                      <p className="text-gray-600 text-sm mb-4">
                        {location.address.street}, {location.address.city}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Ready to use
                      </span>
                      <SafeIcon icon={FiArrowRight} className="text-primary-500" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantSelector;