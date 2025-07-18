import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiTag, FiSave, FiX, FiCheck } = FiIcons;

const CategoryManagement = () => {
  const [activeScope, setActiveScope] = useState('business');
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useInMemory, setUseInMemory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    color: '#3b82f6',
    icon: 'FiDollarSign',
    description: ''
  });

  const { user, currentTenant, isOfflineDemo } = useAuthStore();

  // In-memory storage for when database is not available
  const [inMemoryCategories, setInMemoryCategories] = useState([
    {
      id: '1',
      name: 'Restaurant Sales',
      type: 'income',
      color: '#22c55e',
      icon: 'FiDollarSign',
      description: 'Revenue from food and beverage sales',
      is_active: true,
      scope: 'business',
      user_id: 'demo'
    },
    {
      id: '2',
      name: 'Food Supplies',
      type: 'expense',
      color: '#ef4444',
      icon: 'FiShoppingBag',
      description: 'Ingredients and food supplies',
      is_active: true,
      scope: 'business',
      user_id: 'demo'
    },
    {
      id: '3',
      name: 'Salary Income',
      type: 'income',
      color: '#3b82f6',
      icon: 'FiBriefcase',
      description: 'Personal salary and wages',
      is_active: true,
      scope: 'personal',
      user_id: 'demo'
    },
    {
      id: '4',
      name: 'Groceries',
      type: 'expense',
      color: '#f59e0b',
      icon: 'FiShoppingCart',
      description: 'Personal grocery expenses',
      is_active: true,
      scope: 'personal',
      user_id: 'demo'
    }
  ]);

  const availableIcons = [
    'FiDollarSign', 'FiShoppingBag', 'FiCoffee', 'FiHome', 'FiCar', 'FiHeart',
    'FiShoppingCart', 'FiUsers', 'FiTool', 'FiBriefcase', 'FiGift', 'FiMusic',
    'FiBook', 'FiCamera', 'FiPhone', 'FiWifi', 'FiZap', 'FiDroplet', 'FiSun',
    'FiUmbrella', 'FiAirplay', 'FiMonitor', 'FiHeadphones', 'FiGamepad2'
  ];

  const predefinedColors = [
    '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#64748b'
  ];

  // Test database connection on mount
  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    if (isOfflineDemo) {
      setUseInMemory(true);
      setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
      return;
    }

    try {
      const { error } = await supabase
        .from('financial_categories_pos_v1')
        .select('id')
        .limit(1);

      if (error) {
        console.log('Database not available, using in-memory storage');
        setUseInMemory(true);
        setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
      } else {
        setUseInMemory(false);
        loadCategories();
      }
    } catch (error) {
      console.log('Database connection failed, using in-memory storage');
      setUseInMemory(true);
      setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
    }
  };

  const loadCategories = useCallback(async () => {
    if (!user?.id || useInMemory || isOfflineDemo) {
      setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('financial_categories_pos_v1')
        .select('*')
        .eq('scope', activeScope)
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
        setUseInMemory(true);
      } else {
        setCategories(data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(inMemoryCategories.filter(cat => cat.scope === activeScope));
      setUseInMemory(true);
    } finally {
      setLoading(false);
    }
  }, [activeScope, user?.id, useInMemory, isOfflineDemo, inMemoryCategories]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (useInMemory || isOfflineDemo) {
        // Handle in-memory storage
        const newCategory = {
          id: Date.now().toString(),
          ...formData,
          scope: activeScope,
          is_active: true,
          created_at: new Date().toISOString(),
          user_id: user?.id || 'demo'
        };

        if (editingCategory) {
          const updatedCategories = inMemoryCategories.map(cat =>
            cat.id === editingCategory.id ? { ...cat, ...formData } : cat
          );
          setInMemoryCategories(updatedCategories);
          setCategories(updatedCategories.filter(cat => cat.scope === activeScope));
        } else {
          const updatedCategories = [...inMemoryCategories, newCategory];
          setInMemoryCategories(updatedCategories);
          setCategories(updatedCategories.filter(cat => cat.scope === activeScope));
        }
      } else {
        // Handle database storage
        const categoryData = {
          ...formData,
          scope: activeScope,
          user_id: user.id
        };

        if (editingCategory) {
          const { error } = await supabase
            .from('financial_categories_pos_v1')
            .update(categoryData)
            .eq('id', editingCategory.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('financial_categories_pos_v1')
            .insert(categoryData);

          if (error) throw error;
        }

        loadCategories();
      }

      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      color: '#3b82f6',
      icon: 'FiDollarSign',
      description: ''
    });
    setEditingCategory(null);
    setShowAddModal(false);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      if (useInMemory || isOfflineDemo) {
        const updatedCategories = inMemoryCategories.filter(cat => cat.id !== id);
        setInMemoryCategories(updatedCategories);
        setCategories(updatedCategories.filter(cat => cat.scope === activeScope));
      } else {
        const { error } = await supabase
          .from('financial_categories_pos_v1')
          .delete()
          .eq('id', id);

        if (error) throw error;
        loadCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category: ' + (error.message || 'Unknown error'));
    }
  };

  const toggleActive = async (id, isActive) => {
    try {
      if (useInMemory || isOfflineDemo) {
        const updatedCategories = inMemoryCategories.map(cat =>
          cat.id === id ? { ...cat, is_active: !isActive } : cat
        );
        setInMemoryCategories(updatedCategories);
        setCategories(updatedCategories.filter(cat => cat.scope === activeScope));
      } else {
        const { error } = await supabase
          .from('financial_categories_pos_v1')
          .update({ is_active: !isActive })
          .eq('id', id);

        if (error) throw error;
        loadCategories();
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const CategoryCard = ({ category }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
        !category.is_active ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category.color + '20' }}
          >
            <SafeIcon
              icon={FiIcons[category.icon] || FiTag}
              className="text-xl"
              style={{ color: category.color }}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{category.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                category.type === 'income'
                  ? 'bg-success-100 text-success-700'
                  : 'bg-danger-100 text-danger-700'
              }`}>
                {category.type.toUpperCase()}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                category.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {category.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {category.description && (
              <p className="text-gray-600 text-sm">{category.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleActive(category.id, category.is_active)}
            className={`p-2 rounded-lg ${
              category.is_active
                ? 'text-gray-500 hover:text-orange-500 hover:bg-orange-50'
                : 'text-gray-500 hover:text-green-500 hover:bg-green-50'
            }`}
            title={category.is_active ? 'Deactivate' : 'Activate'}
          >
            <SafeIcon icon={category.is_active ? FiX : FiCheck} />
          </button>
          <button
            onClick={() => handleEdit(category)}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => handleDelete(category.id)}
            className="p-2 text-gray-500 hover:text-danger-500 hover:bg-danger-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const AddCategoryModal = () => (
    <AnimatePresence>
      {showAddModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && resetForm()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add Category'}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Category name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                  disabled={loading}
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex gap-2 mb-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={loading}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-lg"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {availableIcons.map((iconName) => {
                    const IconComponent = FiIcons[iconName];
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon: iconName }))}
                        className={`p-2 rounded-lg border ${
                          formData.icon === iconName
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={loading}
                      >
                        {IconComponent && <IconComponent className="text-lg" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional description"
                  rows="2"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <SafeIcon icon={FiSave} />
                  )}
                  {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {(useInMemory || isOfflineDemo) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Demo Mode:</strong> Using in-memory storage. Changes will be lost on refresh.
          </p>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {activeScope === 'business' ? 'Business' : 'Personal'} Categories
            </h1>
            <p className="text-gray-600">Organize your income and expense categories</p>
          </div>

          <div className="flex gap-4">
            {/* Scope Toggle */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setActiveScope('business')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeScope === 'business'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Business
              </button>
              <button
                onClick={() => setActiveScope('personal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeScope === 'personal'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Personal
              </button>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
            >
              <SafeIcon icon={FiPlus} />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Income Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <SafeIcon icon={FiIcons.FiTrendingUp} className="text-success-500" />
          Income Categories ({incomeCategories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {incomeCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        {incomeCategories.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl">
            <p className="text-gray-500">No income categories yet</p>
          </div>
        )}
      </div>

      {/* Expense Categories */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <SafeIcon icon={FiIcons.FiTrendingDown} className="text-danger-500" />
          Expense Categories ({expenseCategories.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {expenseCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
        {expenseCategories.length === 0 && (
          <div className="text-center py-8 bg-white rounded-xl">
            <p className="text-gray-500">No expense categories yet</p>
          </div>
        )}
      </div>

      {categories.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiTag} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No categories yet</h3>
          <p className="text-gray-500 mb-4">Create your first category to organize transactions</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
          >
            Add First Category
          </button>
        </motion.div>
      )}

      <AddCategoryModal />
    </div>
  );
};

export default CategoryManagement;