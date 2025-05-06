import { useState, Suspense, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './i18n'; // Import i18n setup
import { getBasePath, IS_PROD } from './utils/environment';
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

// Import additional components
import SupabaseTest from './components/SupabaseTest';
import EnvDebug from './components/EnvDebug';
import DebugMenu from './components/DebugMenu';

const AppWrapper = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // 更新 HTML lang 属性
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return <App />;
};

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [useDirectClient, setUseDirectClient] = useState(false);
  const [showEnvDebug, setShowEnvDebug] = useState(false);

  return (
    <TranslationProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <HashRouter>
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
  );
}

export default AppWrapper;
