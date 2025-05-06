import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../../styles/Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-links">
          <Link to="/about">{t('footer.about')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/contact">{t('footer.contact')}</Link>
        </div>
        <div className="footer-copyright">
          © {currentYear} {t('siteName')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;