import React, { useState, useEffect } from 'react';
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
import styles from './ConfessionPage.module.css';
import Layout from '../layout/Layout';
// Import the confession image
import confessionImage from '../../assets/images/confession.avif';
import { Post } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { DatabaseService } from '../../services/database.service';
import { InsertTables } from '../../types/database.types';
import { getCurrentUserId } from '../../utils/authHelpers';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [confessions, setConfessions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false);
  
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
      // Get the current user ID
      const userId = await getCurrentUserId();
      console.log('Current user ID:', userId);
      
      // Create post data
      const postData: Omit<InsertTables<'posts'>, 'id' | 'created_at' | 'updated_at' | 'views'> = {
        title: confessionText.substring(0, 50) + (confessionText.length > 50 ? '...' : ''),
        content: confessionText,
        purpose: 'need_help' as any,
        tags: selectedTags,
        is_anonymous: privacyOption === 'private',
        status: 'open',
        user_id: userId
      };
      
      console.log('Submitting post data:', postData);
      
      // Store in Supabase
      const newPost = await DatabaseService.createPost(postData);
      
      if (!newPost) {
        throw new Error('Failed to create post');
      }
      
      console.log('Post created successfully:', newPost);
      
      // Store the access code in localStorage for easy retrieval
      localStorage.setItem('accessCode', newPost.access_code || '');
      
      // Store additional data like email if needed
      if (emailNotification && email) {
        localStorage.setItem('userEmail', email);
      }
      
      // Navigate to success page
      navigate('/success');
      
    } catch (error) {
      console.error('Error submitting confession:', error);
      // Show more detailed error message
      if (error instanceof Error) {
        alert(`${t('errorSubmittingConfession')}: ${error.message}`);
      } else {
        alert(t('errorSubmittingConfession'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  useEffect(() => {
    async function fetchConfessions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('purpose', 'need_help'); // 从 'sharing_experience' 改为 'need_help'
          
        if (error) {
          throw error;
        }
        
        if (data) {
          setConfessions(data as Post[]);
        }
      } catch (error) {
        console.error('Error fetching confessions:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchConfessions();
  }, []);
  
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
