import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../utils/supabaseClient';
import Layout from '../layout/Layout';
import TagSelector from '../ui/TagSelector';
import '../../styles/ConfessionPage.css';
import StorageSystem from '../../utils/StorageSystem';

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
      console.log('Attempting to submit confession to Supabase');
      // Generate a unique access code 
      const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Log the exact data we're sending to aid debugging
      const postData = { 
        title: 'Confession',
        content: confession,
        is_anonymous: isAnonymous,
        tags: selectedTags,
        status: 'open',
        access_code: accessCode,
        purpose: 'need_help',
        views: 0
      };
      
      console.log('Sending this data to Supabase:', postData);
      
      // Create a new post in the database with only the fields that exist
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select();
      
      if (error) {
        console.error('Error submitting confession:', error);
        alert('Error submitting your confession. Please try again.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Submission successful:', data);
      
      // Still track user preferences locally
      const userData = {
        userId: isAnonymous ? 'Anonymous' : 'User123',
        confessionText: confession,
        selectedTags: selectedTags,
        timestamp: new Date().toISOString(),
        accessCode: accessCode,
        privacyOption: isPrivate ? 'private' : 'public', // Store locally even if not in DB
        emailNotification: notifyViaEmail,
        email: notifyViaEmail ? email : '',
        replies: [],
        views: 0
      };
      
      // Save to localStorage for retrieval on success page
      localStorage.setItem('accessCode', accessCode);
      StorageSystem.storeData(accessCode, userData);
      
      // Navigate to success page
      console.log('Navigating to success page with accessCode:', accessCode);
      navigate('/success', { 
        state: { 
          accessCode: accessCode,
          postId: data[0]?.id || 'unknown'
        } 
      });
    } catch (err) {
      console.error('Unexpected error in form submission:', err);
      alert('An unexpected error occurred. Please try again.');
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
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  {t('postAnonymously')}
                </label>
              </div>
              
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  {t('keepPrivate')}
                </label>
              </div>
              
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
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? t('submitting') 
                  : t('send')}
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => navigate('/')}
              >
                {t('returnHome')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ConfessionPage;
