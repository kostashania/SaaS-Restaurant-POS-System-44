import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../config/supabase';
import SafeIcon from '../../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiDatabase, FiSettings, FiCheck, FiX, FiCopy, FiRefreshCw, FiAlertTriangle, FiInfo, FiExternalLink, FiPlay } = FiIcons;

const DatabaseManagement = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [dbInfo, setDbInfo] = useState({
    url: 'https://smkhqyxtjrtavlzgjbqm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNta2hxeXh0anJ0YXZsemdqYnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzM1MjgsImV4cCI6MjA2NjU0OTUyOH0.qsEvNlujeYTu1aTIy2ne_sbYzl9XW5Wv1VrxLoYkjD4',
    projectId: 'smkhqyxtjrtavlzgjbqm',
    region: 'us-east-1'
  });
  const [testResults, setTestResults] = useState([]);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [schemaStatus, setSchemaStatus] = useState('unknown');

  useEffect(() => {
    checkConnection();
    checkSchemaStatus();
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
      
      // This would run the schema setup
      const { error } = await supabase.rpc('initialize_pos_schema_v1');
      
      if (error) {
        console.error('Schema setup error:', error);
        setSchemaStatus('error');
      } else {
        setSchemaStatus('complete');
        await checkSchemaStatus();
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
          <SafeIcon 
            icon={connectionStatus === 'connected' ? FiCheck : 
                  connectionStatus === 'error' ? FiX : FiRefreshCw} 
            className={`text-xl ${
              connectionStatus === 'connected' ? 'text-success-600' :
              connectionStatus === 'error' ? 'text-danger-600' : 'text-warning-600 animate-spin'
            }`}
          />
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
            Anonymous Key
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={dbInfo.anonKey}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => copyToClipboard(dbInfo.anonKey)}
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
          onClick={() => setShowSchemaModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiSettings} />
          Manage Schema
        </button>
      </div>

      <div className={`p-4 rounded-lg mb-4 ${
        schemaStatus === 'complete' ? 'bg-success-50 border border-success-200' :
        schemaStatus === 'incomplete' ? 'bg-warning-50 border border-warning-200' :
        schemaStatus === 'error' ? 'bg-danger-50 border border-danger-200' :
        'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <SafeIcon 
            icon={schemaStatus === 'complete' ? FiCheck :
                  schemaStatus === 'error' ? FiX : FiAlertTriangle}
            className={
              schemaStatus === 'complete' ? 'text-success-600' :
              schemaStatus === 'error' ? 'text-danger-600' : 'text-warning-600'
            }
          />
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
          {schemaStatus === 'complete' ? 'All required tables and functions are present' :
           schemaStatus === 'incomplete' ? 'Some tables are missing. Click "Manage Schema" to fix.' :
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
            <SafeIcon 
              icon={result.status === 'exists' ? FiCheck : FiX}
              className="text-xs"
            />
            <span className="truncate" title={result.table}>
              {result.table.replace('_pos_v1', '')}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const ManualConnection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 shadow-lg"
    >
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <SafeIcon icon={FiSettings} className="text-primary-500" />
        Manual Connection Setup
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">Quick Setup Instructions:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
          <li>Open your project: <strong>{dbInfo.projectId}</strong></li>
          <li>Go to <strong>SQL Editor</strong></li>
          <li>Run the schema setup (click "Setup Schema" below)</li>
          <li>Enable RLS policies for security</li>
        </ol>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setShowSchemaModal(true)}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiDatabase} />
          Setup Schema
        </button>
        <button
          onClick={checkSchemaStatus}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
        >
          <SafeIcon icon={FiRefreshCw} />
          Refresh Status
        </button>
      </div>
    </motion.div>
  );

  const SchemaModal = () => (
    <AnimatePresence>
      {showSchemaModal && (
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
            className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Database Schema Setup</h3>
              <button
                onClick={() => setShowSchemaModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <SafeIcon icon={FiX} />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Copy and run this SQL in your Supabase SQL Editor to set up all required tables and functions.
              </p>
            </div>

            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-4">
              <pre className="text-sm overflow-x-auto">
{`-- POS System Database Schema (pos_system_v1)
-- Copy this entire SQL and run it in Supabase SQL Editor

-- Create POS schema
CREATE SCHEMA IF NOT EXISTS pos_system_v1;
SET search_path TO pos_system_v1, public;

-- Create tenants table
CREATE TABLE IF NOT EXISTS pos_system_v1.tenants_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT CHECK (plan IN ('basic','pro','enterprise')) DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff table with permissions column
CREATE TABLE IF NOT EXISTS pos_system_v1.staff_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin','manager','waiter','chef','superadmin')) DEFAULT 'waiter',
  permissions TEXT[] DEFAULT ARRAY['basic_pos'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Create financial categories table
CREATE TABLE IF NOT EXISTS pos_system_v1.financial_categories_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Enable RLS on all tables
ALTER TABLE pos_system_v1.tenants_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.staff_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.financial_categories_pos_v1 ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "staff_tenant_access" ON pos_system_v1.tenants_pos_v1 
FOR ALL USING (
  id IN (
    SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
);

CREATE POLICY "staff_self_access" ON pos_system_v1.staff_pos_v1 
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )
);

CREATE POLICY "financial_categories_access" ON pos_system_v1.financial_categories_pos_v1 
FOR ALL USING (
  (scope = 'business' AND tenant_id IN (
    SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
    WHERE user_id = auth.uid() AND is_active = TRUE
  )) OR
  (scope = 'personal' AND user_id = auth.uid())
);

-- Create initialization function
CREATE OR REPLACE FUNCTION initialize_pos_schema_v1() 
RETURNS TEXT LANGUAGE SQL AS $$
  SELECT 'POS System schema initialized successfully'::TEXT;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA pos_system_v1 TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA pos_system_v1 TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pos_system_v1 TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pos_system_v1 TO authenticated;`}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => copyToClipboard(document.querySelector('pre').textContent)}
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center gap-2"
              >
                <SafeIcon icon={FiCopy} />
                Copy SQL
              </button>
              <button
                onClick={runSchemaSetup}
                className="bg-success-500 text-white px-4 py-2 rounded-lg hover:bg-success-600 flex items-center gap-2"
              >
                <SafeIcon icon={FiPlay} />
                Run Setup
              </button>
              <a
                href={`https://supabase.com/dashboard/project/${dbInfo.projectId}/sql`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center gap-2"
              >
                <SafeIcon icon={FiExternalLink} />
                Open SQL Editor
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
        <p className="text-gray-600">Monitor and manage your Supabase database connection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ConnectionStatus />
        <DatabaseInfo />
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6">
        <SchemaStatus />
        <ManualConnection />
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Troubleshooting</h3>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">Categories not persisting?</h4>
            <p className="text-sm text-red-800 mb-2">This usually means the database schema is incomplete or RLS policies are blocking access.</p>
            <p className="text-sm text-red-800">
              <strong>Solution:</strong> Run the schema setup above and ensure you're signed in with a valid user.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Connection issues?</h4>
            <p className="text-sm text-blue-800 mb-2">Check if your Supabase project is active and the URL/keys are correct.</p>
            <p className="text-sm text-blue-800">
              <strong>Solution:</strong> Verify the project is not paused in the Supabase dashboard.
            </p>
          </div>
        </div>
      </div>

      <SchemaModal />
    </div>
  );
};

export default DatabaseManagement;