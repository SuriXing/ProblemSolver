import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/reset.css'; // Reset first — this was only ever imported by the dead CRA entry, now folded into the real one.
import './index.css';
import './assets/css/global.css';
import './assets/css/index.css';
import App from './App';
import { installGlobalErrorHandlers } from './utils/errorLog';

// Add the loaded class to body once the DOM is ready. The old CRA entry
// (src/index.tsx) used to do this; global.css and index.css both key their
// entrance transitions off body.loaded, so it must survive the entry merge.
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

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