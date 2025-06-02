import React, { useState, useEffect } from 'react';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';
import Layout from '../layout/Layout';

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

const PastQuestionsPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const location = useLocation();
  
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  
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
  
  const fetchQuestions = (code: string) => {
    if (!code) {
      setError(t('errorAccessCode'));
      return;
    }
    
    // Reset state
    setError(null);
    setLoading(true);
    
    // Simulate loading delay as in the original code
    setTimeout(() => {
      // Check if we have data in the storage system
      if (StorageSystem.checkAccessCode(code)) {
        const data = StorageSystem.retrieveData(code);
        if (data) {
          setUserData(data);
          setLoading(false);
          return;
        }
      }
      
      // Handle special access codes
      if (code === 'TSZT-VVSM-8F8Y') {
        // Create sample data for this access code
        const data: UserData = {
          userId: "9524",
          accessCode: "TSZT-VVSM-8F8Y",
          confessionText: "我最近在社交场合感到焦虑，尤其是与新同事交流时。我担心自己说错话或给人留下不好的印象。有谁能给我一些建议如何克服这种社交焦虑？",
          selectedTags: ["焦虑", "社交", "人际关系"],
          privacyOption: "public",
          emailNotification: false,
          email: "",
          timestamp: new Date().toISOString(),
          replies: [
            {
              replyText: "社交焦虑是非常常见的。试着从小的交流开始，比如先与一两个同事简短交谈。准备一些可以讨论的话题也会有帮助。记住，大多数人都在关注自己的表现，而不是评判你。深呼吸和正念练习也可以帮助缓解焦虑。",
              replierName: "Helper #6378",
              replyTime: "刚刚"
            },
            {
              replyText: "作为一个曾经有社交焦虑的人，我理解你的感受。一个有用的技巧是提前练习对话，甚至可以在镜子前练习。另外，不要给自己太大压力，与人交流是需要时间和实践的技能。如果焦虑严重，也可以考虑寻求专业心理咨询。",
              replierName: "Helper #2935",
              replyTime: "5分钟前"
            }
          ]
        };
        
        // Store data for future retrieval
        StorageSystem.storeData(code, data);
        setUserData(data);
        setLoading(false);
        return;
      }
      
      // Handle demo access code here if needed
      // For now, show error for non-special codes
      setError(t('errorAccessCode'));
      setLoading(false);
    }, 1500);
  };

  // Check for access code in URL or localStorage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codeFromUrl = params.get('code');
    const codeFromStorage = localStorage.getItem('accessCode');
    
    if (codeFromUrl) {
      setAccessCode(codeFromUrl);
      fetchQuestions(codeFromUrl);
    } else if (codeFromStorage) {
      setAccessCode(codeFromStorage);
      fetchQuestions(codeFromStorage);
    }
  }, [location]);
  
  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccessCode(e.target.value);
  };
  
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchQuestions(accessCode);
  };
  
  const loadDemo = () => {
    fetchQuestions('demo');
  };
  
  return (
    <Layout>
      <section className="past-questions-view">
        <div className="access-code-section">
          <h2>{t('accessCodeTitle')}</h2>
          <p>{t('accessCodeDesc')}</p>
          
          <form className="access-code-form" onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label htmlFor="accessCodeInput">{t('enterAccessCode')}</label>
              <div className="access-code-input-container">
                <input
                  id="accessCodeInput"
                  className="access-code-input"
                  type="text"
                  value={accessCode}
                  onChange={handleAccessCodeChange}
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>
            </div>
            
            <div>
              <button type="submit" className="btn-primary">
                {t('fetchButton')}
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ marginLeft: '10px', background: '#6b7280' }}
                onClick={loadDemo}
              >
                {t('loadDemo')}
              </button>
            </div>
          </form>
          
          {/* Error message */}
          {error && (
            <div className="error-message">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}
        </div>
        
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
      </section>
    </Layout>
  );
};

export default PastQuestionsPage;
