import { useState, Suspense, useEffect, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n'; // Import i18n setup
import { IS_PROD } from './utils/environment';
import { TranslationProvider } from './context/TranslationContext';
import { useTranslation } from 'react-i18next';

// Import all your page components
import HomePage from './components/pages/HomePage';
import HelpPage from './components/pages/HelpPage';
import ConfessionPage from './components/pages/ConfessionPage';
import SuccessPage from './components/pages/SuccessPage';
import HelpSuccessPage from './components/pages/HelpSuccessPage';
import PastQuestionsPage from './components/pages/PastQuestionsPage';
import TopicDetailPage from './components/pages/TopicDetailPage';
import SharePage from './components/pages/SharePage';
import HelpDetailPage from './components/pages/HelpDetailPage';
import NotFoundPage from './components/pages/NotFoundPage';
import LoadingPage from './components/pages/LoadingPage';
// Admin routes are lazy-loaded: anonymous users never download admin code
// (bug-bash R2 perf #1).
const AdminLoginPage = lazy(() => import('./components/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./components/pages/AdminDashboardPage'));
import ProtectedRoute from './components/ProtectedRoute';

// Import additional components
import SupabaseTest from './components/SupabaseTest';
import EnvDebug from './components/EnvDebug';
import DebugMenu from './components/DebugMenu';
import ErrorBoundary from './components/ErrorBoundary';

const AppWrapper = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 更新 HTML lang 属性
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <App />;
};

function App() {
  const [isLoading, _setIsLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [useDirectClient, setUseDirectClient] = useState(false);
  const [showEnvDebug, setShowEnvDebug] = useState(false);

  return (
    <ErrorBoundary>
    <TranslationProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <HashRouter>
          {isLoading ? (
            <LoadingPage />
          ) : (
            <>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/problem-solver" element={<Navigate to="/" replace />} />
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
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  } 
                />
                
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              {showTest && <SupabaseTest />}
              {!IS_PROD && (
                <DebugMenu 
                  showTest={showTest}
                  setShowTest={setShowTest}
                  useDirectClient={useDirectClient}
                  setUseDirectClient={setUseDirectClient}
                  showEnvDebug={showEnvDebug}
                  setShowEnvDebug={setShowEnvDebug}
                />
              )}
              {showEnvDebug && <EnvDebug />}
            </>
          )}
        </HashRouter>
      </Suspense>
    </TranslationProvider>
    </ErrorBoundary>
  );
}

export default AppWrapper;
