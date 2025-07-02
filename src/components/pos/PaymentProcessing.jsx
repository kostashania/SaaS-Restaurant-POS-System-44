import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePosStore } from '../../stores/posStore';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCreditCard, FiDollarSign, FiCheck, FiX, FiRefreshCcw, FiClock, FiTrendingUp, FiAlertCircle } = FiIcons;

const PaymentProcessing = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const { currentLocation } = useAuthStore();

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const loadPaymentsData = () => {
    // Mock payment data for demo
    const mockPayments = [
      {
        id: '1',
        order_id: 'order-123',
        order_number: 'ORD-2024-001-1234567890',
        table_name: 'Table 5',
        amount: 47.85,
        payment_method: 'card',
        status: 'pending',
        transaction_id: null,
        created_at: new Date('2024-01-15T14:30:00'),
        customer_name: 'John Doe'
      },
      {
        id: '2',
        order_id: 'order-124',
        order_number: 'ORD-2024-001-1234567891',
        table_name: 'Table 2',
        amount: 23.50,
        payment_method: 'cash',
        status: 'completed',
        transaction_id: 'TXN-001',
        created_at: new Date('2024-01-15T13:45:00'),
        customer_name: 'Sarah Johnson'
      },
      {
        id: '3',
        order_id: 'order-125',
        order_number: 'ORD-2024-001-1234567892',
        table_name: 'Bar Seat 1',
        amount: 15.99,
        payment_method: 'digital',
        status: 'failed',
        transaction_id: 'TXN-002-FAILED',
        created_at: new Date('2024-01-15T12:20:00'),
        customer_name: 'Mike Chen',
        failure_reason: 'Insufficient funds'
      },
      {
        id: '4',
        order_id: 'order-126',
        order_number: 'ORD-2024-001-1234567893',
        table_name: 'Table 8',
        amount: 89.45,
        payment_method: 'card',
        status: 'completed',
        transaction_id: 'TXN-003',
        created_at: new Date('2024-01-15T11:15:00'),
        customer_name: 'Emily Davis'
      }
    ];
    setPayments(mockPayments);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-700';
      case 'pending': return 'bg-warning-100 text-warning-700';
      case 'failed': return 'bg-danger-100 text-danger-700';
      case 'refunded': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return FiCheck;
      case 'pending': return FiClock;
      case 'failed': return FiX;
      case 'refunded': return FiRefreshCcw;
      default: return FiAlertCircle;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'card': return FiCreditCard;
      case 'cash': return FiDollarSign;
      case 'digital': return FiCreditCard;
      default: return FiDollarSign;
    }
  };

  const processPayment = async (paymentId) => {
    setProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const updatedPayments = payments.map(p => 
      p.id === paymentId 
        ? { 
            ...p, 
            status: 'completed', 
            transaction_id: `TXN-${Date.now()}`,
            processed_at: new Date()
          } 
        : p
    );
    
    setPayments(updatedPayments);
    setProcessing(false);
    setShowProcessModal(false);
    setSelectedPayment(null);
  };

  const refundPayment = async (paymentId) => {
    if (window.confirm('Are you sure you want to refund this payment?')) {
      const updatedPayments = payments.map(p => 
        p.id === paymentId 
          ? { 
              ...p, 
              status: 'refunded', 
              refunded_at: new Date()
            } 
          : p
      );
      setPayments(updatedPayments);
    }
  };

  const retryPayment = async (paymentId) => {
    const updatedPayments = payments.map(p => 
      p.id === paymentId 
        ? { ...p, status: 'pending' } 
        : p
    );
    setPayments(updatedPayments);
  };

  // Calculate payment statistics
  const stats = {
    total: payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0),
    pending: payments.filter(p => p.status === 'pending').length,
    completed: payments.filter(p => p.status === 'completed').length,
    failed: payments.filter(p => p.status === 'failed').length
  };

  const PaymentCard = ({ payment }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <SafeIcon icon={getPaymentMethodIcon(payment.payment_method)} className="text-primary-500" />
            <span className="font-bold text-gray-900">{payment.order_number}</span>
          </div>
          <p className="text-gray-600 text-sm mb-1">{payment.table_name}</p>
          <p className="text-gray-600 text-sm">{payment.customer_name}</p>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">${payment.amount}</p>
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
            <SafeIcon icon={getStatusIcon(payment.status)} className="text-xs" />
            {payment.status}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
        <span>Method: {payment.payment_method}</span>
        <span>{payment.created_at.toLocaleTimeString()}</span>
      </div>

      {payment.transaction_id && (
        <div className="text-xs text-gray-500 mb-3">
          Transaction: {payment.transaction_id}
        </div>
      )}

      {payment.failure_reason && (
        <div className="bg-danger-50 text-danger-700 text-sm p-2 rounded mb-3">
          {payment.failure_reason}
        </div>
      )}

      <div className="flex gap-2">
        {payment.status === 'pending' && (
          <button
            onClick={() => {
              setSelectedPayment(payment);
              setShowProcessModal(true);
            }}
            className="flex-1 bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 text-sm"
          >
            Process Payment
          </button>
        )}
        
        {payment.status === 'failed' && (
          <button
            onClick={() => retryPayment(payment.id)}
            className="flex-1 bg-warning-500 text-white py-2 rounded-lg font-medium hover:bg-warning-600 text-sm"
          >
            Retry Payment
          </button>
        )}
        
        {payment.status === 'completed' && (
          <button
            onClick={() => refundPayment(payment.id)}
            className="flex-1 bg-danger-500 text-white py-2 rounded-lg font-medium hover:bg-danger-600 text-sm"
          >
            Refund
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Processing</h1>
        <p className="text-gray-600">Manage payments, refunds, and transaction history</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiDollarSign} className="text-success-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.total.toFixed(2)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiClock} className="text-warning-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="text-success-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-danger-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiX} className="text-danger-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} />
        ))}
      </div>

      {payments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <SafeIcon icon={FiCreditCard} className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No payments yet</h3>
          <p className="text-gray-500">Payment transactions will appear here</p>
        </motion.div>
      )}

      {/* Process Payment Modal */}
      <AnimatePresence>
        {showProcessModal && selectedPayment && (
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
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiCreditCard} className="text-primary-600 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Process Payment</h3>
                <p className="text-gray-600">
                  Processing payment for {selectedPayment.order_number}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-xl">${selectedPayment.amount}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Method:</span>
                  <span className="font-medium capitalize">{selectedPayment.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">{selectedPayment.table_name}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProcessModal(false);
                    setSelectedPayment(null);
                  }}
                  disabled={processing}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => processPayment(selectedPayment.id)}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <SafeIcon icon={FiCheck} />
                      Process Payment
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentProcessing;