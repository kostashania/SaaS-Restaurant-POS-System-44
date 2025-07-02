import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiClock, FiCheck, FiAlertTriangle, FiChef } = FiIcons;

const KitchenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const { setupRealtime } = usePosStore();

  useEffect(() => {
    // Setup real-time order updates
    setupRealtime('current-location-id');
    
    // Mock orders for demo
    setOrders([
      {
        id: '1',
        table_name: 'Table 5',
        items: [
          { name: 'Burger Deluxe', quantity: 2, modifiers: ['No Onions'] },
          { name: 'Fries', quantity: 1, modifiers: [] }
        ],
        status: 'pending',
        created_at: new Date(Date.now() - 5 * 60000),
        estimated_time: 15
      },
      {
        id: '2',
        table_name: 'Table 2',
        items: [
          { name: 'Caesar Salad', quantity: 1, modifiers: ['Extra Dressing'] }
        ],
        status: 'preparing',
        created_at: new Date(Date.now() - 10 * 60000),
        estimated_time: 8
      }
    ]);
  }, [setupRealtime]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning-500';
      case 'preparing': return 'bg-primary-500';
      case 'ready': return 'bg-success-500';
      default: return 'bg-gray-500';
    }
  };

  const getTimeSinceOrder = (createdAt) => {
    const minutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);
    return `${minutes}m ago`;
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <SafeIcon icon={FiChef} className="text-primary-500" />
          Kitchen Display
        </h1>
        <p className="text-gray-600">Real-time order management for kitchen staff</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-primary-500"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {order.table_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Order #{order.id} • {getTimeSinceOrder(order.created_at)}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              {order.items.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-sm font-medium">
                      x{item.quantity}
                    </span>
                  </div>
                  {item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-600">
                      {item.modifiers.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <SafeIcon icon={FiClock} />
                <span>Est. {order.estimated_time} min</span>
              </div>
              {order.estimated_time > 20 && (
                <div className="flex items-center gap-1 text-warning-600">
                  <SafeIcon icon={FiAlertTriangle} className="text-sm" />
                  <span className="text-sm">Delayed</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {order.status === 'pending' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  className="flex-1 bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600"
                >
                  Start Cooking
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="flex-1 bg-success-500 text-white py-2 rounded-lg font-medium hover:bg-success-600 flex items-center justify-center gap-2"
                >
                  <SafeIcon icon={FiCheck} />
                  Ready
                </button>
              )}
              {order.status === 'ready' && (
                <div className="flex-1 bg-success-100 text-success-700 py-2 rounded-lg font-medium text-center">
                  Ready for Pickup
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {orders.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiChef} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders</h3>
          <p className="text-gray-500">Orders will appear here in real-time</p>
        </motion.div>
      )}
    </div>
  );
};

export default KitchenDisplay;