import { useTranslation } from 'react-i18next';
import './CrisisBanner.css';

interface CrisisBannerProps {
  prominent?: boolean;
}

const CrisisBanner: React.FC<CrisisBannerProps> = ({ prominent = false }) => {
  const { t, i18n } = useTranslation();

  const hotlineLinks = getBannerHotlineLinks(i18n.language);

  return (
    <div className={`crisis-banner ${prominent ? 'crisis-banner--prominent' : ''}`} role="complementary" aria-label={t('crisis.banner.title')}>
      {prominent && <span className="crisis-banner__icon" aria-hidden="true">💛</span>}
      <span className="crisis-banner__title">{t('crisis.banner.title')}</span>
      <span className="crisis-banner__sep" aria-hidden="true"> — </span>
      <span className="crisis-banner__hotlines" dangerouslySetInnerHTML={{ __html: hotlineLinks }} />
    </div>
  );
};

function getBannerHotlineLinks(lang: string): string {
  const map: Record<string, string> = {
    en: '988 Suicide &amp; Crisis Lifeline — <a href="tel:988">988</a> | Crisis Text Line — <a href="sms:741741&amp;body=HOME">Text 741741</a>',
    'zh-CN': '希望24热线 — <a href="tel:400-161-9995">400-161-9995</a> | 北京 — <a href="tel:010-82951332">010-82951332</a>',
    ja: 'よりそいホットライン — <a href="tel:0120-279-338">0120-279-338</a> | いのちの電話 — <a href="tel:0570-783-556">0570-783-556</a>',
    ko: '자살예방상담전화 — <a href="tel:1393">1393</a> | 정신건강위기상담전화 — <a href="tel:1577-0199">1577-0199</a>',
    es: 'SAPTEL — <a href="tel:800-911-2000">800-911-2000</a> | Línea de Crisis — <a href="tel:800-290-0024">800-290-0024</a> | Internacional — <a href="tel:+1-888-628-9454">+1-888-628-9454</a>',
  };
  return map[lang] ?? map['en']!;
}

export default CrisisBanner;
