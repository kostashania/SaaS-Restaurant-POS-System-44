import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiUsers, FiBuilding, FiPlus, FiEdit, FiTrash2, FiEye } = FiIcons;

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tenants') {
        const { data } = await supabase
          .from('tenants_pos_v1')
          .select(`
            *,
            staff:staff_pos_v1(count),
            locations:locations_pos_v1(count)
          `);
        setTenants(data || []);
      } else if (activeTab === 'users') {
        const { data } = await supabase
          .from('staff_pos_v1')
          .select(`
            *,
            tenant:tenant_id(name, plan)
          `);
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const TenantCard = ({ tenant }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <SafeIcon icon={FiBuilding} className="text-primary-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{tenant.plan} plan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg">
            <SafeIcon icon={FiEye} />
          </button>
          <button className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
            <SafeIcon icon={FiEdit} />
          </button>
          <button className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Staff</p>
          <p className="text-lg font-semibold text-gray-900">
            {tenant.staff?.[0]?.count || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Locations</p>
          <p className="text-lg font-semibold text-gray-900">
            {tenant.locations?.[0]?.count || 0}
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Created: {new Date(tenant.created_at).toLocaleDateString()}
      </div>
    </motion.div>
  );

  const UserCard = ({ user }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
            <SafeIcon icon={FiUsers} className="text-success-600 text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{user.email}</h3>
            <p className="text-sm text-gray-500 capitalize">{user.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {user.role === 'superadmin' && (
            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
              SUPER
            </div>
          )}
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            user.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-600">Tenant</p>
          <p className="font-medium text-gray-900">{user.tenant?.name || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Permissions</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {user.permissions?.map((perm, index) => (
              <span
                key={index}
                className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        Created: {new Date(user.created_at).toLocaleDateString()}
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SafeIcon icon={FiShield} className="text-yellow-500 text-3xl" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
            <p className="text-gray-600">Manage tenants, users, and system settings</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'tenants'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Tenants
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            System Settings
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">
          {activeTab}
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiPlus} />
          Create {activeTab.slice(0, -1)}
        </motion.button>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'tenants' && tenants.map((tenant) => (
            <TenantCard key={tenant.id} tenant={tenant} />
          ))}
          {activeTab === 'users' && users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
          {activeTab === 'settings' && (
            <div className="col-span-full">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
                <p className="text-gray-600">System settings panel coming soon...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && (
        (activeTab === 'tenants' && tenants.length === 0) ||
        (activeTab === 'users' && users.length === 0)
      ) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon 
            icon={activeTab === 'tenants' ? FiBuilding : FiUsers} 
            className="text-6xl text-gray-300 mb-4 mx-auto" 
          />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-500 mb-4">
            Get started by creating your first {activeTab.slice(0, -1)}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
          >
            Create {activeTab.slice(0, -1)}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default SuperAdminPanel;