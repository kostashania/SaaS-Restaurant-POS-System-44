import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSettings, FiSave, FiRefreshCw, FiShield, FiBell, FiDollarSign, FiPrinter, FiWifi } = FiIcons;

const AdvancedSettings = () => {
  const { currentTenant, isOfflineDemo } = useAuthStore();
  const [settings, setSettings] = useState({
    // General Settings
    restaurant_name: currentTenant?.name || 'Demo Restaurant',
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    
    // POS Settings
    auto_print_receipts: true,
    auto_print_kitchen_tickets: true,
    enable_tips: true,
    default_tip_percentage: 18,
    tax_rate: 8.5,
    
    // Payment Settings
    payment_methods: ['cash', 'card', 'digital'],
    stripe_enabled: false,
    square_enabled: false,
    
    // Notifications
    low_inventory_alerts: true,
    new_order_sound: true,
    kitchen_display_alerts: true,
    
    // Security
    session_timeout: 60,
    require_manager_approval: false,
    enable_audit_log: true,
    
    // Integrations
    loyalty_program_enabled: true,
    online_ordering_enabled: false,
    delivery_integration: false
  });

  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async () => {
    // In a real app, this would save to the database
    console.log('Saving settings:', settings);
    // Show success notification
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to default settings
      setSettings({
        ...settings,
        auto_print_receipts: true,
        auto_print_kitchen_tickets: true,
        enable_tips: true,
        default_tip_percentage: 18,
        tax_rate: 8.5
      });
    }
  };

  const SettingCard = ({ title, children, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <SafeIcon icon={icon} className="text-primary-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </motion.div>
  );

  const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <label className="font-medium text-gray-900">{label}</label>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Restaurant Information" icon={FiSettings}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name
            </label>
            <input
              type="text"
              value={settings.restaurant_name}
              onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Tax & Tips" icon={FiDollarSign}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="50"
              value={settings.tax_rate}
              onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <ToggleSwitch
            label="Enable Tips"
            checked={settings.enable_tips}
            onChange={(checked) => setSettings({ ...settings, enable_tips: checked })}
            description="Allow customers to add tips to their orders"
          />
          
          {settings.enable_tips && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Tip Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.default_tip_percentage}
                onChange={(e) => setSettings({ ...settings, default_tip_percentage: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </SettingCard>
    </div>
  );

  const renderPOSSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Receipt & Printing" icon={FiPrinter}>
        <div className="space-y-2">
          <ToggleSwitch
            label="Auto-print Receipts"
            checked={settings.auto_print_receipts}
            onChange={(checked) => setSettings({ ...settings, auto_print_receipts: checked })}
            description="Automatically print customer receipts when orders are completed"
          />
          
          <ToggleSwitch
            label="Auto-print Kitchen Tickets"
            checked={settings.auto_print_kitchen_tickets}
            onChange={(checked) => setSettings({ ...settings, auto_print_kitchen_tickets: checked })}
            description="Automatically send orders to kitchen printer"
          />
        </div>
      </SettingCard>

      <SettingCard title="Notifications" icon={FiBell}>
        <div className="space-y-2">
          <ToggleSwitch
            label="Low Inventory Alerts"
            checked={settings.low_inventory_alerts}
            onChange={(checked) => setSettings({ ...settings, low_inventory_alerts: checked })}
            description="Get notified when items are running low"
          />
          
          <ToggleSwitch
            label="New Order Sound"
            checked={settings.new_order_sound}
            onChange={(checked) => setSettings({ ...settings, new_order_sound: checked })}
            description="Play sound when new orders are received"
          />
          
          <ToggleSwitch
            label="Kitchen Display Alerts"
            checked={settings.kitchen_display_alerts}
            onChange={(checked) => setSettings({ ...settings, kitchen_display_alerts: checked })}
            description="Show visual alerts for urgent orders"
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <SettingCard title="Security & Access" icon={FiShield}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="480"
              value={settings.session_timeout}
              onChange={(e) => setSettings({ ...settings, session_timeout: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-1">
              Automatically log out staff after period of inactivity
            </p>
          </div>
          
          <ToggleSwitch
            label="Require Manager Approval"
            checked={settings.require_manager_approval}
            onChange={(checked) => setSettings({ ...settings, require_manager_approval: checked })}
            description="Require manager approval for refunds and discounts"
          />
          
          <ToggleSwitch
            label="Enable Audit Log"
            checked={settings.enable_audit_log}
            onChange={(checked) => setSettings({ ...settings, enable_audit_log: checked })}
            description="Track all system actions for compliance"
          />
        </div>
      </SettingCard>
    </div>
  );

  const renderIntegrationSettings = () => (
    <div className="space-y-6">
      <SettingCard title="Third-party Integrations" icon={FiWifi}>
        <div className="space-y-2">
          <ToggleSwitch
            label="Loyalty Program"
            checked={settings.loyalty_program_enabled}
            onChange={(checked) => setSettings({ ...settings, loyalty_program_enabled: checked })}
            description="Enable customer loyalty points and rewards"
          />
          
          <ToggleSwitch
            label="Online Ordering"
            checked={settings.online_ordering_enabled}
            onChange={(checked) => setSettings({ ...settings, online_ordering_enabled: checked })}
            description="Accept orders through online platforms"
          />
          
          <ToggleSwitch
            label="Delivery Integration"
            checked={settings.delivery_integration}
            onChange={(checked) => setSettings({ ...settings, delivery_integration: checked })}
            description="Integrate with delivery services like DoorDash, Uber Eats"
          />
        </div>
      </SettingCard>
    </div>
  );

  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'pos', label: 'POS', icon: FiPrinter },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'integrations', label: 'Integrations', icon: FiWifi }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your restaurant's POS system settings</p>
        {isOfflineDemo && (
          <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <p className="text-warning-800 text-sm">
              <strong>Demo Mode:</strong> Settings changes are simulated and won't be saved.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-200 p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <SafeIcon icon={tab.icon} className="text-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mb-8">
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'pos' && renderPOSSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'integrations' && renderIntegrationSettings()}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={handleReset}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <SafeIcon icon={FiRefreshCw} />
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiSave} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdvancedSettings;