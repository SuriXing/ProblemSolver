import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadingPage: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5'
    }}>
      <FontAwesomeIcon 
        icon={faSpinner} 
        spin 
        style={{ fontSize: '3rem', color: '#1890ff', marginBottom: '1rem' }} 
      />
      <h2 style={{ color: '#333', fontWeight: 'normal' }}>Loading...</h2>
      <p style={{ color: '#666' }}>Please wait while we connect to the server</p>
    </div>
  );
};

export default LoadingPage; 