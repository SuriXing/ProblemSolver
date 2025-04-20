import React, { useState } from 'react';
import styles from './EmailNotification.module.css';

interface EmailNotificationProps {
  initialEmail?: string;
  initialOptIn: boolean;
  onEmailChange: (email: string) => void;
  onOptInChange: (optedIn: boolean) => void;
}

const EmailNotification: React.FC<EmailNotificationProps> = ({
  initialEmail = '',
  initialOptIn,
  onEmailChange,
  onOptInChange
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [optedIn, setOptedIn] = useState(initialOptIn);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    onEmailChange(newEmail);
  };

  const handleOptInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOptIn = e.target.checked;
    setOptedIn(newOptIn);
    onOptInChange(newOptIn);
  };

  return (
    <div className={styles.container}>
      <div className={styles.optInContainer}>
        <input
          type="checkbox"
          id="emailOptIn"
          checked={optedIn}
          onChange={handleOptInChange}
          className={styles.checkbox}
        />
        <label htmlFor="emailOptIn" className={styles.optInLabel}>
          Receive email notifications
        </label>
      </div>
      
      {optedIn && (
        <div className={styles.emailContainer}>
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            className={styles.emailInput}
          />
        </div>
      )}
    </div>
  );
};

export default EmailNotification;
