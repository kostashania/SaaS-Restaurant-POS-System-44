import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiEdit3, FiTrash2, FiSearch, FiFilter, FiDownload, FiUpload, FiCalendar, FiTag, FiDollarSign, FiSave, FiX } = FiIcons;

const TransactionManagement = () => {
  const [activeScope, setActiveScope] = useState('business');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    type: 'expense',
    category_id: '',
    payment_method: 'cash',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    tags: []
  });

  const { user, currentTenant } = useAuthStore();

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [activeScope, currentTenant?.id, user?.id]);

  const loadTransactions = async () => {
    try {
      let query = supabase
        .from('financial_transactions_pos_v1')
        .select(`
          *,
          category:financial_categories_pos_v1(name, color, icon)
        `)
        .eq('scope', activeScope)
        .order('transaction_date', { ascending: false });

      if (activeScope === 'business' && currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      } else if (activeScope === 'personal') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadCategories = async () => {
    try {
      let query = supabase
        .from('financial_categories_pos_v1')
        .select('*')
        .eq('scope', activeScope)
        .eq('is_active', true)
        .order('name');

      if (activeScope === 'business' && currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      } else if (activeScope === 'personal') {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        scope: activeScope,
        transaction_date: new Date(formData.transaction_date).toISOString()
      };

      if (activeScope === 'business') {
        transactionData.tenant_id = currentTenant.id;
      } else {
        transactionData.user_id = user.id;
      }

      if (editingTransaction) {
        const { error } = await supabase
          .from('financial_transactions_pos_v1')
          .update(transactionData)
          .eq('id', editingTransaction.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('financial_transactions_pos_v1')
          .insert(transactionData);

        if (error) throw error;
      }

      resetForm();
      loadTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Error saving transaction: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      type: 'expense',
      category_id: '',
      payment_method: 'cash',
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      tags: []
    });
    setEditingTransaction(null);
    setShowAddModal(false);
  };

  const handleEdit = (transaction) => {
    setFormData({
      title: transaction.title,
      description: transaction.description || '',
      amount: transaction.amount.toString(),
      type: transaction.type,
      category_id: transaction.category_id || '',
      payment_method: transaction.payment_method,
      transaction_date: new Date(transaction.transaction_date).toISOString().split('T')[0],
      reference_number: transaction.reference_number || '',
      tags: transaction.tags || []
    });
    setEditingTransaction(transaction);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const { error } = await supabase
        .from('financial_transactions_pos_v1')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction: ' + error.message);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || transaction.type === filterType;
    const matchesCategory = filterCategory === 'all' || transaction.category_id === filterCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const TransactionCard = ({ transaction }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
          }`}>
            <SafeIcon 
              icon={FiIcons[transaction.category?.icon] || FiDollarSign} 
              className={transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'} 
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{transaction.title}</h3>
            {transaction.description && (
              <p className="text-gray-600 text-sm mb-2">{transaction.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{transaction.category?.name || 'Uncategorized'}</span>
              <span>{new Date(transaction.transaction_date).toLocaleDateString()}</span>
              <span className="capitalize">{transaction.payment_method}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="text-right mr-4">
            <p className={`text-2xl font-bold ${
              transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
            }`}>
              {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-xs font-medium px-2 py-1 rounded ${
              transaction.type === 'income' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
            }`}>
              {transaction.type.toUpperCase()}
            </p>
          </div>
          
          <button
            onClick={() => handleEdit(transaction)}
            className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
          >
            <SafeIcon icon={FiEdit3} />
          </button>
          <button
            onClick={() => handleDelete(transaction.id)}
            className="p-2 text-gray-500 hover:text-danger-500 hover:bg-danger-50 rounded-lg"
          >
            <SafeIcon icon={FiTrash2} />
          </button>
        </div>
      </div>

      {transaction.reference_number && (
        <div className="text-xs text-gray-500 mb-2">
          Reference: {transaction.reference_number}
        </div>
      )}

      {transaction.tags && transaction.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {transaction.tags.map((tag, index) => (
            <span
              key={index}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );

  const AddTransactionModal = () => (
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
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Transaction title"
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
                  placeholder="Optional description"
                  rows="2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
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
                  <option value="">Select category</option>
                  {categories
                    .filter(cat => cat.type === formData.type)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="digital">Digital Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Optional reference number"
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
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center justify-center gap-2"
                >
                  <SafeIcon icon={FiSave} />
                  {editingTransaction ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {activeScope === 'business' ? 'Business' : 'Personal'} Transactions
            </h1>
            <p className="text-gray-600">Manage your income and expenses</p>
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
              Add Transaction
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTransactions.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiDollarSign} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {searchTerm ? 'No transactions found' : 'No transactions yet'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Add your first transaction to get started'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
            >
              Add First Transaction
            </button>
          )}
        </motion.div>
      )}

      <AddTransactionModal />
    </div>
  );
};

export default TransactionManagement;