import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faEye, faCopy, faHome, faHandsHelping, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';

const SuccessPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    // Get the access code from localStorage
    const storedAccessCode = localStorage.getItem('accessCode');
    
    if (storedAccessCode) {
      setAccessCode(storedAccessCode);
      
      // Try to get user data
      const data = StorageSystem.retrieveData(storedAccessCode);
      if (data) {
        setUserData(data);
      }
    }
  }, []);
  
  // Copy access code to clipboard
  const copyAccessCode = () => {
    navigator.clipboard.writeText(accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  // View post - redirects to past-questions page
  const viewPost = () => {
    window.location.href = `/past-questions?code=${accessCode}`;
  };
  
  return (
    <section className="success-view container">
      <div className="success-header">
        <div className="success-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h1 className="success-title">{t('thankYouTitle')}</h1>
        <p className="success-subtitle">{t('thankYouSubtitle')}</p>
      </div>
      
      <div className="access-code-container">
        <h2 className="access-code-title">{t('yourAccessCode')}</h2>
        <div className="access-code-display">
          <span id="access-code">{accessCode}</span>
          <button 
            className={`copy-code-btn ${copied ? 'copied' : ''}`} 
            onClick={copyAccessCode}
            title={copied ? t('copied') : t('copyAccessCode')}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
        <p className="access-code-desc">{t('saveAccessCode')}</p>
        <button id="view-post-btn" className="view-post-btn" onClick={viewPost}>
          <FontAwesomeIcon icon={faEye} /> <span>{t('viewMyPost')}</span>
        </button>
      </div>
      
      {userData && (
        <div className="success-message">
          <div className="message-card">
            <div className="message-info">
              <div className="message-meta">
                <span className="message-author">
                  <FontAwesomeIcon icon={faCircleCheck} /> 
                  <span>{t('yourAnonymousId')}</span>
                  <span id="user-id">{userData.userId}</span>
                </span>
                <span className="message-time">{t('justPosted')}</span>
              </div>
              <div className="message-content">
                <p id="confession-preview">{userData.confessionText}</p>
              </div>
              <div className="message-tags" id="confession-tags">
                {userData.selectedTags.map((tag, index) => (
                  <span key={index} className="tag">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="success-actions">
        <p className="notification-info">{t('notifyMessage')}</p>
        <div className="action-buttons">
          <Link to="/" className="btn-primary return-home-btn">
            <FontAwesomeIcon icon={faHome} /> <span>{t('returnHome')}</span>
          </Link>
          <Link to="/help" className="btn-primary help-btn">
            <FontAwesomeIcon icon={faHandsHelping} /> <span>{t('helpOthers')}</span>
          </Link>
        </div>
      </div>
      
      <div className="success-info-box">
        <h3><FontAwesomeIcon icon={faCircleInfo} /> <span>{t('whatHappensNext')}</span></h3>
        <ul>
          <li>{t('communityWillSee')}</li>
          <li>{t('replyIn24h')}</li>
          <li>{t('emailNotification')}</li>
          <li>{t('checkWithCode')}</li>
        </ul>
      </div>
    </section>
  );
};

export default SuccessPage; 