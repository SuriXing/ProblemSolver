import React from 'react';
import styles from './PrivacyOptions.module.css';

interface PrivacyOptionsProps {
  isAnonymous: boolean;
  onToggle: () => void;
}

const PrivacyOptions: React.FC<PrivacyOptionsProps> = ({ 
  isAnonymous, 
  onToggle 
}) => {
  return (
    <div className={styles.container}>
      <label className={styles.switch}>
        <input 
          type="checkbox" 
          checked={isAnonymous}
          onChange={onToggle}
        />
        <span className={styles.slider}></span>
      </label>
      <span className={styles.label}>
        {isAnonymous ? 'Anonymous' : 'Show Nickname'}
      </span>
    </div>
  );
};

export default PrivacyOptions;
