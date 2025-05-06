import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { 
  Card, 
  Button, 
  Divider,
  message,
} from 'antd';
import { 
  ArrowLeftOutlined,
  EyeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import Layout from '../layout/Layout';
import '../../styles/HelpDetailPage.css';
import { DatabaseService } from '../../services/database.service';
import { Post, Reply as DatabaseReply } from '../../types/database.types';
import ReplyForm from '../ReplyForm';
import { getCurrentUserId } from '../../utils/authHelpers';

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

const HelpDetailPage: React.FC = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const { t } = useTypeSafeTranslation();
  
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<DatabaseReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  
  // Wrap fetchPostAndReplies in useCallback to fix dependency issue
  const fetchPostAndReplies = useCallback(async () => {
    if (!accessCode) return;
    
    setLoading(true);
    try {
      // Fetch the post by access code
      const fetchedPost = await DatabaseService.getPostByAccessCode(accessCode);
      
      if (fetchedPost) {
        setPost(fetchedPost);
        
        // Increment view count
        await DatabaseService.incrementViewCount(fetchedPost.id);
        
        // Fetch replies for this post
        const fetchedReplies = await DatabaseService.getRepliesByPostId(fetchedPost.id);
        setReplies(fetchedReplies || []);
      } else {
        console.error('Post not found with access code:', accessCode);
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post and replies:', err);
      setError('Error loading data');
    } finally {
      setLoading(false);
    }
  }, [accessCode]); // Include accessCode in dependencies
  
  // Load post and replies on component mount
  useEffect(() => {
    if (accessCode) {
      fetchPostAndReplies();
    }
  }, [accessCode, fetchPostAndReplies]);
  
  // Get the current user ID when the component mounts
  useEffect(() => {
    async function getUserId() {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
    }
    
    getUserId();
  }, []);
  
  // Handle marking a reply as solution
  const handleMarkAsSolution = async (replyId: string) => {
    if (!post) return;
    
    try {
      const success = await DatabaseService.markReplyAsSolution(post.id, replyId);
      
      if (success) {
        // Refresh the replies to show the updated solution status
        fetchPostAndReplies();
        message.success(t('markedAsSolution'));
      } else {
        message.error(t('errorMarkingSolution'));
      }
    } catch (err) {
      console.error('Error marking reply as solution:', err);
      message.error(t('errorMarkingSolution'));
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('loadingPost')}</p>
        </div>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout>
        <div className="error-container">
          <h2>{t('postNotFound')}</h2>
          <p>{t('postNotFoundDesc')}</p>
          <Link to="/help">
            <Button type="primary">{t('backToHelp')}</Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="help-detail-container">
        <Card className="post-card">
          <div className="post-header">
            <Link to="/help" className="back-link">
              <ArrowLeftOutlined /> {t('backToHelp')}
            </Link>
            
            <div className="post-meta">
              <span className="post-author">
                {post.is_anonymous ? t('anonymous') : t('user')}
              </span>
              <span className="post-time">{getTimeAgo(post.created_at)}</span>
            </div>
            
            <div className="post-stats">
              <span className="post-stat">
                <EyeOutlined /> {post.views || 0} {t('views')}
              </span>
              <span className="post-stat">
                <MessageOutlined /> {post.replies?.length || 0} {t('replies')}
              </span>
            </div>
          </div>
          
          <div className="post-title">
            {post.content}
          </div>
          
          <div className="post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="post-tag">{tag}</span>
            ))}
          </div>
          
          <Divider>{t('replies')} ({replies.length})</Divider>
          
          {/* Display replies */}
          <div className="replies-section">
            <h3>{t('replies')} ({replies.length})</h3>
            
            {replies.length === 0 ? (
              <p>{t('noRepliesYet')}</p>
            ) : (
              replies.map(reply => (
                <div key={reply.id} className={`reply ${reply.is_solution ? 'solution' : ''}`}>
                  <div className="reply-content">{reply.content}</div>
                  <div className="reply-meta">
                    <span>{reply.is_anonymous ? t('anonymous') : t('user')}</span>
                    <span>{getTimeAgo(reply.created_at)}</span>
                    
                    {/* Show mark as solution button for post owner */}
                    {post?.user_id === currentUserId && !reply.is_solution && (
                      <Button 
                        size="small" 
                        onClick={() => handleMarkAsSolution(reply.id)}
                      >
                        {t('markAsSolution')}
                      </Button>
                    )}
                    
                    {reply.is_solution && (
                      <span className="solution-badge">{t('solution')}</span>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Reply form */}
            <div className="reply-form-container">
              <h3>{t('addReply')}</h3>
              <ReplyForm 
                postId={post?.id || ''} 
                onReplyAdded={fetchPostAndReplies} 
              />
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default HelpDetailPage; 