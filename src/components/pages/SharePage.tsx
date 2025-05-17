import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faCopy, 
  faCheck,
  faShare, 
  faEnvelope, 
  faLink,
  faExclamationCircle,
  faGlobe,
  faPaperPlane,
  faPhone,
  faComment,
  faCommentDots,
  faShareAlt
} from '@fortawesome/free-solid-svg-icons';
import StorageSystem from '../../utils/StorageSystem';
import styles from './SharePage.module.css';

const SharePage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  // Get the base URL
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/past-questions?code=${accessCode}`;
  
  useEffect(() => {
    if (accessCode) {
      // Simulate fetching data
      setTimeout(() => {
        try {
          if (StorageSystem.checkAccessCode(accessCode)) {
            const data = StorageSystem.retrieveData(accessCode);
            if (data) {
              setUserData(data);
            } else {
              setError(t('errorRetrievingData'));
            }
          } else {
            setError(t('invalidAccessCode'));
          }
        } catch (err) {
          setError(t('somethingWentWrong'));
        } finally {
          setIsLoading(false);
        }
      }, 800);
    } else {
      setError(t('noAccessCodeProvided'));
      setIsLoading(false);
    }
  }, [accessCode, t]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const shareViaEmail = () => {
    const subject = encodeURIComponent(t('checkOutMyQuestion'));
    const body = encodeURIComponent(`${t('emailShareBody')}: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };
  
  const shareToSocialMedia = (platform: string) => {
    let shareLink = '';
    const text = encodeURIComponent(t('socialShareText'));
    const url = encodeURIComponent(shareUrl);
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        shareLink = `https://api.whatsapp.com/send?text=${text} ${url}`;
        break;
      case 'weibo':
        shareLink = `https://service.weibo.com/share/share.php?url=${url}&title=${text}`;
        break;
      case 'wechat':
        // WeChat sharing typically requires a QR code
        alert(t('scanQrCodeToShare'));
        return;
      case 'qq':
        shareLink = `https://connect.qq.com/widget/shareqq/index.html?url=${url}&title=${text}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  if (error || !userData) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationCircle} size="3x" className={styles.errorIcon} />
        <h2>{t('errorOccurred')}</h2>
        <p>{error || t('unableToLoadData')}</p>
        <div className={styles.errorActions}>
          <Link to="/" className={styles.returnHomeBtn}>
            <FontAwesomeIcon icon={faArrowLeft} /> {t('returnHome')}
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.sharePageContainer}>
      <div className={styles.navigationBar}>
        <Link to={`/past-questions?code=${accessCode}`} className={styles.backLink}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>{t('backToQuestion')}</span>
        </Link>
      </div>
      
      <div className={styles.shareHeader}>
        <div className={styles.shareIcon}>
          <FontAwesomeIcon icon={faShare} />
        </div>
        <h1 className={styles.shareTitle}>{t('shareYourQuestion')}</h1>
        <p className={styles.shareSubtitle}>{t('shareSubtitle')}</p>
      </div>
      
      <div className={styles.shareContent}>
        <div className={styles.shareCard}>
          <h2 className={styles.shareCardTitle}>{t('shareLinkTitle')}</h2>
          
          <div className={styles.shareLinkContainer}>
            <input 
              type="text" 
              value={shareUrl} 
              readOnly 
              className={styles.shareLinkInput}
            />
            <button 
              className={styles.copyLinkBtn} 
              onClick={copyToClipboard}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
              <span>{copied ? t('copied') : t('copy')}</span>
            </button>
          </div>
          
          <h3 className={styles.socialShareTitle}>{t('socialShareTitle')}</h3>
          <div className={styles.socialButtons}>
            <button 
              className={`${styles.socialButton} ${styles.facebook}`}
              onClick={() => shareToSocialMedia('facebook')}
              aria-label="Share to Facebook"
            >
              <FontAwesomeIcon icon={faGlobe} />
            </button>
            <button 
              className={`${styles.socialButton} ${styles.twitter}`}
              onClick={() => shareToSocialMedia('twitter')}
              aria-label="Share to Twitter"
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
            <button 
              className={`${styles.socialButton} ${styles.whatsapp}`}
              onClick={() => shareToSocialMedia('whatsapp')}
              aria-label="Share to WhatsApp"
            >
              <FontAwesomeIcon icon={faPhone} />
            </button>
            <button 
              className={`${styles.socialButton} ${styles.wechat}`}
              onClick={() => shareToSocialMedia('wechat')}
              aria-label="Share to WeChat"
            >
              <FontAwesomeIcon icon={faComment} />
            </button>
            <button 
              className={`${styles.socialButton} ${styles.weibo}`}
              onClick={() => shareToSocialMedia('weibo')}
              aria-label="Share to Weibo"
            >
              <FontAwesomeIcon icon={faCommentDots} />
            </button>
            <button 
              className={`${styles.socialButton} ${styles.qq}`}
              onClick={() => shareToSocialMedia('qq')}
              aria-label="Share to QQ"
            >
              <FontAwesomeIcon icon={faShareAlt} />
            </button>
          </div>
          
          <div className={styles.otherShareOptions}>
            <button 
              className={styles.shareOptionBtn}
              onClick={shareViaEmail}
            >
              <FontAwesomeIcon icon={faEnvelope} />
              <span>{t('shareByEmail')}</span>
            </button>
            <button 
              className={styles.shareOptionBtn}
              onClick={copyToClipboard}
            >
              <FontAwesomeIcon icon={faLink} />
              <span>{t('copyLink')}</span>
            </button>
          </div>
        </div>
        
        <div className={styles.shareInfo}>
          <h3 className={styles.shareInfoTitle}>{t('whoCanSee')}</h3>
          <p className={styles.shareInfoText}>
            {userData.privacyOption === 'public' 
              ? t('publicQuestionInfo') 
              : t('privateQuestionInfo')}
          </p>
          
          <div className={styles.shareActions}>
            <Link to="/" className={styles.returnHomeBtn}>
              {t('returnHome')}
            </Link>
            <Link to="/help" className={styles.helpOthersBtn}>
              {t('helpOthers')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePage; 