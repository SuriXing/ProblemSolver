import { useState, Suspense, useEffect, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n'; // Import i18n setup
import { IS_PROD } from './utils/environment';
import { TranslationProvider } from './context/TranslationContext';
import { useTranslation } from 'react-i18next';

// P1.1: every route is code-split. Only the chunks a user actually navigates
// to get downloaded — first-paint cost is just App + router + i18n shell.
// LoadingPage is eager because it's the Suspense fallback itself.
import LoadingPage from './components/pages/LoadingPage';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const HomePage = lazy(() => import('./components/pages/HomePage'));
const HelpPage = lazy(() => import('./components/pages/HelpPage'));
const ConfessionPage = lazy(() => import('./components/pages/ConfessionPage'));
const SuccessPage = lazy(() => import('./components/pages/SuccessPage'));
const HelpSuccessPage = lazy(() => import('./components/pages/HelpSuccessPage'));
const PastQuestionsPage = lazy(() => import('./components/pages/PastQuestionsPage'));
const TopicDetailPage = lazy(() => import('./components/pages/TopicDetailPage'));
const SharePage = lazy(() => import('./components/pages/SharePage'));
const HelpDetailPage = lazy(() => import('./components/pages/HelpDetailPage'));
const NotFoundPage = lazy(() => import('./components/pages/NotFoundPage'));
const AdminLoginPage = lazy(() => import('./components/pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./components/pages/AdminDashboardPage'));

// Dev-only components — lazy so they never ship in the prod critical path.
const SupabaseTest = lazy(() => import('./components/SupabaseTest'));
const EnvDebug = lazy(() => import('./components/EnvDebug'));
const DebugMenu = lazy(() => import('./components/DebugMenu'));

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
      <Suspense fallback={<LoadingPage />}>
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
