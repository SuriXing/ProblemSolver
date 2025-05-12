import React from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faHome, faHandsHelping } from '@fortawesome/free-solid-svg-icons';

const HelpSuccessPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  
  // Mock data - in a real app this would come from props or state
  const helperStats = {
    todayHelped: 3,
    totalHelped: 42,
    receivedThanks: 28
  };

  return (
    <section className="help-success-view container">
      <div className="success-header">
        <div className="success-icon">
          <FontAwesomeIcon icon={faCircleCheck} />
        </div>
        <h1 className="success-title">{t('thankHelperTitle')}</h1>
        <p className="success-subtitle">{t('thankHelperSubtitle')}</p>
      </div>
      
      <div className="helper-stats-container">
        <h2>{t('helperStats')}</h2>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-number">{helperStats.todayHelped}</div>
            <div className="stat-label">{t('todayHelped')}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{helperStats.totalHelped}</div>
            <div className="stat-label">{t('totalHelped')}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">{helperStats.receivedThanks}</div>
            <div className="stat-label">{t('receivedThanks')}</div>
          </div>
        </div>
        
        <div className="success-message">
          <p>{t('kindnessMatters')}</p>
          <p>{t('replyDelivered')}</p>
          <p>{t('mightThankYou')}</p>
          <p>{t('checkPastResponses')}</p>
          <p>{t('everyReplyMatters')}</p>
        </div>
      </div>
      
      <div className="success-actions">
        <div className="action-buttons">
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
