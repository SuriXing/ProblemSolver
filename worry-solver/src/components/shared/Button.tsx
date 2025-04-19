import React from 'react';
import styles from './Button.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: IconDefinition;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  text,
  onClick,
  type = 'button',
  variant = 'primary',
  icon,
  disabled = false,
  className = ''
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.button} ${styles[variant]} ${className}`}
    >
      {icon && <FontAwesomeIcon icon={icon} className={styles.icon} />}
      {text}
    </button>
  );
};

export default Button;
