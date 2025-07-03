import React, { useEffect, useState } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { usePosStore } from './stores/posStore';

// Components
import LoginForm from './components/auth/LoginForm';
import TenantSelector from './components/auth/TenantSelector';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TableGrid from './components/pos/TableGrid';
import OrderPanel from './components/pos/OrderPanel';
import KitchenDisplay from './components/pos/KitchenDisplay';
import Dashboard from './components/analytics/Dashboard';
import SuperAdminPanel from './components/admin/SuperAdminPanel';
import DatabaseManagement from './components/admin/DatabaseManagement';
import MenuManagement from './components/pos/MenuManagement';
import CustomerManagement from './components/pos/CustomerManagement';
import StaffManagement from './components/pos/StaffManagement';
import PaymentProcessing from './components/pos/PaymentProcessing';
import AdvancedSettings from './components/pos/AdvancedSettings';
import FinancialDashboard from './components/finance/FinancialDashboard';
import TransactionManagement from './components/finance/TransactionManagement';
import CategoryManagement from './components/finance/CategoryManagement';

// Styles
import './App.css';

function App() {
  const [activeView, setActiveView] = useState('tables');
  const {
    user,
    currentTenant,
    currentLocation,
    loading,
    initialize,
    isOfflineDemo,
    isSuperAdmin
  } = useAuthStore();
  const { setupRealtime, cleanup, loadTables, loadMenu } = usePosStore();

  // Initialize auth on app start
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Setup POS when location is selected
  useEffect(() => {
    if (currentLocation?.id && currentTenant?.id && !isSuperAdmin) {
      setupRealtime(currentLocation.id);
      loadTables(currentLocation.id);
      loadMenu(currentTenant.id);

      return () => cleanup();
    }
  }, [currentLocation?.id, currentTenant?.id, isSuperAdmin, setupRealtime, cleanup, loadTables, loadMenu]);

  // Auto-set superadmin view for superadmin users
  useEffect(() => {
    if (isSuperAdmin && activeView === 'tables') {
      setActiveView('superadmin');
    }
  }, [isSuperAdmin, activeView]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">Loading POS System...</p>
          {isOfflineDemo && (
            <p className="text-success-600 text-sm mt-2">Setting up offline demo...</p>
          )}
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <Router>
        <LoginForm />
        <Toaster position="top-right" />
      </Router>
    );
  }

  // No tenant/location selected (skip for superadmin)
  if (!isSuperAdmin && (!currentTenant || !currentLocation)) {
    return (
      <Router>
        <TenantSelector />
        <Toaster position="top-right" />
      </Router>
    );
  }

  // Render main POS interface
  const renderMainContent = () => {
    switch (activeView) {
      case 'superadmin':
        return <SuperAdminPanel />;
      case 'database':
        return <DatabaseManagement />;
      case 'tables':
        return (
          <div className="flex flex-1">
            <div className="flex-1">
              <TableGrid />
            </div>
            <OrderPanel />
          </div>
        );
      case 'kitchen':
        return <KitchenDisplay />;
      case 'analytics':
        return <Dashboard />;
      case 'menu':
        return <MenuManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'payments':
        return <PaymentProcessing />;
      case 'finance':
        return <FinancialDashboard />;
      case 'transactions':
        return <TransactionManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'settings':
        return <AdvancedSettings />;
      default:
        return isSuperAdmin ? <SuperAdminPanel /> : <TableGrid />;
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col">
          <Header activeView={activeView} />
          <main className="flex-1 overflow-hidden">
            {renderMainContent()}
          </main>
        </div>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: '#4aed88',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;