import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUserCheck, FiPlus, FiEdit3, FiTrash2, FiMail, FiShield, FiClock, FiActivity } = FiIcons;

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    role: 'waiter',
    permissions: ['basic_pos']
  });

  const { currentTenant } = useAuthStore();

  useEffect(() => {
    if (currentTenant?.id) {
      loadStaffData();
    }
  }, [currentTenant?.id]);

  const loadStaffData = async () => {
    // Mock staff data for demo
    const mockStaff = [
      {
        id: '1',
        email: 'admin@restaurant.com',
        role: 'admin',
        permissions: ['full_access'],
        is_active: true,
        created_at: new Date('2024-01-01'),
        last_active: new Date('2024-01-15T14:30:00'),
        orders_today: 25,
        total_orders: 1250
      },
      {
        id: '2',
        email: 'manager@restaurant.com',
        role: 'manager',
        permissions: ['manage_staff', 'view_reports', 'pos_access'],
        is_active: true,
        created_at: new Date('2024-01-05'),
        last_active: new Date('2024-01-15T12:15:00'),
        orders_today: 18,
        total_orders: 890
      },
      {
        id: '3',
        email: 'waiter1@restaurant.com',
        role: 'waiter',
        permissions: ['basic_pos'],
        is_active: true,
        created_at: new Date('2024-01-10'),
        last_active: new Date('2024-01-15T13:45:00'),
        orders_today: 12,
        total_orders: 234
      },
      {
        id: '4',
        email: 'chef@restaurant.com',
        role: 'chef',
        permissions: ['kitchen_access', 'inventory_manage'],
        is_active: true,
        created_at: new Date('2024-01-08'),
        last_active: new Date('2024-01-15T11:20:00'),
        orders_today: 0,
        total_orders: 0
      }
    ];
    setStaff(mockStaff);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'waiter': return 'bg-green-100 text-green-700';
      case 'chef': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return FiShield;
      case 'manager': return FiUserCheck;
      case 'waiter': return FiActivity;
      case 'chef': return FiClock;
      default: return FiUserCheck;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingStaff) {
      // Update staff
      const updatedStaff = staff.map(s => 
        s.id === editingStaff.id ? { ...s, ...formData } : s
      );
      setStaff(updatedStaff);
    } else {
      // Create new staff
      const newStaff = {
        id: Date.now().toString(),
        ...formData,
        is_active: true,
        created_at: new Date(),
        last_active: null,
        orders_today: 0,
        total_orders: 0
      };
      setStaff([...staff, newStaff]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      email: '',
      role: 'waiter',
      permissions: ['basic_pos']
    });
    setEditingStaff(null);
    setShowAddModal(false);
  };

  const handleEdit = (staffMember) => {
    setFormData({
      email: staffMember.email,
      role: staffMember.role,
      permissions: staffMember.permissions
    });
    setEditingStaff(staffMember);
    setShowAddModal(true);
  };

  const handleDelete = (staffId) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      setStaff(staff.filter(s => s.id !== staffId));
    }
  };

  const toggleStaffStatus = (staffId) => {
    const updatedStaff = staff.map(s => 
      s.id === staffId ? { ...s, is_active: !s.is_active } : s
    );
    setStaff(updatedStaff);
  };

  const StaffCard = ({ staffMember }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(staffMember.role)}`}>
              <SafeIcon icon={getRoleIcon(staffMember.role)} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{staffMember.email.split('@')[0]}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                {staffMember.role}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <SafeIcon icon={FiMail} className="text-xs" />
            {staffMember.email}
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              staffMember.is_active 
                ? 'bg-success-100 text-success-700' 
                : 'bg-danger-100 text-danger-700'
            }`}>
              {staffMember.is_active ? 'Active' : 'Inactive'}
            </span>
            {staffMember.last_active && (
              <span className="text-gray-500">
                Last active: {staffMember.last_active.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(staffMember)}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => handleDelete(staffMember.id)}
            className="p-2 text-gray-500 hover:text-danger-500 hover:bg-danger-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-t">
        <div>
          <p className="text-2xl font-bold text-primary-600">{staffMember.orders_today}</p>
          <p className="text-xs text-gray-600">Orders Today</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{staffMember.total_orders}</p>
          <p className="text-xs text-gray-600">Total Orders</p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Permissions:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {staffMember.permissions.map((permission, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {permission.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => toggleStaffStatus(staffMember.id)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              staffMember.is_active
                ? 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                : 'bg-success-100 text-success-700 hover:bg-success-200'
            }`}
          >
            {staffMember.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Staff Management</h1>
        <p className="text-gray-600">Manage your restaurant staff and permissions</p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-600">
          {staff.filter(s => s.is_active).length} active staff members
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiPlus} />
          Add Staff Member
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember) => (
          <StaffCard key={staffMember.id} staffMember={staffMember} />
        ))}
      </div>

      {staff.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiUserCheck} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No staff members yet</h3>
          <p className="text-gray-500 mb-4">Add your first staff member to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
          >
            Add First Staff Member
          </button>
        </motion.div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
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
                  {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiTrash2} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="staff@restaurant.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const role = e.target.value;
                      let permissions = ['basic_pos'];
                      
                      switch (role) {
                        case 'admin':
                          permissions = ['full_access'];
                          break;
                        case 'manager':
                          permissions = ['manage_staff', 'view_reports', 'pos_access'];
                          break;
                        case 'chef':
                          permissions = ['kitchen_access', 'inventory_manage'];
                          break;
                        default:
                          permissions = ['basic_pos'];
                      }
                      
                      setFormData({ ...formData, role, permissions });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="waiter">Waiter</option>
                    <option value="chef">Chef</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    {formData.permissions.map((permission, index) => (
                      <span key={index} className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                        {permission.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    {editingStaff ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffManagement;