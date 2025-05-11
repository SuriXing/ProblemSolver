import React from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import Layout from '../layout/Layout';
import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import '../../styles/NotFoundPage.css';
import Soft404SVG from '../../assets/soft_404.svg';

const NotFoundPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();

  return (
    <Layout>
      <div className="not-found-container">
        <div className="not-found-content">
          <img src={Soft404SVG} alt="404" style={{ width: 120, marginBottom: 24, opacity: 0.85 }} />
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">{t('pageNotFound')}</h2>
          <p className="not-found-message">{t('pageNotFoundMessage')}</p>
          <Link to="/" style={{ textDecoration: 'underline', color: '#4285F4', fontSize: '1rem', fontWeight: 400 }}>{t('returnHome')}</Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage; 