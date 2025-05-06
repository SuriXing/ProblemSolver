import React from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-copyright">
          © {currentYear} {t('siteName')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;