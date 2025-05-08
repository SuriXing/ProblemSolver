import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser,
  faClock,
  faArrowLeft,
  faExclamationCircle,
  faPaperPlane,
  faCheckCircle,
  faHandsHelping,
  faHistory,
  faSmile,
  faHeart,
  faThumbsUp
} from '@fortawesome/free-solid-svg-icons';
import { retrievePostData, checkAccessCode, storePostData } from '../../utils/storage-system';
import { getTimeAgo } from '../../utils/helpers';
import { Post, Reply } from '../../types/post';
import styles from './DetailPage.module.css';
import Layout from '../layout/Layout';
import { useTranslation } from 'react-i18next';

const DetailPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const { t: i18nT } = useTranslation();
  
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  
  useEffect(() => {
    if (accessCode) {
      fetchPost(accessCode);
    } else {
      setError(t('noAccessCodeProvided'));
      setIsLoading(false);
    }
  }, [accessCode, t]);
  
  const fetchPost = (code: string) => {
    setIsLoading(true);
    setError(null);
    
    setTimeout(() => {
      if (!checkAccessCode(code)) {
        setError(t('invalidAccessCode'));
        setIsLoading(false);
        return;
      }
      
      const userData = retrievePostData(code);
      
      if (!userData) {
        setError(t('errorRetrievingData'));
        setIsLoading(false);
        return;
      }
      
      setPost(userData);
      setIsLoading(false);
    }, 1000);
  };
  
  const handleSubmitReply = async () => {
    if (!replyText.trim() || !post || !accessCode) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate a random helper ID
      const helperId = Math.random().toString(36).substring(2, 10);
      
      const newReply: Reply = {
        id: `reply-${Date.now()}`,
        author: `${t('helper')} #${helperId.substring(0, 4)}`,
        content: replyText,
        createdAt: Date.now(),
        isHelper: true,
        reaction: selectedReaction
      };
      
      // Get current post data
      const currentData = retrievePostData(accessCode);
      if (!currentData) {
        throw new Error(t('couldNotRetrieveData'));
      }
      
      // Add new reply
      const updatedData = {
        ...currentData,
        replies: [...(currentData.replies || []), newReply]
      };
      
      // Update storage
      storePostData(accessCode, updatedData);
      
      // Update local state
      setPost(updatedData);
      setReplySuccess(true);
      setReplyText('');
      setSelectedReaction(null);
      
      // Reset success message after a few seconds
      setTimeout(() => {
        setReplySuccess(false);
      }, 5000);
    } catch (error) {
      console.error(t('errorSubmittingReply'), error);
      setError(t('failedToSubmitReply'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReactionSelect = (reaction: string) => {
    setSelectedReaction(selectedReaction === reaction ? null : reaction);
  };
  
  function renderTag(tag: string) {
    return i18nT(`tag${tag.charAt(0).toUpperCase() + tag.slice(1)}`, tag);
  }
  
  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{t('loading')}</p>
      </div>
    );
  }
  
  if (error || !post) {
    return (
      <div className={styles.error}>
        <FontAwesomeIcon icon={faExclamationCircle} />
        <p>{error || t('noQuestionFound')}</p>
        <Link to="/" className={styles.backLink}>
          <FontAwesomeIcon icon={faArrowLeft} />
          {t('returnHome')}
        </Link>
      </div>
    );
  }
  
  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <Link to="/" className={styles.logo}>
            <FontAwesomeIcon icon={faHandsHelping} />
            <span>{t('siteName')}</span>
          </Link>
          <Link to="/help" className={styles.navLink}>
            <FontAwesomeIcon icon={faHistory} />
            <span>{t('backToQuestions')}</span>
          </Link>
        </div>
        
        <div className={styles.mainContent}>
          <h1 className={styles.pageTitle}>{t('helpDetailTitle')}</h1>
          <p className={styles.pageSubtitle}>{t('helpDetailSubtitle')}</p>
          
          <Link to="/help" className={styles.backLink}>
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('backToQuestions')}
          </Link>
          
          <div className={styles.questionCard}>
            {post.imageUrl && (
              <img 
                src={post.imageUrl} 
                alt={t('questionVisual')}
                className={styles.messageImage}
              />
            )}
            
            <div className={styles.messageHeader}>
              <FontAwesomeIcon icon={faUser} />
              <span className={styles.messageId}>
                {t('anonymousUser')} #{post.userId?.substring(0, 4) || t('unknown')}
              </span>
            </div>
            
            <div className={styles.messageContent}>
              {post.confessionText || post.content}
            </div>
            
            <div className={styles.messageTags}>
              {(post.selectedTags || post.tags || []).map((tag: string, index: number) => (
                <span key={index} className={styles.tag}>{renderTag(tag)}</span>
              ))}
            </div>
            
            <div className={styles.messageTime}>
              <FontAwesomeIcon icon={faClock} style={{ marginRight: '6px' }} />
              {getTimeAgo(typeof post.timestamp === 'string' ? new Date(post.timestamp).getTime() : post.createdAt as number)}
            </div>
            
            <textarea
              className={styles.responseInput}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={t('writeYourResponse')}
              rows={5}
            ></textarea>
            
            <div className={styles.reactionBar}>
              <div 
                className={`${styles.reaction} ${selectedReaction === 'smile' ? styles.selected : ''}`}
                onClick={() => handleReactionSelect('smile')}
                title={t('reactionSmile')}
              >
                <FontAwesomeIcon icon={faSmile} />
              </div>
              <div 
                className={`${styles.reaction} ${selectedReaction === 'heart' ? styles.selected : ''}`}
                onClick={() => handleReactionSelect('heart')}
                title={t('reactionHeart')}
              >
                <FontAwesomeIcon icon={faHeart} />
              </div>
              <div 
                className={`${styles.reaction} ${selectedReaction === 'thumbsUp' ? styles.selected : ''}`}
                onClick={() => handleReactionSelect('thumbsUp')}
                title={t('reactionThumbsUp')}
              >
                <FontAwesomeIcon icon={faThumbsUp} />
              </div>
            </div>
            
            <div className={styles.actionBar}>
              <button 
                className={styles.submitBtn} 
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || isSubmitting}
              >
                <FontAwesomeIcon icon={faPaperPlane} />
                {isSubmitting ? t('sending') : t('sendResponse')}
              </button>
              
              <button className={styles.changeBtn} onClick={() => navigate('/help')}>
                <FontAwesomeIcon icon={faHistory} />
                {t('helpAnotherPerson')}
              </button>
            </div>
            
            {replySuccess && (
              <div className={styles.successMessage}>
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>{t('replySuccess')}</span>
              </div>
            )}
            
            <div className={styles.statsBar}>
              <div className={styles.statsItem}>
                <FontAwesomeIcon icon={faUser} />
                <span>{t('helpedPeople')}: 0</span>
              </div>
              <div className={styles.statsItem}>
                <FontAwesomeIcon icon={faHeart} />
                <span>{t('receivedThanks')}: 0</span>
              </div>
            </div>
          </div>
          
          <div className={styles.replySection}>
            <h2 className={styles.replyTitle}>{t('previousReplies')}</h2>
            
            <div className={styles.replyList}>
              {!post.replies || post.replies.length === 0 ? (
                <div className={styles.noReplies}>
                  <p>{t('noRepliesYet')}</p>
                  <p>{t('beTheFirstToReply')}</p>
                </div>
              ) : (
                post.replies.map((reply, index) => (
                  <div key={index} className={styles.replyItem}>
                    <div className={styles.replyHeader}>
                      <div className={styles.replyAuthor}>
                        <FontAwesomeIcon icon={faUser} />
                        <span>{reply.author || `${t('helper')} #${index + 1}`}</span>
                      </div>
                      <div className={styles.replyTime}>
                        {getTimeAgo(reply.createdAt)}
                      </div>
                    </div>
                    <div className={styles.replyContent}>
                      {reply.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DetailPage;
