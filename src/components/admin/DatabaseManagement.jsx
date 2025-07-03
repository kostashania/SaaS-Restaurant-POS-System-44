import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDatabase, FiSettings, FiCheck, FiX, FiCopy, FiRefreshCw, FiAlertTriangle, FiInfo, FiExternalLink, FiPlay, FiTable, FiList } = FiIcons;

const DatabaseManagement = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [dbInfo] = useState({
    url: 'https://smkhqyxtjrtavlzgjbqm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNta2hxeXh0anJ0YXZsemdqYnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzM1MjgsImV4cCI6MjA2NjU0OTUyOH0.qsEvNlujeYTu1aTIy2ne_sbYzl9XW5Wv1VrxLoYkjD4',
    projectId: 'smkhqyxtjrtavlzgjbqm',
    region: 'us-east-1'
  });
  const [testResults, setTestResults] = useState([]);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState('unknown');
  const [activeTab, setActiveTab] = useState('overview');
  const [tablesList, setTablesList] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableColumns, setTableColumns] = useState([]);

  useEffect(() => {
    checkConnection();
    checkSchemaStatus();
    loadTables();
  }, []);

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      const { data, error } = await supabase
        .from('tenants_pos_v1')
        .select('count')
        .limit(1);

      if (error) {
        setConnectionStatus('error');
        console.error('Connection error:', error);
      } else {
        setConnectionStatus('connected');
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection failed:', error);
    }
  };

  const loadTables = async () => {
    try {
      const { data, error } = await supabase.rpc('exec', {
        query: `
          SELECT 
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
          FROM information_schema.tables t 
          WHERE table_schema = 'public' 
          AND table_name LIKE '%pos%' 
          ORDER BY table_name;
        `
      });

      if (!error && data) {
        setTablesList(data);
      } else {
        // Fallback method
        const { data: tablesData } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .like('table_name', '%pos%');
        
        if (tablesData) {
          setTablesList(tablesData.map(t => ({ table_name: t.table_name, column_count: 0 })));
        }
      }
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const loadTableColumns = async (tableName) => {
    try {
      const { data, error } = await supabase.rpc('exec', {
        query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_name = '${tableName}' 
          ORDER BY ordinal_position;
        `
      });

      if (!error && data) {
        setTableColumns(data);
      }
    } catch (error) {
      console.error('Error loading table columns:', error);
    }
  };

  const handleTableClick = (tableName) => {
    setSelectedTable(tableName);
    loadTableColumns(tableName);
  };

  const checkSchemaStatus = async () => {
    try {
      const tables = [
        'tenants_pos_v1',
        'locations_pos_v1',
        'staff_pos_v1',
        'tables_pos_v1',
        'menu_categories_pos_v1',
        'menu_items_pos_v1',
        'orders_pos_v1',
        'order_items_pos_v1',
        'financial_categories_pos_v1',
        'financial_transactions_pos_v1'
      ];

      const results = [];
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count')
            .limit(1);

          results.push({
            table,
            status: error ? 'missing' : 'exists',
            error: error?.message
          });
        } catch (err) {
          results.push({
            table,
            status: 'error',
            error: err.message
          });
        }
      }

      setTestResults(results);
      const allExist = results.every(r => r.status === 'exists');
      setSchemaStatus(allExist ? 'complete' : 'incomplete');
    } catch (error) {
      setSchemaStatus('error');
      console.error('Schema check failed:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const runSchemaSetup = async () => {
    try {
      setSchemaStatus('setting-up');
      
      // Fix the staff table to add missing permissions column
      const { error } = await supabase.rpc('exec', {
        query: `
          -- Add missing permissions column to staff table
          ALTER TABLE staff_pos_v1 ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT ARRAY['basic_pos'];
          
          -- Update existing staff records to have permissions
          UPDATE staff_pos_v1 SET permissions = ARRAY['full_access'] WHERE permissions IS NULL OR permissions = '{}';
          
          -- Ensure financial tables exist
          CREATE TABLE IF NOT EXISTS financial_categories_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            user_id UUID REFERENCES auth.users(id),
            name TEXT NOT NULL,
            type TEXT CHECK (type IN ('income','expense')) NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            icon TEXT DEFAULT 'FiDollarSign',
            description TEXT,
            scope TEXT CHECK (scope IN ('business','personal')) DEFAULT 'business',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          CREATE TABLE IF NOT EXISTS financial_transactions_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            user_id UUID REFERENCES auth.users(id),
            category_id UUID REFERENCES financial_categories_pos_v1(id),
            title TEXT NOT NULL,
            description TEXT,
            amount DECIMAL(10,2) NOT NULL,
            type TEXT CHECK (type IN ('income','expense')) NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            transaction_date TIMESTAMPTZ DEFAULT NOW(),
            reference_number TEXT,
            tags TEXT[] DEFAULT '{}',
            scope TEXT CHECK (scope IN ('business','personal')) DEFAULT 'business',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
          
          -- Enable RLS
          ALTER TABLE financial_categories_pos_v1 ENABLE ROW LEVEL SECURITY;
          ALTER TABLE financial_transactions_pos_v1 ENABLE ROW LEVEL SECURITY;
          
          -- Create permissive policies for now
          DROP POLICY IF EXISTS "Enable all access for authenticated users" ON financial_categories_pos_v1;
          CREATE POLICY "Enable all access for authenticated users" 
          ON financial_categories_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);
          
          DROP POLICY IF EXISTS "Enable all access for authenticated users" ON financial_transactions_pos_v1;
          CREATE POLICY "Enable all access for authenticated users" 
          ON financial_transactions_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);
        `
      });

      if (error) {
        console.error('Schema setup error:', error);
        setSchemaStatus('error');
      } else {
        setSchemaStatus('complete');
        await checkSchemaStatus();
        await loadTables();
      }
    } catch (error) {
      console.error('Schema setup failed:', error);
      setSchemaStatus('error');
    }
  };

  const ConnectionStatus = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
          connectionStatus === 'connected' ? 'bg-success-100' :
          connectionStatus === 'error' ? 'bg-danger-100' : 'bg-warning-100'
        }`}>
          <SafeIcon icon={
            connectionStatus === 'connected' ? FiCheck :
            connectionStatus === 'error' ? FiX : FiRefreshCw
          } className={`text-xl ${
            connectionStatus === 'connected' ? 'text-success-600' :
            connectionStatus === 'error' ? 'text-danger-600' : 'text-warning-600 animate-spin'
          }`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Database Connection</h3>
          <p className={`text-sm ${
            connectionStatus === 'connected' ? 'text-success-600' :
            connectionStatus === 'error' ? 'text-danger-600' : 'text-warning-600'
          }`}>
            {connectionStatus === 'connected' ? 'Connected successfully' :
             connectionStatus === 'error' ? 'Connection failed' : 'Checking connection...'}
          </p>
        </div>
      </div>
      <button
        onClick={checkConnection}
        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
      >
        <SafeIcon icon={FiRefreshCw} />
        Test Connection
      </button>
    </motion.div>
  );

  const SchemaStatus = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <SafeIcon icon={FiDatabase} className="text-primary-500" />
          Schema Status
        </h3>
        <button
          onClick={runSchemaSetup}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiSettings} />
          Fix Schema
        </button>
      </div>
      
      <div className={`p-4 rounded-lg mb-4 ${
        schemaStatus === 'complete' ? 'bg-success-50 border border-success-200' :
        schemaStatus === 'incomplete' ? 'bg-warning-50 border border-warning-200' :
        schemaStatus === 'error' ? 'bg-danger-50 border border-danger-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <SafeIcon icon={
            schemaStatus === 'complete' ? FiCheck :
            schemaStatus === 'error' ? FiX : FiAlertTriangle
          } className={
            schemaStatus === 'complete' ? 'text-success-600' :
            schemaStatus === 'error' ? 'text-danger-600' : 'text-warning-600'
          } />
          <span className={`font-medium ${
            schemaStatus === 'complete' ? 'text-success-800' :
            schemaStatus === 'error' ? 'text-danger-800' : 'text-warning-800'
          }`}>
            {schemaStatus === 'complete' ? 'Schema Complete' :
             schemaStatus === 'incomplete' ? 'Schema Incomplete' :
             schemaStatus === 'error' ? 'Schema Error' : 'Checking Schema...'}
          </span>
        </div>
        <p className={`text-sm ${
          schemaStatus === 'complete' ? 'text-success-700' :
          schemaStatus === 'error' ? 'text-danger-700' : 'text-warning-700'
        }`}>
          {schemaStatus === 'complete' ? 'All required tables and columns are present' :
           schemaStatus === 'incomplete' ? 'Missing columns detected. Click "Fix Schema" to repair.' :
           schemaStatus === 'error' ? 'Error checking schema. Please check your connection.' :
           'Verifying database schema...'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {testResults.map((result) => (
          <div
            key={result.table}
            className={`p-2 rounded text-xs flex items-center gap-1 ${
              result.status === 'exists' ? 'bg-success-100 text-success-700' :
              result.status === 'missing' ? 'bg-danger-100 text-danger-700' :
              'bg-warning-100 text-warning-700'
            }`}
          >
            <SafeIcon icon={result.status === 'exists' ? FiCheck : FiX} className="text-xs" />
            <span className="truncate" title={result.table}>
              {result.table.replace('_pos_v1', '')}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const TablesViewer = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <div className="flex items-center gap-2 mb-4">
        <SafeIcon icon={FiTable} className="text-primary-500 text-xl" />
        <h3 className="text-lg font-bold text-gray-900">Database Tables</h3>
        <button
          onClick={loadTables}
          className="ml-auto p-2 text-gray-500 hover:text-primary-500 rounded-lg"
        >
          <SafeIcon icon={FiRefreshCw} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tables List */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Available Tables ({tablesList.length})</h4>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tablesList.map((table) => (
              <button
                key={table.table_name}
                onClick={() => handleTableClick(table.table_name)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTable === table.table_name
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{table.table_name}</span>
                  <span className="text-xs text-gray-500">{table.column_count} cols</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Table Details */}
        <div>
          {selectedTable ? (
            <>
              <h4 className="font-medium text-gray-900 mb-3">
                Columns in {selectedTable}
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tableColumns.map((column) => (
                  <div
                    key={column.column_name}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{column.column_name}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {column.data_type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {column.is_nullable === 'YES' ? 'Nullable' : 'Required'}
                      {column.column_default && ` • Default: ${column.column_default}`}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <SafeIcon icon={FiList} className="text-4xl mb-2 mx-auto" />
                <p>Select a table to view its columns</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const DatabaseInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <SafeIcon icon={FiInfo} className="text-primary-500" />
        Database Information
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supabase URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dbInfo.url}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => copyToClipboard(dbInfo.url)}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
            >
              <SafeIcon icon={FiCopy} />
            </button>
            <a
              href={dbInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
            >
              <SafeIcon icon={FiExternalLink} />
            </a>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project ID
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={dbInfo.projectId}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => copyToClipboard(dbInfo.projectId)}
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
            >
              <SafeIcon icon={FiCopy} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dashboard URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={`https://supabase.com/dashboard/project/${dbInfo.projectId}`}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <a
              href={`https://supabase.com/dashboard/project/${dbInfo.projectId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 hover:text-primary-500 hover:bg-primary-50 rounded-lg"
            >
              <SafeIcon icon={FiExternalLink} />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiDatabase },
    { id: 'tables', label: 'Tables', icon: FiTable },
    { id: 'info', label: 'Info', icon: FiInfo }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
        <p className="text-gray-600">Monitor and manage your Supabase database connection</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-200 p-1 rounded-lg w-fit">
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
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConnectionStatus />
              <SchemaStatus />
            </div>
          </>
        )}

        {activeTab === 'tables' && (
          <TablesViewer />
        )}

        {activeTab === 'info' && (
          <DatabaseInfo />
        )}
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-xl p-6 shadow-lg mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Troubleshooting</h3>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Categories not persisting?</h4>
            <p className="text-sm text-red-800 mb-2">This usually means the database schema is incomplete or missing columns.</p>
            <p className="text-sm text-red-800">
              <strong>Solution:</strong> Click "Fix Schema" in the Schema Status section above.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Missing columns error?</h4>
            <p className="text-sm text-blue-800 mb-2">Check the Tables section to see what columns exist vs what the app expects.</p>
            <p className="text-sm text-blue-800">
              <strong>Solution:</strong> Use the "Fix Schema" button to add missing columns automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;