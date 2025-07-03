import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiPackage, FiDollarSign } = FiIcons;

const MenuVariants = ({ menuItem, onClose, onUpdate }) => {
  const [variants, setVariants] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price_adjustment: '0',
    sku: '',
    is_available: true,
    sort_order: 0
  });

  useEffect(() => {
    loadVariants();
  }, [menuItem.id]);

  const loadVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_item_variants_pos_v1')
        .select('*')
        .eq('menu_item_id', menuItem.id)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error loading variants:', error);
        return;
      }

      setVariants(data || []);
    } catch (error) {
      console.error('Error loading variants:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const variantData = {
        ...formData,
        menu_item_id: menuItem.id,
        price_adjustment: parseFloat(formData.price_adjustment)
      };

      if (editingVariant) {
        const { error } = await supabase
          .from('menu_item_variants_pos_v1')
          .update(variantData)
          .eq('id', editingVariant.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('menu_item_variants_pos_v1')
          .insert(variantData);

        if (error) throw error;
      }

      // Update menu item to have variants
      if (variants.length === 0) {
        await supabase
          .from('menu_items_pos_v1')
          .update({ has_variants: true })
          .eq('id', menuItem.id);
        
        onUpdate();
      }

      resetForm();
      loadVariants();
    } catch (error) {
      console.error('Error saving variant:', error);
      alert('Error saving variant: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price_adjustment: '0',
      sku: '',
      is_available: true,
      sort_order: variants.length
    });
    setEditingVariant(null);
    setShowAddModal(false);
  };

  const handleEdit = (variant) => {
    setFormData({
      name: variant.name,
      price_adjustment: variant.price_adjustment.toString(),
      sku: variant.sku || '',
      is_available: variant.is_available,
      sort_order: variant.sort_order
    });
    setEditingVariant(variant);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this variant?')) return;

    try {
      const { error } = await supabase
        .from('menu_item_variants_pos_v1')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // If no variants left, update menu item
      if (variants.length === 1) {
        await supabase
          .from('menu_items_pos_v1')
          .update({ has_variants: false })
          .eq('id', menuItem.id);
        
        onUpdate();
      }

      loadVariants();
    } catch (error) {
      console.error('Error deleting variant:', error);
      alert('Error deleting variant: ' + error.message);
    }
  };

  const toggleAvailable = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('menu_item_variants_pos_v1')
        .update({ is_available: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadVariants();
    } catch (error) {
      console.error('Error updating variant:', error);
    }
  };

  const VariantCard = ({ variant }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg p-4 border-2 ${
        variant.is_available ? 'border-gray-200' : 'border-gray-300 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 mb-1">{variant.name}</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className={`font-semibold ${
              variant.price_adjustment >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {variant.price_adjustment >= 0 ? '+' : ''}${variant.price_adjustment}
            </span>
            <span className="text-gray-500">
              = ${(parseFloat(menuItem.base_price) + parseFloat(variant.price_adjustment)).toFixed(2)}
            </span>
          </div>
          {variant.sku && (
            <p className="text-xs text-gray-500 mt-1">SKU: {variant.sku}</p>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleAvailable(variant.id, variant.is_available)}
            className={`px-2 py-1 rounded text-xs font-medium ${
              variant.is_available 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {variant.is_available ? 'Available' : 'Unavailable'}
          </button>
          <button
            onClick={() => handleEdit(variant)}
            className="p-1 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded"
          >
            <SafeIcon icon={FiEdit3} className="text-sm" />
          </button>
          <button
            onClick={() => handleDelete(variant.id)}
            className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
          >
            <SafeIcon icon={FiTrash2} className="text-sm" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  const AddVariantModal = () => (
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
                {editingVariant ? 'Edit Variant' : 'Add Variant'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variant Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Large, Medium, Small"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Adjustment
                </label>
                <div className="relative">
                  <SafeIcon icon={FiDollarSign} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price_adjustment}
                    onChange={(e) => setFormData({ ...formData, price_adjustment: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Final price: ${(parseFloat(menuItem.base_price) + parseFloat(formData.price_adjustment || 0)).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU (Optional)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Stock Keeping Unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                  Available for ordering
                </label>
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
                  {editingVariant ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
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
        className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Variants for {menuItem.name}</h2>
            <p className="text-gray-600">Base price: ${menuItem.base_price}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
            >
              <SafeIcon icon={FiPlus} />
              Add Variant
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <SafeIcon icon={FiX} className="text-xl" />
            </button>
          </div>
        </div>

        {variants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <SafeIcon icon={FiPackage} className="text-6xl text-gray-300 mb-4 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No variants yet</h3>
            <p className="text-gray-500 mb-4">
              Add variants like sizes, colors, or styles for this menu item
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
            >
              Add First Variant
            </button>
          </div>
        )}

        <AddVariantModal />
      </motion.div>
    </motion.div>
  );
};

export default MenuVariants;