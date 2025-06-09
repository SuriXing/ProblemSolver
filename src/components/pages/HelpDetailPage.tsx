import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { 
  Card, 
  Button, 
  Input, 
  Form,
  Avatar,
  Divider,
  message
} from 'antd';
import { 
  ArrowLeftOutlined,
  UserOutlined,
  EyeOutlined,
  MessageOutlined,
  SendOutlined
} from '@ant-design/icons';
import StorageSystem, { UserData, Reply } from '../../utils/StorageSystem';
import Layout from '../layout/Layout';
import '../../styles/HelpDetailPage.css';

const { TextArea } = Input;

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

// Generate a random helper ID
const generateHelperId = (): string => {
  return `Helper #${Math.floor(1000 + Math.random() * 9000)}`;
};

const HelpDetailPage: React.FC = () => {
  const { accessCode } = useParams<{ accessCode: string }>();
  const { t } = useTypeSafeTranslation();
  const [form] = Form.useForm();
  
  const [post, setPost] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [helperId] = useState(generateHelperId());
  
  // Load post data
  useEffect(() => {
    if (!accessCode) return;
    
    setLoading(true);
    
    try {
      // Get post data from storage
      const storage = JSON.parse(localStorage.getItem('problemSolver_userData') || '{}');
      const postData = storage[accessCode];
      
      if (postData) {
        // Check if this is a new page load or a refresh
        const isNewVisit = sessionStorage.getItem(`visited_${accessCode}`) !== 'true';
        
        let updatedPost = { ...postData };
        
        // Only increment view count if this is a new visit
        if (isNewVisit) {
          const currentViews = postData.views || 0;
          const newViews = currentViews + 1;
          
          updatedPost = { 
            ...postData,
            views: newViews
          };
          
          // Update storage
          storage[accessCode] = updatedPost;
          localStorage.setItem('problemSolver_userData', JSON.stringify(storage));
          
          // Mark this post as visited in this session
          sessionStorage.setItem(`visited_${accessCode}`, 'true');
        }
        
        setPost(updatedPost);
      }
    } catch (error) {
      console.error('Error loading post data:', error);
    }
    
    setLoading(false);
  }, [accessCode]);
  
  // Handle reply submission
  const handleSubmitReply = (values: { replyText: string }) => {
    if (!post || !values.replyText.trim()) return;
    
    setSubmitting(true);
    
    // Create new reply
    const newReply: Reply = {
      replyText: values.replyText,
      replierName: helperId,
      replyTime: new Date().toISOString()
    };
    
    // Add reply to post
    const updatedPost = {
      ...post,
      replies: [...(post.replies || []), newReply]
    };
    
    // Update storage
    StorageSystem.storeData(accessCode!, updatedPost);
    
    // Update state
    setPost(updatedPost);
    
    // Reset form
    form.resetFields();
    
    // Show success message
    message.success(t('replySubmitted'));
    
    setSubmitting(false);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="container help-detail-container">
          <div className="loading-message">{t('loading')}</div>
        </div>
      </Layout>
    );
  }
  
  if (!post) {
    return (
      <Layout>
        <div className="container help-detail-container">
          <div className="error-message">{t('postNotFound')}</div>
          <Link to="/help" className="back-link">
            <ArrowLeftOutlined /> {t('backToHelp')}
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container help-detail-container">
        <div className="page-header">
          <Link to="/help" className="back-link">
            <ArrowLeftOutlined /> {t('backToHelp')}
          </Link>
        </div>
        
        <Card className="post-detail-card">
          <div className="post-header">
            <div className="post-meta">
              <span className="post-id">ID: {post.userId}</span>
              <span className="post-time">{getTimeAgo(post.timestamp)}</span>
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
            {post.confessionText}
          </div>
          
          <div className="post-tags">
            {post.selectedTags.map(tag => (
              <span key={tag} className="post-tag">{tag}</span>
            ))}
          </div>
          
          <Divider>{t('replies')} ({post.replies?.length || 0})</Divider>
          
          {post.replies && post.replies.length > 0 ? (
            <div className="replies-list">
              {post.replies.map((reply, index) => (
                <div key={index} className="reply-item">
                  <div className="reply-header">
                    <div className="reply-author">
                      <Avatar icon={<UserOutlined />} />
                      <span>{reply.replierName}</span>
                    </div>
                    <span className="reply-time">{getTimeAgo(reply.replyTime)}</span>
                  </div>
                  <div className="reply-content">
                    {reply.replyText}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-replies">{t('noRepliesYet')}</div>
          )}
          
          <div className="reply-form">
            <h3>{t('leaveReply')}</h3>
            <Form form={form} onFinish={handleSubmitReply}>
              <Form.Item
                name="replyText"
                rules={[{ required: true, message: t('pleaseEnterReply') }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder={t('replyPlaceholder')}
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  icon={<SendOutlined />}
                >
                  {t('submitReply')}
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default HelpDetailPage; 