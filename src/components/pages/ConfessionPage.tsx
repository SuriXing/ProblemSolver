import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../layout/Layout';
import TagSelector from '../ui/TagSelector';
import '../../styles/ConfessionPage.css';
import StorageSystem from '../../utils/StorageSystem';
import { DatabaseService } from '../../services/database.service';
import { checkThrottle, recordAction, THROTTLE_RULES } from '../../utils/rateLimit';
import { useExitNavigate } from '../../context/NavigationLockContext';
import CrisisBanner from '../shared/CrisisBanner';
import CrisisModal from '../shared/CrisisModal';
import { useCrisisDetection } from '../../hooks/useCrisisDetection';

const ConfessionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { navigateWithExit } = useExitNavigate();
  const [confession, setConfession] = useState('');
  const [isAnonymous, _setIsAnonymous] = useState(true);
  const [isPrivate, _setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{confession?: string}>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { showModal, dismiss, checkText } = useCrisisDetection();

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
    const newErrors: {confession?: string} = {};
    
    if (!confession.trim()) {
      newErrors.confession = safeT('confessionRequired', 'Please enter your confession');
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

    const throttle = checkThrottle(THROTTLE_RULES.confession);
    if (!throttle.allowed) {
      const secs = Math.ceil(throttle.retryAfterMs / 1000);
      alert(
        (t('throttleTryAgainIn', { seconds: secs }) as string) ||
          `You're posting too fast. Please try again in ${secs}s.`
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Attempting to submit confession via DatabaseService');

      // Use DatabaseService.createPost() — it handles access code generation
      // with crypto-strength randomness + uniqueness checks.
      //
      // NOTE: notify_via_email + notify_email used to be passed here, but those
      // columns don't exist in the deployed schema. The database rejected with
      // PGRST204 and the silent fallback wrote to in-memory storage, losing the
      // confession on refresh. Email opt-in is collected client-side but no
      // longer sent to the DB until a separate `post_notifications` table is
      // built (see runbook U-X5). The local UI state is preserved so users can
      // still check the box; it just doesn't persist server-side yet.
      const SUBMIT_TIMEOUT_MS = 10_000;
      const postPromise = DatabaseService.createPost({
        title: t('confessionTitle'),
        content: confession,
        is_anonymous: isAnonymous,
        tags: selectedTags,
        status: 'open',
        purpose: 'need_help',
        user_id: isAnonymous ? undefined : `anon-${crypto.getRandomValues(new Uint8Array(8)).reduce((acc, v) => acc + v.toString(16).padStart(2, '0'), '')}`,
      });
      let timerId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timerId = setTimeout(() => reject(new Error('Request timed out')), SUBMIT_TIMEOUT_MS);
      });
      const post = await Promise.race([postPromise, timeoutPromise]);
      clearTimeout(timerId);

      if (!post) {
        // createPost returned null — the database write actually failed.
        // No more silent in-memory fallback (runbook hard rule 13: silent
        // fallbacks are forbidden — they make broken states look healthy).
        // Surface the failure to the user so they can retry instead of
        // walking away with a fake access code that dies on refresh.
        console.error('DatabaseService.createPost returned null — submission failed');
        alert(
          (t('confessionFailedToSubmit') as string) ||
            'Sorry, we could not save your confession right now. Please check your connection and try again.'
        );
        return;
      }

      recordAction(THROTTLE_RULES.confession);
      const accessCode = post.access_code || 'UNKNOWN';
      console.log('Submission successful, access code:', accessCode);

      // Save to localStorage for retrieval on success page
      const userData = {
        userId: isAnonymous ? 'Anonymous' : 'user',
        confessionText: confession,
        selectedTags: selectedTags,
        timestamp: new Date().toISOString(),
        accessCode: accessCode,
        privacyOption: isPrivate ? 'private' : 'public',
        replies: [],
        views: 0
      };

      localStorage.setItem('accessCode', accessCode);
      StorageSystem.storeData(accessCode, userData);

      // Save to savedAccessCodes for the Past Questions page
      try {
        const saved = JSON.parse(localStorage.getItem('savedAccessCodes') || '[]');
        saved.push({ code: accessCode, timestamp: Date.now(), preview: confession.slice(0, 50) });
        localStorage.setItem('savedAccessCodes', JSON.stringify(saved));
      } catch {
        // Non-critical — don't block navigation on storage failure
      }

      navigate('/success', {
        state: {
          accessCode: accessCode,
          postId: post.id
        }
      });
    } catch (err) {
      console.error('Unexpected error in form submission:', err);
      const fallback = safeT('confessionSubmitError', 'Something went wrong. Please try again.');
      alert(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagSelection = (tags: string[]) => {
    setSelectedTags(tags);
  };

  return (
    <Layout>
      <div className="confession-page page-fade-in">
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
              <label htmlFor="confession-textarea" className="sr-only">
                {t('confessionTextareaLabel') || 'Write your confession'}
              </label>
              <textarea
                id="confession-textarea"
                ref={textareaRef}
                className={`confession-textarea ${errors.confession ? 'error' : ''}`}
                value={confession}
                onChange={(e) => { const v = e.target.value.slice(0, 4000); setConfession(v); checkText(v); }}
                placeholder={t('confessionPlaceholder') || 'Type your confession here...'}
                rows={8}
                maxLength={4000}
                aria-label={t('confessionTextareaLabel') || 'Write your confession'}
                aria-required="true"
                aria-invalid={errors.confession ? 'true' : 'false'}
                aria-describedby={errors.confession ? 'confession-error' : 'confession-char-count'}
              />
              <div
                id="confession-char-count"
                style={{ fontSize: '0.85rem', color: confession.length > 3800 ? '#e53935' : '#888', textAlign: 'right', marginTop: 4 }}
              >
                {confession.length} / 4000
              </div>
              {errors.confession && (
                <div id="confession-error" className="error-message" role="alert">
                  {errors.confession}
                </div>
              )}
            </div>
            
            <TagSelector 
              onTagsSelected={handleTagSelection} 
              initialTags={selectedTags}
              labelText={t('addTags') || 'Add Tags'}
            />
            
            <div className="form-section">
              <h3>{t('privacySettings')}</h3>
              <div className="checkbox-group">
                <label className="checkbox-label is disabled">
                  <input type="checkbox" disabled />
                  {t('notifyViaEmail')}
                </label>
                <p className="email-note">{t('notifyComingSoon')}</p>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn-primary-outline"
                onClick={() => navigateWithExit('/')}
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
          <CrisisBanner prominent />
        </div>
      </div>
      <CrisisModal open={showModal} onDismiss={dismiss} />
    </Layout>
  );
};

export default ConfessionPage;
