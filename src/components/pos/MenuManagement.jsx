import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiPackage, FiDollarSign, FiTag, FiImage, FiSave, FiX } = FiIcons;

const MenuManagement = () => {
  const [activeTab, setActiveTab] = useState('items');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    category_id: '',
    modifiers: []
  });

  const { menuItems, categories, loadMenu, createMenuItem, updateMenuItem, deleteMenuItem, createCategory } = usePosStore();
  const { currentTenant } = useAuthStore();

  useEffect(() => {
    if (currentTenant?.id) {
      loadMenu(currentTenant.id);
    }
  }, [currentTenant?.id, loadMenu]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingItem) {
      await updateMenuItem(editingItem.id, formData);
    } else {
      await createMenuItem(currentTenant.id, formData);
    }
    
    resetForm();
    loadMenu(currentTenant.id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      base_price: '',
      category_id: '',
      modifiers: []
    });
    setEditingItem(null);
    setShowAddModal(false);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      base_price: item.base_price.toString(),
      category_id: item.category_id || '',
      modifiers: item.modifiers || []
    });
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      await deleteMenuItem(itemId);
      loadMenu(currentTenant.id);
    }
  };

  const MenuItem = ({ item }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600">${item.base_price}</span>
            {item.category && (
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs">
                {categories.find(c => c.id === item.category_id)?.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(item)}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 text-gray-500 hover:text-danger-500 hover:bg-danger-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
      
      {item.modifiers && item.modifiers.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Available Modifiers:</p>
          <div className="flex flex-wrap gap-1">
            {item.modifiers.map((modifier, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                {modifier}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          item.is_available 
            ? 'bg-success-100 text-success-700' 
            : 'bg-danger-100 text-danger-700'
        }`}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </span>
        {item.inventory && item.inventory[0] && (
          <span className="text-sm text-gray-600">
            Stock: {item.inventory[0].quantity}
          </span>
        )}
      </div>
    </motion.div>
  );

  const CategoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Categories</h3>
        <button
          onClick={() => {/* Add category logic */}}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiPlus} />
          Add Category
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-gray-900">{category.name}</h4>
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm">
                {menuItems.filter(item => item.category_id === category.id).length} items
              </span>
            </div>
            {category.description && (
              <p className="text-gray-600 text-sm">{category.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Menu Management</h1>
        <p className="text-gray-600">Manage your restaurant's menu items and categories</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'items'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'categories'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Categories
        </button>
      </div>

      {/* Content */}
      {activeTab === 'items' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Menu Items</h3>
              <p className="text-gray-600">{menuItems.length} items total</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
            >
              <SafeIcon icon={FiPlus} />
              Add Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </div>

          {menuItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <SafeIcon icon={FiPackage} className="text-6xl text-gray-300 mb-4 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Menu Items</h3>
              <p className="text-gray-500 mb-4">Add your first menu item to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
              >
                Add First Item
              </button>
            </motion.div>
          )}
        </div>
      ) : (
        <CategoryTab />
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
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Burger Deluxe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe the item..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>
                  <div className="relative">
                    <SafeIcon icon={FiDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
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
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
                  >
                    <SafeIcon icon={FiSave} />
                    {editingItem ? 'Update' : 'Create'}
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

export default MenuManagement;