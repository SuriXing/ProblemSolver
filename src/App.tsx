import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './assets/css/index.css';
import './utils/i18n'; // Initialize i18n
import { supabase } from './utils/supabaseClient';
import HomePage from './components/pages/HomePage';
import HelpPage from './components/pages/HelpPage';
import ConfessionPage from './components/pages/ConfessionPage';
import DetailPage from './components/pages/DetailPage';
import SuccessPage from './components/pages/SuccessPage';
import HelpSuccessPage from './components/pages/HelpSuccessPage';
import PastQuestionsPage from './components/pages/PastQuestionsPage';
import TopicDetailPage from './components/pages/TopicDetailPage';
import SharePage from './components/pages/SharePage';
import HelpDetailPage from './components/pages/HelpDetailPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoadingPage from './components/pages/LoadingPage';
import { checkSupabaseConnection } from './lib/supabase';
import { verifyDatabaseSchema, isDatabaseSetUp } from './utils/databaseUtils';
import SupabaseTest from './components/SupabaseTest';
import { Button } from 'antd';
import { supabaseDirect } from './lib/supabaseDirectClient';
import EnvDebug from './components/EnvDebug';
import { SUPABASE_URL, SUPABASE_ANON_KEY, getEnv, IS_PROD, getBasePath } from './utils/environment';
import DebugMenu from './components/DebugMenu';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [schemaIssues, setSchemaIssues] = useState<string[]>([]);
  const [showTest, setShowTest] = useState(false);
  const [databaseReady, setDatabaseReady] = useState<boolean>(false);
  const [showFullSql, setShowFullSql] = useState(false);
  const [envVarsLoaded, setEnvVarsLoaded] = useState(false);
  const [useDirectClient, setUseDirectClient] = useState(false);
  const [showEnvDebug, setShowEnvDebug] = useState(false);
  
  useEffect(() => {
    // Check if Supabase is connected
    const checkConnection = async () => {
      try {
        // Try to query the posts table instead of problems
        const { data, error } = await supabase.from('posts').select('count');
        
        // If the table doesn't exist yet, that's okay
        if (error && error.code === '42P01') {
          console.log('Posts table does not exist yet. This is expected if you need to run the setup scripts.');
        } else if (error) {
          console.error('Error connecting to Supabase:', error);
        } else {
          console.log('Connected to Supabase!');
        }
      } catch (error) {
        console.error('Error connecting to Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkConnection();
  }, []);
  
  useEffect(() => {
    async function checkConnection() {
      const isConnected = await checkSupabaseConnection();
      setConnectionChecked(true);
      setConnectionError(!isConnected);
    }
    
    checkConnection();
  }, []);
  
  useEffect(() => {
    async function checkSchema() {
      const { success, issues } = await verifyDatabaseSchema();
      if (!success) {
        setSchemaIssues(issues);
        console.error('Database schema issues:', issues);
      }
    }
    
    checkSchema();
  }, []);
  
  useEffect(() => {
    async function checkDatabase() {
      const isReady = await isDatabaseSetUp();
      setDatabaseReady(isReady);
    }
    
    checkDatabase();
  }, []);
  
  useEffect(() => {
    // Check if environment variables are loaded
    const checkEnvVars = () => {
      try {
        // Use our centralized environment utilities instead of direct access
        const url = SUPABASE_URL;
        const key = SUPABASE_ANON_KEY;
        
        setEnvVarsLoaded(!!url && !!key);
        
        if (!url || !key) {
          console.warn('Environment variables not loaded correctly');
          // If we're in a development environment, use our fallbacks
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Using development fallbacks');
            setEnvVarsLoaded(true); // Allow the app to proceed with fallbacks in development
          }
        } else {
          console.log('Environment variables loaded successfully');
        }
      } catch (error) {
        console.error('Error checking environment variables:', error);
        setEnvVarsLoaded(false);
      }
    };
    
    checkEnvVars();
  }, []);
  
  useEffect(() => {
    const storedPreference = localStorage.getItem('useDirectClient');
    if (storedPreference) {
      setUseDirectClient(storedPreference === 'true');
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('useDirectClient', useDirectClient.toString());
  }, [useDirectClient]);
  
  // Add a button to test database connection
  const testDatabaseConnection = async () => {
    try {
      // Try to create a test post
      const testPost = {
        title: 'Test Post',
        content: 'This is a test post',
        purpose: 'seeking_help',
        tags: ['test'],
        is_anonymous: false,
        status: 'open',
        user_id: null
      };
      
      const { data, error } = await supabase
        .from('posts')
        .insert([{ ...testPost, access_code: 'test123', views: 0 }])
        .select()
        .single();
      
      if (error) {
        console.error('Test post creation error:', error);
        alert(`Database test failed: ${error.message}`);
      } else {
        console.log('Test post created successfully:', data);
        alert('Database test successful!');
        
        // Clean up the test post
        await supabase
          .from('posts')
          .delete()
          .eq('access_code', 'test123');
      }
    } catch (error) {
      console.error('Test error:', error);
      if (error instanceof Error) {
        alert(`Test error: ${error.message}`);
      } else {
        alert('Unknown test error');
      }
    }
  };
  
  if (!connectionChecked) {
    return <div>Checking database connection...</div>;
  }
  
  if (connectionError) {
    return <div>Error connecting to the database. Please check your configuration.</div>;
  }
  
  if (schemaIssues.length > 0) {
    return (
      <div className="error-container">
        <h1>Database Schema Issues</h1>
        <p>There are issues with the database schema that need to be fixed:</p>
        <ul>
          {schemaIssues.map((issue, index) => (
            <li key={index}>{issue}</li>
          ))}
        </ul>
        <p>Please run the SQL scripts to set up your database correctly.</p>
      </div>
    );
  }
  
  if (!databaseReady) {
    return (
      <div className="error-container" style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <h1>Database Setup Required</h1>
        <p>The database tables are not set up correctly. Please run the SQL setup scripts in your Supabase project.</p>
        
        <Button 
          type="primary" 
          onClick={() => setShowFullSql(!showFullSql)}
          style={{ marginBottom: 20 }}
        >
          {showFullSql ? 'Hide' : 'Show'} Full SQL Setup
        </Button>
        
        {showFullSql && (
          <pre style={{ 
            background: '#f5f5f5', 
            padding: 20, 
            borderRadius: 4, 
            overflow: 'auto',
            maxHeight: '60vh'
          }}>
            {`-- Function to check if another function exists
CREATE OR REPLACE FUNCTION check_function_exists(function_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM pg_proc
    WHERE proname = function_name
    AND pronamespace = 'public'::regnamespace
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper functions to check schema
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = check_table_exists.table_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- More SQL setup code...

-- Create the posts table with all required columns
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('seeking_help', 'sharing_experience')),
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'solved', 'closed')),
  access_code TEXT UNIQUE
);

-- See full SQL in documentation`}
          </pre>
        )}
        
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol>
          <li>Go to your Supabase dashboard</li>
          <li>Click on "SQL Editor" in the left sidebar</li>
          <li>Create a new query</li>
          <li>Paste the SQL setup script</li>
          <li>Click "Run" to execute the script</li>
        </ol>
        
        <p>After running the script, refresh this page.</p>
        
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }
  
  if (!envVarsLoaded) {
    return (
      <div className="error-container" style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
        <h1>Environment Variables Not Loaded</h1>
        <p>The application could not load the required environment variables. Please make sure your .env file is set up correctly.</p>
        
        <pre style={{ background: '#f5f5f5', padding: 20, borderRadius: 4 }}>
          {`VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Also include CRA versions for compatibility
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        
        <p>After setting up the .env file, restart your development server.</p>
        
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }
  
  const activeSupabase = useDirectClient ? supabaseDirect : supabase;
  
  return (
    <Router basename={getBasePath()}>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/help/:accessCode" element={<HelpDetailPage />} />
            <Route path="/help-success" element={<HelpSuccessPage />} />
            <Route path="/confession" element={<ConfessionPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route 
              path="/past-questions" 
              element={
                <PastQuestionsPage 
                  showDebug={!IS_PROD} 
                  debugProps={{
                    showTest,
                    setShowTest,
                    useDirectClient,
                    setUseDirectClient,
                    showEnvDebug,
                    setShowEnvDebug
                  }} 
                />
              } 
            />
            <Route path="/topics/:topicId" element={<TopicDetailPage />} />
            <Route path="/share/:accessCode" element={<SharePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          
          {showTest && <SupabaseTest />}
          <DebugMenu 
            showTest={showTest}
            setShowTest={setShowTest}
            useDirectClient={useDirectClient}
            setUseDirectClient={setUseDirectClient}
            showEnvDebug={showEnvDebug}
            setShowEnvDebug={setShowEnvDebug}
          />
          {showEnvDebug && <EnvDebug />}
        </>
      )}
    </Router>
  );
};

export default App;
