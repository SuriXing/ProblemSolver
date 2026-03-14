import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import TagSelector from '../ui/TagSelector';
import '../../styles/ConfessionPage.css';
import StorageSystem from '../../utils/StorageSystem';
import { DatabaseService } from '../../services/database.service';

const ConfessionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confession, setConfession] = useState('');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [notifyViaEmail, setNotifyViaEmail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{confession?: string; email?: string}>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Safe translation function
  const safeT = (key: string, fallback: string) => {
    try {
      const translation = t(key);
      return translation === key ? fallback : translation;
    } catch (e) {
      console.warn(`Translation error for key '${key}':`, e);
      return fallback;
    }
  };

  useEffect(() => {
    // Focus the textarea when component mounts
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: {confession?: string; email?: string} = {};
    
    if (!confession.trim()) {
      newErrors.confession = safeT('confessionRequired', 'Please enter your confession');
    }
    
    if (notifyViaEmail && (!email || !email.includes('@'))) {
      newErrors.email = safeT('validEmailRequired', 'Please enter a valid email address');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit button clicked');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to submit confession via DatabaseService');

      // Use DatabaseService.createPost() — it handles access code generation
      // with crypto-strength randomness + uniqueness checks
      const post = await DatabaseService.createPost({
        title: 'Confession',
        content: confession,
        is_anonymous: isAnonymous,
        tags: selectedTags,
        status: 'open',
        purpose: 'need_help',
        user_id: isAnonymous ? undefined : 'User123'
      });

      if (!post) {
        // createPost returned null — network or DB issue
        console.warn('DatabaseService.createPost returned null, attempting local fallback');

        // Generate a local fallback code for offline use
        const fallbackCode = crypto.getRandomValues(new Uint8Array(4))
          .reduce((acc, v) => acc + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[v % 36], '');

        const userData = {
          userId: isAnonymous ? 'Anonymous' : 'User123',
          confessionText: confession,
          selectedTags: selectedTags,
          timestamp: new Date().toISOString(),
          accessCode: fallbackCode,
          privacyOption: isPrivate ? 'private' : 'public',
          emailNotification: notifyViaEmail,
          email: notifyViaEmail ? email : '',
          replies: [],
          views: 0
        };

        localStorage.setItem('accessCode', fallbackCode);
        StorageSystem.storeData(fallbackCode, userData);
        navigate('/success', {
          state: { accessCode: fallbackCode, postId: 'local-fallback' }
        });
        return;
      }

      const accessCode = post.access_code || 'UNKNOWN';
      console.log('Submission successful, access code:', accessCode);

      // Save to localStorage for retrieval on success page
      const userData = {
        userId: isAnonymous ? 'Anonymous' : 'User123',
        confessionText: confession,
        selectedTags: selectedTags,
        timestamp: new Date().toISOString(),
        accessCode: accessCode,
        privacyOption: isPrivate ? 'private' : 'public',
        emailNotification: notifyViaEmail,
        email: notifyViaEmail ? email : '',
        replies: [],
        views: 0
      };

      localStorage.setItem('accessCode', accessCode);
      StorageSystem.storeData(accessCode, userData);

      navigate('/success', {
        state: {
          accessCode: accessCode,
          postId: post.id
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Unexpected error in form submission:', err);
      alert(`An unexpected error occurred: ${message}`);
      setIsSubmitting(false);
    }
  };

  const handleTagSelection = (tags: string[]) => {
    setSelectedTags(tags);
  };

  return (
    <Layout>
      <div className="confession-page">
        <div className="container">
          <h1 className="confession-title">{t('confessionTitle')}</h1>
          <p className="confession-subtitle">{t('confessionSubtitle')}</p>
          
          <form onSubmit={handleSubmit} className="confession-form">
            {/* Privacy Warning Box */}
            <div className="privacy-warning-box">
              <div className="warning-icon">⚠️</div>
              <div className="warning-content">
                <h3 className="warning-title">{safeT('privacyWarningTitle', 'Important Privacy Notice')}</h3>
                <p className="warning-text">
                  {safeT('privacyWarningText', 'We know you may be feeling very emotional right now, but please remember: DO NOT include real names, specific locations, or identifying details about yourself or others. This protects everyone\'s privacy and could prevent you from getting into even worse troubles. Keep your sharing anonymous and safe.')}
                </p>
              </div>
            </div>
            
            <div className="form-group">
              <textarea
                ref={textareaRef}
                className={`confession-textarea ${errors.confession ? 'error' : ''}`}
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                placeholder={t('confessionPlaceholder') || 'Type your confession here...'}
                rows={8}
              />
              {errors.confession && <div className="error-message">{errors.confession}</div>}
            </div>
            
            <TagSelector 
              onTagsSelected={handleTagSelection} 
              initialTags={selectedTags}
              labelText={t('addTags') || 'Add Tags'}
            />
            
            <div className="form-section">
              <h3>{t('privacySettings')}</h3>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={notifyViaEmail}
                    onChange={(e) => setNotifyViaEmail(e.target.checked)}
                  />
                  {t('notifyViaEmail')}
                </label>
              </div>
              {notifyViaEmail && (
                <div className="form-group">
                  <input
                    type="email"
                    className={`email-input ${errors.email ? 'error' : ''}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder') || 'Enter your email'}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-primary-outline" 
                onClick={() => navigate('/')}
              >
                {t('returnHome')}
              </button>
              <button 
                type="submit" 
                className="btn-primary-outline" 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? t('submitting') 
                  : t('send')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ConfessionPage;
