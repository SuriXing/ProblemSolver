import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { installGlobalErrorHandlers } from './utils/errorLog';
// import './assets/css/index.css'; // Only enable if this file exists and is needed

installGlobalErrorHandlers();

// Mount with proper error handling
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Root element not found');

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Error mounting app:', error);
  // Display error in DOM as fallback — use textContent to avoid DOM XSS if the
  // error message ever contains attacker-controlled HTML.
  const container = document.createElement('div');
  container.style.color = 'red';
  container.style.padding = '20px';
  const heading = document.createElement('h1');
  heading.textContent = 'Error mounting the application';
  const pre = document.createElement('pre');
  pre.textContent = error instanceof Error ? error.message : String(error);
  container.appendChild(heading);
  container.appendChild(pre);
  document.body.replaceChildren(container);
} 