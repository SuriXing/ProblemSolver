import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import Layout from '../layout/Layout';
import DebugMenu from '../DebugMenu';
import { DatabaseService } from '../../services/database.service';
import { Button, Card, Spin, Empty, Input } from 'antd';
import { Post } from '../../types/database.types';
import { message } from 'antd';
import ConfessionPlaceholderSVG from '../../assets/placeholder_confession.svg';
import ErrorPlaceholderSVG from '../../assets/placeholder_error.svg';

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
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<any[]>([]);
  const [fetchingPost, setFetchingPost] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  // Fetch post and replies by access code
  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFetchingPost(true);
    setFetchError(null);
    setFetchedPost(null);
    setReplies([]);
    try {
      const post = await DatabaseService.getPostByAccessCode(accessCode.trim());
      if (!post) {
        setFetchError(t('postNotFound'));
        setFetchingPost(false);
        return;
      }
      setFetchedPost(post);
      // Fetch replies if available
      if (post.id) {
        const fetchedReplies = await DatabaseService.getRepliesByPostId(post.id);
        setReplies(fetchedReplies || []);
      }
    } catch (err) {
      setFetchError(t('errorRetrievingData'));
    } finally {
      setFetchingPost(false);
    }
  };

  const handleProblemSolved = () => {
    message.success(t('problemMarkedSolved'));
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  const handleProblemNotSolved = () => {
    message.info(t('problemMarkedUnsolved'));
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };

  useEffect(() => {
    fetchAllQuestions();
  }, [fetchAllQuestions]);

  return (
    <Layout>
      <div className="container past-questions-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh', justifyContent: 'flex-start', position: 'relative' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>{t('goToPastQuestions')}</h1>
        <form onSubmit={handleAccessCodeSubmit} className="accessCodeForm" style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          <label htmlFor="access-code-input" style={{ fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>{t('enterAccessCode')}</label>
          <Input
            id="access-code-input"
            className="accessCodeInput"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            placeholder={t('enterAccessCode')}
            style={{ marginBottom: 16, maxWidth: 300, textAlign: 'center' }}
            autoComplete="off"
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', maxWidth: 300 }} disabled={fetchingPost}>
            {t('viewMyPost') || 'View My Post'}
          </button>
        </form>

        {/* Placeholder area below input, only show if no valid post */}
        {!fetchedPost && (
          <div style={{ width: '100%', maxWidth: 600, minHeight: 250, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 32, padding: 32 }}>
            {fetchError ? (
              <>
                <img src={ErrorPlaceholderSVG} alt="error" style={{ width: 120, height: 120, marginBottom: 16 }} />
                <div style={{ color: '#e53935', fontWeight: 500, fontSize: 18, textAlign: 'center' }}>{t('postNotFound') || 'Wrong access code, please give me correct one.'}</div>
              </>
            ) : (
              <>
                <img src={ConfessionPlaceholderSVG} alt="placeholder" style={{ width: 120, height: 120, marginBottom: 16 }} />
                <div style={{ color: '#888', fontWeight: 500, fontSize: 18, textAlign: 'center' }}>{t('confessionPlaceholderHint') || 'Your confession will be shown here.'}</div>
              </>
            )}
          </div>
        )}

        {/* Show fetched post and replies if available */}
        {fetchedPost && (
          <Card title={fetchedPost.title || t('untitled')} style={{ marginBottom: 24, width: '100%', maxWidth: 600 }}>
            <p>{fetchedPost.content}</p>
            <div style={{ marginBottom: 12 }}>
              <b>{t('replies')}:</b>
            </div>
            {replies.length === 0 ? (
              <div style={{ color: '#888' }}>{t('noRepliesYet')}</div>
            ) : (
              <ul style={{ paddingLeft: 20 }}>
                {replies.map((reply, idx) => (
                  <li key={reply.id || idx} style={{ marginBottom: 8 }}>
                    {reply.content}
                  </li>
                ))}
              </ul>
            )}
            {/* Problem solved buttons */}
            <div style={{ display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center' }}>
              <Button type="primary" onClick={handleProblemSolved}>{t('problemSolved')}</Button>
              <Button onClick={handleProblemNotSolved}>{t('problemNotSolved')}</Button>
            </div>
            {/* Back to Home button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Link to="/">
                <Button type="default">{t('backToHome')}</Button>
              </Link>
            </div>
          </Card>
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
