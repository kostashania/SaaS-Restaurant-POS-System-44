import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUsers, FiPlus, FiSearch, FiEdit3, FiTrash2, FiMail, FiPhone, FiStar, FiCalendar, FiDollarSign } = FiIcons;

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: {}
  });

  const { loadCustomers, createCustomer, updateCustomer, deleteCustomer } = usePosStore();
  const { currentTenant } = useAuthStore();

  useEffect(() => {
    if (currentTenant?.id) {
      loadCustomersData();
    }
  }, [currentTenant?.id]);

  const loadCustomersData = async () => {
    // Mock customer data for demo
    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        loyalty_points: 1250,
        total_visits: 15,
        total_spent: 487.50,
        last_visit: new Date('2024-01-15'),
        preferences: { dietary: ['vegetarian'], favorite_table: 'Table 5' }
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '(555) 987-6543',
        loyalty_points: 890,
        total_visits: 8,
        total_spent: 324.80,
        last_visit: new Date('2024-01-12'),
        preferences: { dietary: ['gluten-free'], favorite_items: ['Caesar Salad', 'Fish & Chips'] }
      },
      {
        id: '3',
        name: 'Mike Chen',
        email: 'mike@example.com',
        phone: '(555) 456-7890',
        loyalty_points: 2100,
        total_visits: 25,
        total_spent: 892.30,
        last_visit: new Date('2024-01-14'),
        preferences: { favorite_table: 'Bar Seat 2', notes: 'Prefers spicy food' }
      }
    ];
    setCustomers(mockCustomers);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingCustomer) {
      // Update customer
      const updatedCustomers = customers.map(c => 
        c.id === editingCustomer.id ? { ...c, ...formData } : c
      );
      setCustomers(updatedCustomers);
    } else {
      // Create new customer
      const newCustomer = {
        id: Date.now().toString(),
        ...formData,
        loyalty_points: 0,
        total_visits: 0,
        total_spent: 0,
        last_visit: null,
        created_at: new Date()
      };
      setCustomers([...customers, newCustomer]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      preferences: {}
    });
    setEditingCustomer(null);
    setShowAddModal(false);
  };

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      preferences: customer.preferences
    });
    setEditingCustomer(customer);
    setShowAddModal(true);
  };

  const handleDelete = (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      setCustomers(customers.filter(c => c.id !== customerId));
    }
  };

  const CustomerCard = ({ customer }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{customer.name}</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <SafeIcon icon={FiMail} className="text-xs" />
              {customer.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <SafeIcon icon={FiPhone} className="text-xs" />
              {customer.phone}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(customer)}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => handleDelete(customer.id)}
            className="p-2 text-gray-500 hover:text-danger-500 hover:bg-danger-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-warning-500 mb-1">
            <SafeIcon icon={FiStar} className="text-sm" />
            <span className="font-bold">{customer.loyalty_points}</span>
          </div>
          <p className="text-xs text-gray-600">Points</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-primary-500 mb-1">
            <SafeIcon icon={FiCalendar} className="text-sm" />
            <span className="font-bold">{customer.total_visits}</span>
          </div>
          <p className="text-xs text-gray-600">Visits</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-success-500 mb-1">
            <SafeIcon icon={FiDollarSign} className="text-sm" />
            <span className="font-bold">{customer.total_spent}</span>
          </div>
          <p className="text-xs text-gray-600">Spent</p>
        </div>
      </div>

      <div className="pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Last visit:</span>
          <span className="font-medium text-gray-900">
            {customer.last_visit ? customer.last_visit.toLocaleDateString() : 'Never'}
          </span>
        </div>
        
        {customer.preferences && Object.keys(customer.preferences).length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Preferences:</p>
            <div className="flex flex-wrap gap-1">
              {customer.preferences.dietary && customer.preferences.dietary.map((diet, index) => (
                <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                  {diet}
                </span>
              ))}
              {customer.preferences.favorite_table && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                  {customer.preferences.favorite_table}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
        <p className="text-gray-600">Manage customer profiles and loyalty programs</p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            />
          </div>
          <div className="text-sm text-gray-600">
            {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiPlus} />
          Add Customer
        </button>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiUsers} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
            >
              Add First Customer
            </button>
          )}
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
                  {editingCustomer ? 'Edit Customer' : 'Add Customer'}
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
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Customer name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
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
                    {editingCustomer ? 'Update' : 'Create'}
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

export default CustomerManagement;