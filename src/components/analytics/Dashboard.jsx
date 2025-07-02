import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ReactECharts from 'echarts-for-react';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDollarSign, FiUsers, FiTrendingUp, FiClock, FiBarChart3, FiPieChart } = FiIcons;

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    peakHour: '12:00 PM'
  });

  useEffect(() => {
    // Mock analytics data
    setAnalytics({
      totalSales: 15420.50,
      totalOrders: 142,
      avgOrderValue: 108.60,
      peakHour: '7:30 PM'
    });
  }, [timeRange]);

  const salesChartOptions = {
    title: {
      text: 'Sales Over Time',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM']
    },
    yAxis: {
      type: 'value',
      name: 'Sales ($)'
    },
    series: [{
      name: 'Sales',
      type: 'line',
      smooth: true,
      data: [320, 450, 680, 1200, 1450, 980, 650, 420, 890, 1200, 1650, 1100],
      itemStyle: {
        color: '#3b82f6'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(59, 130, 246, 0.3)'
          }, {
            offset: 1, color: 'rgba(59, 130, 246, 0.05)'
          }]
        }
      }
    }]
  };

  const menuItemsChartOptions = {
    title: {
      text: 'Top Menu Items',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    series: [{
      name: 'Orders',
      type: 'pie',
      radius: '80%',
      data: [
        { value: 35, name: 'Burger Deluxe' },
        { value: 28, name: 'Caesar Salad' },
        { value: 22, name: 'Fish & Chips' },
        { value: 18, name: 'Pasta Carbonara' },
        { value: 15, name: 'Chicken Wings' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
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
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center gap-1 ${
              change > 0 ? 'text-success-600' : 'text-danger-600'
            }`}>
              <SafeIcon icon={FiTrendingUp} className={change < 0 ? 'rotate-180' : ''} />
              {Math.abs(change)}% vs yesterday
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights for your restaurant</p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Sales"
          value={`$${analytics.totalSales.toLocaleString()}`}
          icon={FiDollarSign}
          color="bg-success-500"
          change={12.5}
        />
        <StatCard
          title="Total Orders"
          value={analytics.totalOrders}
          icon={FiUsers}
          color="bg-primary-500"
          change={8.2}
        />
        <StatCard
          title="Avg Order Value"
          value={`$${analytics.avgOrderValue}`}
          icon={FiTrendingUp}
          color="bg-warning-500"
          change={-2.1}
        />
        <StatCard
          title="Peak Hour"
          value={analytics.peakHour}
          icon={FiClock}
          color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <SafeIcon icon={FiBarChart3} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
          </div>
          <ReactECharts option={salesChartOptions} style={{ height: '300px' }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-4">
            <SafeIcon icon={FiPieChart} className="text-primary-500" />
            <h3 className="text-lg font-semibold text-gray-900">Popular Items</h3>
          </div>
          <ReactECharts option={menuItemsChartOptions} style={{ height: '300px' }} />
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 shadow-lg mt-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '2 min ago', action: 'Order #142 completed', table: 'Table 5' },
            { time: '5 min ago', action: 'New order received', table: 'Table 2' },
            { time: '8 min ago', action: 'Payment processed', table: 'Table 8' },
            { time: '12 min ago', action: 'Order #139 started', table: 'Table 1' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="text-gray-900 font-medium">{activity.action}</p>
                <p className="text-gray-500 text-sm">{activity.table}</p>
              </div>
              <span className="text-gray-400 text-sm">{activity.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;