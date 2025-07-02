import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiUsers, FiClock, FiCheck, FiAlertCircle } = FiIcons;

const TableGrid = () => {
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(2);
  
  const { 
    tables, 
    loadTables, 
    createAdHocTable, 
    updateTableStatus,
    selectTable 
  } = usePosStore();
  
  const { currentLocation } = useAuthStore();

  useEffect(() => {
    if (currentLocation?.id) {
      loadTables(currentLocation.id);
    }
  }, [currentLocation?.id, loadTables]);

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-danger-500 text-white';
      case 'reserved': return 'bg-warning-500 text-white';
      default: return 'bg-success-500 text-white';
    }
  };

  const getTableStatusIcon = (status) => {
    switch (status) {
      case 'occupied': return FiClock;
      case 'reserved': return FiAlertCircle;
      default: return FiCheck;
    }
  };

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    const { error } = await createAdHocTable(
      currentLocation.id,
      newTableName,
      newTableCapacity
    );

    if (!error) {
      setShowAddTable(false);
      setNewTableName('');
      setNewTableCapacity(2);
    }
  };

  const handleTableClick = async (table) => {
    selectTable(table);
    
    // If table is ready, mark as occupied
    if (table.status === 'ready') {
      await updateTableStatus(table.id, 'occupied');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
          <p className="text-gray-600">
            {currentLocation?.name || 'Current Location'} - {tables.length} Tables
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddTable(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiPlus} />
          Add Table
        </motion.button>
      </div>

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddTable && (
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
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Table</h3>
              
              <form onSubmit={handleCreateTable} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g., Pop-up #1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={newTableCapacity}
                    onChange={(e) => setNewTableCapacity(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min="1"
                    max="20"
                    required
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddTable(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                  >
                    Add Table
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables.map((table) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTableClick(table)}
            className={`
              relative p-4 rounded-xl cursor-pointer transition-all duration-300 shadow-lg
              ${getTableStatusColor(table.status)}
              hover:shadow-xl
            `}
          >
            {table.is_ad_hoc && (
              <div className="absolute -top-2 -right-2 bg-warning-500 text-white text-xs px-2 py-1 rounded-full">
                Ad-hoc
              </div>
            )}
            
            <div className="text-center">
              <SafeIcon 
                icon={getTableStatusIcon(table.status)} 
                className="text-2xl mb-2 mx-auto" 
              />
              
              <h3 className="font-bold text-lg mb-1">{table.name}</h3>
              
              <div className="flex items-center justify-center gap-1 text-sm opacity-90">
                <SafeIcon icon={FiUsers} className="text-xs" />
                <span>{table.capacity}</span>
              </div>
              
              <div className="mt-2 text-xs opacity-75 capitalize">
                {table.status}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiUsers} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tables Yet</h3>
          <p className="text-gray-500 mb-4">Add your first table to get started</p>
          <button
            onClick={() => setShowAddTable(true)}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600"
          >
            Add First Table
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TableGrid;