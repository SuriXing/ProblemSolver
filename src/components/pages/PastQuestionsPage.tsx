import React, { useState, useEffect } from 'react';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';
import Layout from '../layout/Layout';
import { supabase } from '../../lib/supabase';
import { IS_PROD } from '../../utils/environment';
import DebugMenu from '../DebugMenu';
import { DatabaseService } from '../../services/database.service';
import { Input, Button, Form, Card, Alert } from 'antd';

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

// 添加属性接口
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

// 修改组件定义以接受属性
const PastQuestionsPage: React.FC<PastQuestionsPageProps> = ({ showDebug, debugProps }) => {
  const { t } = useTypeSafeTranslation();
  const location = useLocation();
  
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'help_needed' | 'help_offered'>('all');
  
  // Clear access code when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      setAccessCode('');
      // Also clear from localStorage if you're storing it there
      localStorage.removeItem('accessCode');
    };
  }, []);
  
  // Clear access code after successful retrieval
  useEffect(() => {
    if (userData) {
      setAccessCode('');
    }
  }, [userData]);
  
  // 在组件内部添加这个 useEffect
  useEffect(() => {
    // 检查会话存储中是否有临时访问码
    const tempAccessCode = sessionStorage.getItem('temp_access_code');
    if (tempAccessCode) {
      // 使用这个访问码
      setAccessCode(tempAccessCode);
      fetchQuestions(tempAccessCode);
      // 使用后清除
      sessionStorage.removeItem('temp_access_code');
    }
  }, []);
  
  const fetchQuestions = async (code: string) => {
    if (!code) return;
    
    console.log('Fetching post with access code:', code);
    setLoading(true);
    setError(null);
    
    try {
      // 直接调用 DatabaseService 获取帖子
      const post = await DatabaseService.getPostByAccessCode(code);
      console.log('Fetch result:', post);
      
      if (post) {
        // 将数据转换为旧格式以便向后兼容，添加所有必需的字段
        const fetchedData: UserData = {
          userId: post.user_id || 'anonymous',
          confessionText: post.content,
          selectedTags: post.tags || [],
          timestamp: post.created_at,
          // 添加所有必需的字段并设置默认值
          accessCode: post.access_code || code,
          privacyOption: post.is_anonymous ? 'private' : 'public',
          emailNotification: false,
          email: '',
          views: 0,
          // 添加类型注解给 reply 参数
          replies: post.replies?.map((reply: any) => ({
            replierName: reply.user_id || 'anonymous',
            replyText: reply.content,
            replyTime: reply.created_at
          })) || []
        };
        
        setUserData(fetchedData);
      } else {
        setError('我们找不到与此访问码关联的帖子。请检查您的访问码并重试。');
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('获取数据时出错。请稍后再试。');
    } finally {
      setLoading(false);
    }
  };

  // 替换为表单提交处理函数
  const handleSubmit = (values: { accessCode: string }) => {
    if (values.accessCode.trim()) {
      fetchQuestions(values.accessCode.trim());
    }
  };
  
  const loadDemo = () => {
    fetchQuestions('demo');
  };
  
  const fetchPosts = async () => {
    let query = supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activeTab === 'help_needed') {
      query = query.eq('purpose', 'need_help');
    } else if (activeTab === 'help_offered') {
      query = query.eq('purpose', 'offer_help');
    }
    
    // ... 现有代码 ...
  };
  
  return (
    <Layout>
      <section className="past-questions-view">
        <h2>{t('pastQuestions')}</h2>
        
        {/* 添加访问码表单 */}
        <Card title={t('enterAccessCode')} style={{ marginBottom: 20 }}>
          <Form
            onFinish={handleSubmit}
            initialValues={{ accessCode: '' }}
            layout="vertical"
          >
            <Form.Item
              name="accessCode"
              label={t('accessCode')}
              rules={[{ required: true, message: t('pleaseEnterAccessCode') }]}
            >
              <Input 
                placeholder={t('enterAccessCode')}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('getQuestion')}
              </Button>
            </Form.Item>
          </Form>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ marginTop: 16 }} 
            />
          )}
        </Card>
        
        {/* Loading indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p style={{ marginTop: '15px' }}>{t('loading')}</p>
          </div>
        )}
        
        {/* No data message */}
        {!loading && !error && !userData && (
          <div style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
            <h3>{t('noQuestionsFound')}</h3>
            <p>{t('tryAgain')}</p>
          </div>
        )}
        
        {/* Display user data */}
        {userData && (
          <div className="questions-results-section">
            <div className="question-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                  <span>{t('yourAnonymousId')}</span>{userData.userId}
                </h3>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {getTimeAgo(userData.timestamp)}
                </span>
              </div>
              
              <p style={{ marginBottom: '15px' }}>{userData.confessionText}</p>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {userData.selectedTags.map((tag, index) => (
                  <span 
                    key={index} 
                    style={{ 
                      backgroundColor: '#e5e7eb', 
                      padding: '4px 10px', 
                      borderRadius: '15px', 
                      fontSize: '12px' 
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              {/* Replies */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                <h4 style={{ marginTop: 0 }}>
                  <span>{t('replies')}</span> ({userData.replies.length})
                </h4>
                
                {userData.replies.length > 0 ? (
                  userData.replies.map((reply, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        marginBottom: '10px' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 500 }}>{reply.replierName}</span>
                        <span style={{ color: '#6b7280', fontSize: '12px' }}>{reply.replyTime}</span>
                      </div>
                      <p style={{ margin: 0 }}>{reply.replyText}</p>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#6b7280' }}>
                    <span>{t('noRepliesYet')}</span>. <span>{t('checkBackLater')}</span>.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t('allPosts')}
          </button>
          <button 
            className={`tab ${activeTab === 'help_needed' ? 'active' : ''}`}
            onClick={() => setActiveTab('help_needed')}
          >
            {t('helpNeeded')}
          </button>
          <button 
            className={`tab ${activeTab === 'help_offered' ? 'active' : ''}`}
            onClick={() => setActiveTab('help_offered')}
          >
            {t('helpOffered')}
          </button>
        </div>
      </section>
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
      {IS_PROD ? null : (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          margin: '10px 0', 
          border: '1px solid #ddd',
          borderRadius: '4px' 
        }}>
          <h4>当前访问码: {accessCode || '无'}</h4>
          <div>
            <Input 
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="输入访问码测试"
              style={{ width: 200, marginRight: 10 }}
            />
            <Button 
              onClick={() => fetchQuestions(accessCode)}
              loading={loading}
            >
              测试
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PastQuestionsPage;
