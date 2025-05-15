import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './assets/css/index.css';
import './utils/i18n'; // Initialize i18n
import HomePage from './components/pages/HomePage';
import HelpPage from './components/pages/HelpPage';
import ConfessionPage from './components/pages/ConfessionPage';
import DetailPage from './components/pages/DetailPage';
import SuccessPage from './components/pages/SuccessPage';
import HelpSuccessPage from './components/pages/HelpSuccessPage';
import PastQuestionsPage from './components/pages/PastQuestionsPage';
import TopicDetailPage from './components/pages/TopicDetailPage';
import SharePage from './components/pages/SharePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/help/:accessCode" element={<DetailPage />} />
        <Route path="/help-success" element={<HelpSuccessPage />} />
        <Route path="/confession" element={<ConfessionPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/past-questions" element={<PastQuestionsPage />} />
        <Route path="/topics/:topicId" element={<TopicDetailPage />} />
        <Route path="/share/:accessCode" element={<SharePage />} />
      </Routes>
    </Router>
  );
};

export default App;
