import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faTag, 
  faPaperPlane, 
  faLock, 
  faHandsHelping, 
  faHistory 
} from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';
import styles from './ConfessionPage.module.css';
import Layout from '../layout/Layout';
// Import the confession image
import confessionImage from '../../assets/images/confession.avif';

const ConfessionPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const navigate = useNavigate();
  
  // Form state
  const [confessionText, setConfessionText] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privacyOption, setPrivacyOption] = useState('public');
  const [emailNotification, setEmailNotification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available tags based on current language
  const availableTags = {
    'zh-CN': ['压力', '焦虑', '失眠', '人际关系', '工作', '学习'],
    'en': ['Pressure', 'Anxiety', 'Insomnia', 'Relationships', 'Work', 'Study']
  };
  
  // Get tags based on current language
  const getTags = () => {
    const currentLang = localStorage.getItem('language') || 'zh-CN';
    return availableTags[currentLang as keyof typeof availableTags] || availableTags['en'];
  };
  
  // Toggle tag selection
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confessionText.trim()) {
      alert(t('pleaseEnterConfession'));
      return;
    }
    
    if (emailNotification && !email.trim()) {
      alert(t('enterEmail'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a unique user ID and access code
      const userId = Math.floor(1000 + Math.random() * 9000).toString();
      const accessCode = StorageSystem.generateAccessCode();
      
      // Create user data object
      const userData: UserData = {
        userId,
        accessCode,
        confessionText,
        selectedTags,
        privacyOption,
        emailNotification,
        email: emailNotification ? email : '',
        timestamp: new Date().toISOString(),
        replies: [],
        views: 0 // Explicitly set views to 0
      };
      
      // Store the data in Supabase
      await StorageSystem.storeData(accessCode, userData);
      
      // Store the access code in localStorage for easy retrieval
      localStorage.setItem('accessCode', accessCode);
      
      // Store additional data like email if needed
      if (emailNotification && email) {
        localStorage.setItem('userEmail', email);
      }
      
      // Navigate to success page
      navigate('/success');
      
      // In the handleSubmit function, add this after saving the data
      console.log('Saved confession data:', userData);
      console.log('Current localStorage after save:', localStorage.getItem('problemSolver_userData'));
    } catch (error) {
      console.error('Error submitting confession:', error);
      alert(t('errorSubmittingConfession'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <h1 className={styles.pageTitle}>{t('confessionTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('confessionSubtitle')}</p>
          
          <div className={styles.storeImage}>
            <img 
              src={confessionImage}
              alt="解忧杂货铺"
            />
          </div>
          
          <form onSubmit={handleSubmit} className={styles.queryForm}>
            <textarea
              className={styles.formTextarea}
              value={confessionText}
              onChange={(e) => setConfessionText(e.target.value)}
              placeholder={t('confessionPlaceholder')}
              required
            />
            
            <div className={styles.tagSelector}>
              <p>
                <FontAwesomeIcon icon={faTag} /> {t('addTags')}
              </p>
              <div className={styles.tags}>
                {getTags().map((tag) => (
                  <span
                    key={tag}
                    className={`${styles.tag} ${selectedTags.includes(tag) ? styles.selected : ''}`}
                    onClick={() => toggleTag(tag)}
                  >
                    {selectedTags.includes(tag) && <FontAwesomeIcon icon={faCheck} />} {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.confessionOptions}>
              <div className={styles.privacyOptions}>
                <p>
                  <FontAwesomeIcon icon={faLock} /> {t('privacySettings')}
                </p>
                <div className={styles.radioOptions}>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="privacy" 
                      value="public" 
                      checked={privacyOption === 'public'}
                      onChange={() => setPrivacyOption('public')}
                    />
                    <span>{t('publicQuestion')}</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="privacy" 
                      value="private"
                      checked={privacyOption === 'private'}
                      onChange={() => setPrivacyOption('private')}
                    />
                    <span>{t('privateQuestion')}</span>
                  </label>
                </div>
              </div>
              
              <div className={styles.notificationOption}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={emailNotification}
                    onChange={(e) => setEmailNotification(e.target.checked)}
                  />
                  <span>{t('emailNotify')}</span>
                </label>
                
                {emailNotification && (
                  <div className={styles.emailInputContainer}>
                    <input
                      type="email"
                      className={styles.emailInput}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('emailPlaceholder')}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || !confessionText.trim()}
              >
                {isSubmitting ? t('submitting') : t('submitConfession')}
                {!isSubmitting && <FontAwesomeIcon icon={faPaperPlane} style={{ marginLeft: '8px' }} />}
              </button>
            </div>
          </form>
          
          <div className={styles.linksContainer}>
            <Link to="/" className={styles.secondaryLink}>
              <FontAwesomeIcon icon={faHandsHelping} /> {t('returnHome')}
            </Link>
            <Link to="/past-questions" className={styles.secondaryLink}>
              <FontAwesomeIcon icon={faHistory} /> {t('pastQuestions')}
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConfessionPage;
