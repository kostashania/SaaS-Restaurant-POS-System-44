import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShield, FiUsers, FiBuilding, FiPlus, FiEdit, FiTrash2, FiEye, FiX, FiSave } = FiIcons;

const SuperAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tenants') {
        const { data, error } = await supabase
          .from('tenants_pos_v1')
          .select(`
            *,
            staff_count:staff_pos_v1(count),
            locations_count:locations_pos_v1(count)
          `);
        
        if (error) {
          console.error('Error loading tenants:', error);
        } else {
          setTenants(data || []);
        }
      } else if (activeTab === 'users') {
        const { data, error } = await supabase
          .from('staff_pos_v1')
          .select(`
            *,
            tenant:tenant_id(name, plan)
          `);
        
        if (error) {
          console.error('Error loading users:', error);
        } else {
          setUsers(data || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      if (activeTab === 'tenants') {
        const { data, error } = await supabase
          .from('tenants_pos_v1')
          .insert({
            name: formData.name || 'New Tenant',
            plan: formData.plan || 'basic',
            settings: {}
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating tenant:', error);
          alert('Error creating tenant: ' + error.message);
        } else {
          // Create a default location for the tenant
          await supabase
            .from('locations_pos_v1')
            .insert({
              tenant_id: data.id,
              name: 'Main Location',
              address: {}
            });
          
          loadData();
          setShowCreateModal(false);
          setFormData({});
        }
      } else if (activeTab === 'users') {
        const { error } = await supabase
          .from('staff_pos_v1')
          .insert({
            tenant_id: formData.tenant_id,
            email: formData.email,
            role: formData.role || 'waiter',
            permissions: formData.permissions || ['basic_pos'],
            is_active: true
          });

        if (error) {
          console.error('Error creating user:', error);
          alert('Error creating user: ' + error.message);
        } else {
          loadData();
          setShowCreateModal(false);
          setFormData({});
        }
      }
    } catch (error) {
      console.error('Error in handleCreate:', error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowCreateModal(true);
  };

  const handleUpdate = async () => {
    try {
      if (activeTab === 'tenants') {
        const { error } = await supabase
          .from('tenants_pos_v1')
          .update({
            name: formData.name,
            plan: formData.plan,
            settings: formData.settings || {}
          })
          .eq('id', editingItem.id);

        if (error) {
          console.error('Error updating tenant:', error);
          alert('Error updating tenant: ' + error.message);
        } else {
          loadData();
          setShowCreateModal(false);
          setEditingItem(null);
          setFormData({});
        }
      } else if (activeTab === 'users') {
        const { error } = await supabase
          .from('staff_pos_v1')
          .update({
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions,
            is_active: formData.is_active
          })
          .eq('id', editingItem.id);

        if (error) {
          console.error('Error updating user:', error);
          alert('Error updating user: ' + error.message);
        } else {
          loadData();
          setShowCreateModal(false);
          setEditingItem(null);
          setFormData({});
        }
      }
    } catch (error) {
      console.error('Error in handleUpdate:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const table = activeTab === 'tenants' ? 'tenants_pos_v1' : 'staff_pos_v1';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting:', error);
        alert('Error deleting: ' + error.message);
      } else {
        loadData();
      }
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
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
          <button 
            onClick={() => handleEdit(tenant)}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit} />
          </button>
          <button 
            onClick={() => handleDelete(tenant.id)}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Staff</p>
          <p className="text-lg font-semibold text-gray-900">
            {tenant.staff_count?.[0]?.count || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-600">Locations</p>
          <p className="text-lg font-semibold text-gray-900">
            {tenant.locations_count?.[0]?.count || 0}
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
          <button 
            onClick={() => handleEdit(user)}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded"
          >
            <SafeIcon icon={FiEdit} />
          </button>
          <button 
            onClick={() => handleDelete(user.id)}
            className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
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

  const CreateModal = () => (
    <AnimatePresence>
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit' : 'Create'} {activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                  setFormData({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'tenants' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter tenant name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan
                    </label>
                    <select
                      value={formData.plan || 'basic'}
                      onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="basic">Basic</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role || 'waiter'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="waiter">Waiter</option>
                      <option value="chef">Chef</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenant
                    </label>
                    <select
                      value={formData.tenant_id || ''}
                      onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select tenant</option>
                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingItem(null);
                  setFormData({});
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={editingItem ? handleUpdate : handleCreate}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
              >
                <SafeIcon icon={FiSave} />
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
            Tenants ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
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

      <CreateModal />
    </div>
  );
};

export default SuperAdminPanel;