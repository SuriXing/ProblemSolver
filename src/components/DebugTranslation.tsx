import React from 'react';
import { useTranslation } from 'react-i18next';

const DebugTranslation: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, background: '#f0f0f0', padding: 10, zIndex: 1000 }}>
      <p>Current language: {i18n.language}</p>
      <p>helpPageTitle: {t('helpPageTitle')}</p>
      <p>allPosts: {t('allPosts')}</p>
      <button onClick={() => i18n.changeLanguage('en')}>English</button>
      <button onClick={() => i18n.changeLanguage('zh-CN')}>中文</button>
    </div>
  );
};

export default DebugTranslation; 