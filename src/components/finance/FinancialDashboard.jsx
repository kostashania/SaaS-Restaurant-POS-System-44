import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, FiBarChart3, FiCalendar, FiFilter } = FiIcons;

const FinancialDashboard = () => {
  const [activeScope, setActiveScope] = useState('business');
  const [timeRange, setTimeRange] = useState('month');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    transactionCount: 0
  });
  const { user, currentTenant, isSuperAdmin } = useAuthStore();

  useEffect(() => {
    loadFinancialData();
  }, [activeScope, timeRange, currentTenant?.id, user?.id]);

  const loadFinancialData = async () => {
    try {
      const startDate = getDateRange(timeRange);
      
      // Load transactions
      let query = supabase
        .from('financial_transactions_pos_v1')
        .select(`
          *,
          category:financial_categories_pos_v1(name, color, icon)
        `)
        .eq('scope', activeScope)
        .gte('transaction_date', startDate)
        .order('transaction_date', { ascending: false });

      if (activeScope === 'business' && currentTenant?.id) {
        query = query.eq('tenant_id', currentTenant.id);
      } else if (activeScope === 'personal') {
        query = query.eq('user_id', user.id);
      }

      const { data: transactionData, error: transError } = await query;
      
      if (transError) {
        console.error('Error loading transactions:', transError);
        return;
      }

      setTransactions(transactionData || []);

      // Calculate stats
      const income = transactionData?.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      const expenses = transactionData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      
      setStats({
        totalIncome: income,
        totalExpenses: expenses,
        netProfit: income - expenses,
        transactionCount: transactionData?.length || 0
      });

      // Load categories
      let categoryQuery = supabase
        .from('financial_categories_pos_v1')
        .select('*')
        .eq('scope', activeScope)
        .eq('is_active', true);

      if (activeScope === 'business' && currentTenant?.id) {
        categoryQuery = categoryQuery.eq('tenant_id', currentTenant.id);
      } else if (activeScope === 'personal') {
        categoryQuery = categoryQuery.eq('user_id', user.id);
      }

      const { data: categoryData } = await categoryQuery;
      setCategories(categoryData || []);

    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const getDateRange = (range) => {
    const now = new Date();
    switch (range) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      case 'quarter':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString();
      case 'year':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  };

  const getIncomeExpenseChart = () => {
    const incomeByCategory = {};
    const expenseByCategory = {};

    transactions.forEach(transaction => {
      const categoryName = transaction.category?.name || 'Uncategorized';
      const amount = parseFloat(transaction.amount);

      if (transaction.type === 'income') {
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + amount;
      } else {
        expenseByCategory[categoryName] = (expenseByCategory[categoryName] || 0) + amount;
      }
    });

    return {
      title: { text: 'Income vs Expenses', left: 'center' },
      tooltip: { trigger: 'item' },
      legend: { bottom: 10 },
      series: [
        {
          name: 'Income',
          type: 'pie',
          radius: ['20%', '40%'],
          center: ['25%', '50%'],
          data: Object.entries(incomeByCategory).map(([name, value]) => ({ name, value })),
          itemStyle: { borderColor: '#fff', borderWidth: 2 }
        },
        {
          name: 'Expenses',
          type: 'pie',
          radius: ['20%', '40%'],
          center: ['75%', '50%'],
          data: Object.entries(expenseByCategory).map(([name, value]) => ({ name, value })),
          itemStyle: { borderColor: '#fff', borderWidth: 2 }
        }
      ]
    };
  };

  const getTrendChart = () => {
    const dailyData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.transaction_date).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { income: 0, expenses: 0 };
      }
      
      const amount = parseFloat(transaction.amount);
      if (transaction.type === 'income') {
        dailyData[date].income += amount;
      } else {
        dailyData[date].expenses += amount;
      }
    });

    const sortedDates = Object.keys(dailyData).sort();
    const incomeData = sortedDates.map(date => dailyData[date].income);
    const expenseData = sortedDates.map(date => dailyData[date].expenses);

    return {
      title: { text: 'Financial Trends', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 10 },
      xAxis: { type: 'category', data: sortedDates },
      yAxis: { type: 'value', name: 'Amount ($)' },
      series: [
        {
          name: 'Income',
          type: 'line',
          data: incomeData,
          smooth: true,
          itemStyle: { color: '#22c55e' },
          areaStyle: { color: 'rgba(34, 197, 94, 0.1)' }
        },
        {
          name: 'Expenses',
          type: 'line',
          data: expenseData,
          smooth: true,
          itemStyle: { color: '#ef4444' },
          areaStyle: { color: 'rgba(239, 68, 68, 0.1)' }
        }
      ]
    };
  };

  const StatCard = ({ title, value, icon, color, change }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${
              change >= 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              <SafeIcon icon={change >= 0 ? FiTrendingUp : FiTrendingDown} />
              {Math.abs(change)}% vs last period
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
          <SafeIcon icon={icon} className="text-xl text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {activeScope === 'business' ? 'Business' : 'Personal'} Finance Dashboard
            </h1>
            <p className="text-gray-600">Track income, expenses, and financial performance</p>
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

            {/* Time Range */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Income"
          value={stats.totalIncome}
          icon={FiTrendingUp}
          color="bg-success-500"
          change={12.5}
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          icon={FiTrendingDown}
          color="bg-danger-500"
          change={-8.2}
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          icon={FiDollarSign}
          color={stats.netProfit >= 0 ? "bg-success-500" : "bg-danger-500"}
          change={5.7}
        />
        <StatCard
          title="Transactions"
          value={stats.transactionCount}
          icon={FiBarChart3}
          color="bg-primary-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <SafeIcon icon={FiPieChart} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Category Breakdown</h3>
          </div>
          <ReactECharts option={getIncomeExpenseChart()} style={{ height: '300px' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <SafeIcon icon={FiBarChart3} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Trends</h3>
          </div>
          <ReactECharts option={getTrendChart()} style={{ height: '300px' }} />
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <button className="text-primary-500 hover:text-primary-600 text-sm font-medium">
            View All
          </button>
        </div>
        
        <div className="space-y-3">
          {transactions.slice(0, 10).map((transaction, index) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  <SafeIcon 
                    icon={transaction.type === 'income' ? FiTrendingUp : FiTrendingDown} 
                    className={transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'} 
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{transaction.title}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.category?.name || 'Uncategorized'} • 
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${
                  transaction.type === 'income' ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">{transaction.payment_method}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FinancialDashboard;