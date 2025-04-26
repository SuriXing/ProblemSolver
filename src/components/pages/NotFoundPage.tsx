import React from 'react';
import { Link } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import Layout from '../layout/Layout';
import { Button } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import '../../styles/NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const { t } = useTypeSafeTranslation();

  return (
    <Layout>
      <div className="not-found-container">
        <div className="not-found-content">
          <h1 className="not-found-title">404</h1>
          <h2 className="not-found-subtitle">{t('pageNotFound')}</h2>
          <p className="not-found-message">{t('pageNotFoundMessage')}</p>
          <Link to="/">
            <Button type="primary" icon={<HomeOutlined />} size="large">
              {t('returnHome')}
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage; 