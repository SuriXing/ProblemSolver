import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTag, faPaperPlane, faLock } from '@fortawesome/free-solid-svg-icons';
import StorageSystem, { UserData } from '../../utils/StorageSystem';

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
  const handleSubmit = (e: React.FormEvent) => {
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
      replies: []
    };
    
    // Store the data
    StorageSystem.storeData(accessCode, userData);
    
    // Also store the access code for easy retrieval
    localStorage.setItem('accessCode', accessCode);
    
    // Store additional data like email if needed
    if (emailNotification && email) {
      localStorage.setItem('userEmail', email);
    }
    
    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/success');
    }, 1500);
  };
  
  return (
    <section className="confession-view container">
      <div className="confession-header">
        <h1 className="confession-title">{t('confessionTitle')}</h1>
        <p className="confession-subtitle">{t('confessionSubtitle')}</p>
      </div>
      
      <div className="confession-form">
        <form onSubmit={handleSubmit}>
          <div className="confession-image">
            <img 
              src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80" 
              alt="信件"
            />
          </div>
          
          <textarea
            value={confessionText}
            onChange={(e) => setConfessionText(e.target.value)}
            placeholder={t('confessionPlaceholder')}
            rows={8}
            required
          />
          
          <div className="tag-selector">
            <p><FontAwesomeIcon icon={faTag} /> {t('addTags')}</p>
            <div className="tags">
              {getTags().map((tag) => (
                <span
                  key={tag}
                  className={`tag ${selectedTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {selectedTags.includes(tag) && <FontAwesomeIcon icon={faCheck} />} {tag}
                </span>
              ))}
            </div>
          </div>
          
          <div className="confession-options">
            <div className="privacy-options">
              <p><FontAwesomeIcon icon={faLock} /> {t('privacySettings')}</p>
              <div className="radio-options">
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="privacy" 
                    value="public" 
                    checked={privacyOption === 'public'}
                    onChange={() => setPrivacyOption('public')}
                  />
                  <span className="radio-custom"></span>
                  <span>{t('publicQuestion')}</span>
                </label>
                <label className="radio-label">
                  <input 
                    type="radio" 
                    name="privacy" 
                    value="private"
                    checked={privacyOption === 'private'}
                    onChange={() => setPrivacyOption('private')}
                  />
                  <span className="radio-custom"></span>
                  <span>{t('privateQuestion')}</span>
                </label>
              </div>
            </div>
            
            <div className="notification-option">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={emailNotification}
                  onChange={(e) => setEmailNotification(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span>{t('emailNotify')}</span>
              </label>
              {emailNotification && (
                <div className="email-input-container">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    required
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary submit-confession-btn"
              disabled={isSubmitting || !confessionText.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> {isSubmitting ? t('submitting') : t('send')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ConfessionPage;
