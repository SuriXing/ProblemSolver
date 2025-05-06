import React from 'react';
import ReactDOM from 'react-dom/client';
// Import CSS files
import './styles/reset.css'; // Import reset CSS first
import './index.css';
import './assets/css/global.css';
import './assets/css/index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n'; // Import i18n configuration

// Create React root
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Add loaded class to body once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('loaded');
});

// Render App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
