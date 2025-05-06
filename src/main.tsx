import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// import './assets/css/index.css'; // Only enable if this file exists and is needed

// Log to check if this file is executing
console.log('main.tsx is executing');

// Mount with proper error handling
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App mounted successfully');
} catch (error) {
  console.error('Error mounting app:', error);
  // Display error in DOM as fallback
  document.body.innerHTML = `
    <div style="color: red; padding: 20px;">
      <h1>Error mounting the application</h1>
      <pre>${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
} 