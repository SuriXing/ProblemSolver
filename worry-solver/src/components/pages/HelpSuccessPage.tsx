import React from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faHome, faHandsHelping } from '@fortawesome/free-solid-svg-icons';
import styles from './HelpSuccessPage.module.css';

const HelpSuccessPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  
  // Mock data - in a real app this would come from props or state
  const helperStats = {
    todayHelped: 3,
    totalHelped: 42,
    receivedThanks: 28
  };

  return (
    <section className={styles.helpSuccessView}>
      <div className={styles.successHeader}>
        <div className={styles.successIcon}>
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h1 className={styles.successTitle}>{t('thankHelperTitle')}</h1>
        <p className={styles.successSubtitle}>{t('thankHelperSubtitle')}</p>
      </div>
      
      <div className={styles.helperStatsContainer}>
        <h2>{t('helperStats')}</h2>
        
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{helperStats.todayHelped}</div>
            <div className={styles.statLabel}>{t('todayHelped')}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{helperStats.totalHelped}</div>
            <div className={styles.statLabel}>{t('totalHelped')}</div>
          </div>
          
          <div className={styles.statItem}>
            <div className={styles.statNumber}>{helperStats.receivedThanks}</div>
            <div className={styles.statLabel}>{t('receivedThanks')}</div>
          </div>
        </div>
        
        <div className={styles.successMessage}>
          <p>{t('kindnessMatters')}</p>
          <p>{t('replyDelivered')}</p>
          <p>{t('mightThankYou')}</p>
          <p>{t('checkPastResponses')}</p>
          <p>{t('everyReplyMatters')}</p>
        </div>
      </div>
      
      <div className={styles.successActions}>
        <div className={styles.actionButtons}>
          <Link to="/" className="btn-primary">
            <FontAwesomeIcon icon={faHome} /> <span>{t('returnHome')}</span>
          </Link>
          <Link to="/help" className="btn-primary">
            <FontAwesomeIcon icon={faHandsHelping} /> <span>{t('continueHelping')}</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HelpSuccessPage;
