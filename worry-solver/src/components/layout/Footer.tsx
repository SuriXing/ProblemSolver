import React from 'react';
import { useTypeSafeTranslation } from '../../utils/translationHelper';

const Footer: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  
  return (
    <footer>
      <div className="container">
        <p>{t('copyright')}</p>
      </div>
    </footer>
  );
};

export default Footer; 