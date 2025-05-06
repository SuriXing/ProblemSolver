import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import Layout from '../layout/Layout';
import DebugMenu from '../DebugMenu';
import { DatabaseService } from '../../services/database.service';
import { Button, Card, Spin, Empty } from 'antd';
import { Post } from '../../types/database.types';

// Helper function to get time ago
const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffWeeks > 0) {
    return diffWeeks === 1 ? '1 week ago' : `${diffWeeks} weeks ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMins > 0) {
    return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
  } else {
    return 'Just now';
  }
};

// Add type for PastQuestionsPageProps
interface PastQuestionsPageProps {
  showDebug?: boolean;
  debugProps?: {
    showTest: boolean;
    setShowTest: (show: boolean) => void;
    useDirectClient: boolean;
    setUseDirectClient: (use: boolean) => void;
    showEnvDebug: boolean;
    setShowEnvDebug: (show: boolean) => void;
  };
}

const PastQuestionsPage: React.FC<PastQuestionsPageProps> = ({ showDebug, debugProps }) => {
  const { t } = useTypeSafeTranslation();
  const [questions, setQuestions] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all questions
  const fetchAllQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const posts = await DatabaseService.getPostsByPurpose('need_help');
      setQuestions(posts);
      setError(null);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllQuestions();
  }, [fetchAllQuestions]);

  return (
    <Layout>
      <div className="past-questions-container">
        <h1>{t('goToPastQuestions')}</h1>
        
        <Link to="/">
          <Button type="primary" style={{ marginBottom: 20 }}>
            {t('returnHome')}
          </Button>
        </Link>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <p>{t('loading')}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <Button onClick={fetchAllQuestions}>Retry</Button>
          </div>
        ) : questions.length === 0 ? (
          <Empty description={t('noQuestionFound')} />
        ) : (
          <div className="questions-list">
            {questions.map(question => (
              <Card 
                key={question.id} 
                title={question.title || 'Untitled'} 
                style={{ marginBottom: 16 }}
              >
                <p>{question.content}</p>
                <div className="card-footer">
                  <Link to={`/share/${question.access_code}`}>
                    <Button type="primary">View Details</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {/* 使用传入的 showDebug 属性控制调试菜单的显示 */}
      {showDebug && debugProps && (
        <DebugMenu 
          showTest={debugProps.showTest}
          setShowTest={debugProps.setShowTest}
          useDirectClient={debugProps.useDirectClient}
          setUseDirectClient={debugProps.setUseDirectClient}
          showEnvDebug={debugProps.showEnvDebug}
          setShowEnvDebug={debugProps.setShowEnvDebug}
        />
      )}
    </Layout>
  );
};

export default PastQuestionsPage;
