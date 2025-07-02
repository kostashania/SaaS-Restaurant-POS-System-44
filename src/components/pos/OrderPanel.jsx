import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiCreditCard, FiSplit, FiX } = FiIcons;

const OrderPanel = () => {
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const { 
    selectedTable, 
    currentOrder, 
    menuItems,
    createOrder,
    addItemToOrder,
    splitBill
  } = usePosStore();
  
  const { currentLocation } = useAuthStore();

  useEffect(() => {
    if (selectedTable && !currentOrder) {
      // Create new order for selected table
      createOrder(currentLocation.id, selectedTable.id);
    }
  }, [selectedTable, currentOrder, createOrder, currentLocation?.id]);

  const handleAddItem = async (menuItem) => {
    if (currentOrder) {
      await addItemToOrder(currentOrder.id, menuItem.id, 1);
    }
  };

  const handleSplitBill = async () => {
    if (selectedItems.length > 0 && currentOrder) {
      // For demo, create split to same table
      await splitBill(currentOrder.id, selectedItems, selectedTable.id);
      setShowSplitModal(false);
      setSelectedItems([]);
    }
  };

  if (!selectedTable) {
    return (
      <div className="w-96 bg-white border-l border-gray-200 flex items-center justify-center">
        <div className="text-center p-8">
          <SafeIcon icon={FiShoppingCart} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Select a Table</h3>
          <p className="text-gray-500">Choose a table to start taking orders</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">
            {selectedTable.name}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSplitModal(true)}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
            >
              <SafeIcon icon={FiSplit} />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Capacity: {selectedTable.capacity} • Status: {selectedTable.status}
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Menu Items</h4>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900">{item.name}</h5>
                  <p className="text-sm text-gray-600">${item.base_price}</p>
                  {item.inventory?.[0] && (
                    <p className="text-xs text-gray-500">
                      Stock: {item.inventory[0].quantity}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAddItem(item)}
                  className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600"
                >
                  <SafeIcon icon={FiPlus} className="text-sm" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Current Order */}
      {currentOrder && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Current Order</h4>
          <div className="space-y-2 mb-4">
            {/* Order items would be displayed here */}
            <div className="text-sm text-gray-500">
              Order #{currentOrder.id.slice(0, 8)}...
            </div>
          </div>
          
          <div className="flex gap-2">
            <button className="flex-1 bg-success-500 text-white py-2 rounded-lg font-medium hover:bg-success-600 flex items-center justify-center gap-2">
              <SafeIcon icon={FiCreditCard} />
              Pay
            </button>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      <AnimatePresence>
        {showSplitModal && (
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
                <h3 className="text-xl font-bold text-gray-900">Split Bill</h3>
                <button
                  onClick={() => setShowSplitModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <SafeIcon icon={FiX} />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Select items to split to a new bill
              </p>
              
              <div className="space-y-2 mb-6">
                {/* Order items would be listed here for selection */}
                <div className="text-sm text-gray-500">
                  No items in current order
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSplitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSplitBill}
                  disabled={selectedItems.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                >
                  Split Bill
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderPanel;