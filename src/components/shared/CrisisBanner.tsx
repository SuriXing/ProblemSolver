import { useTranslation } from 'react-i18next';
import './CrisisBanner.css';

interface CrisisBannerProps {
  prominent?: boolean;
}

const CrisisBanner: React.FC<CrisisBannerProps> = ({ prominent = false }) => {
  const { t } = useTranslation();

  return (
    <div className={`crisis-banner ${prominent ? 'crisis-banner--prominent' : ''}`} role="complementary" aria-label={t('crisis.banner.title')}>
      {prominent && <span className="crisis-banner__icon" aria-hidden="true">💛</span>}
      <span className="crisis-banner__title">{t('crisis.banner.title')}</span>
      <span className="crisis-banner__sep" aria-hidden="true"> — </span>
      <span className="crisis-banner__hotlines">{t('crisis.banner.hotlines')}</span>
    </div>
  );
};

export default CrisisBanner;
