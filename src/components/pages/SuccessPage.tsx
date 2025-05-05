import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faEye, faCopy, faHome, faHandsHelping, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';
import styles from './SuccessPage.module.css';

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
        data.then((result: UserData | null) => {
          if (result) {
            setUserData(result);
          }
        });
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
  
  // 在创建分享链接时
  const shareLink = `${window.location.origin}/share/${accessCode}`;
  
  // 或者，更安全的方式是创建一个一次性的分享令牌
  // 这需要在后端添加额外的功能
  
  return (
    <section className={styles.successView}>
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h1 className={styles.successTitle}>{t('thankYouTitle')}</h1>
        <p className={styles.successSubtitle}>{t('thankYouSubtitle')}</p>
      </div>
      
      <div className={styles.accessCodeContainer}>
        <h2 className={styles.accessCodeTitle}>{t('yourAccessCode')}</h2>
        <div className={styles.accessCodeDisplay}>
          <span id="access-code">{accessCode}</span>
          <button 
            className={`${styles.copyCodeBtn} ${copied ? styles.copied : ''}`} 
            onClick={copyAccessCode}
            title={copied ? t('copied') : t('copyAccessCode')}
          >
            <FontAwesomeIcon icon={faCopy} />
          </button>
        </div>
        <p className={styles.accessCodeDesc}>{t('saveAccessCode')}</p>
        <button id="view-post-btn" className={styles.viewPostBtn} onClick={viewPost}>
          <FontAwesomeIcon icon={faEye} /> <span>{t('viewMyPost')}</span>
        </button>
      </div>
      
      {userData && (
        <div className={styles.successMessage}>
          <div className={styles.messageCard}>
            <div className={styles.messageInfo}>
              <div className={styles.messageMeta}>
                <span className={styles.messageAuthor}>
                  <FontAwesomeIcon icon={faCircleCheck} /> 
                  <span>{t('yourAnonymousId')}</span>
                  <span id="user-id">{userData.userId}</span>
                </span>
                <span className={styles.messageTime}>{t('justPosted')}</span>
              </div>
              <div className={styles.messageContent}>
                <p id="confession-preview">{userData.confessionText}</p>
              </div>
              <div className={styles.messageTags} id="confession-tags">
                {userData.selectedTags.map((tag, index) => (
                  <span key={index} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={styles.successActions}>
        <p className={styles.notificationInfo}>{t('notifyMessage')}</p>
        <div className={styles.actionButtons}>
          <Link to="/" className={`${styles.returnHomeBtn}`}>
            <FontAwesomeIcon icon={faHome} /> <span>{t('returnHome')}</span>
          </Link>
          <Link to="/help" className={`${styles.helpBtn}`}>
            <FontAwesomeIcon icon={faHandsHelping} /> <span>{t('helpOthers')}</span>
          </Link>
        </div>
      </div>
      
      <div className={styles.successInfoBox}>
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