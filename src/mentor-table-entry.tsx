import React from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import './i18n';
import './index.css';
import MentorTablePage from './components/pages/MentorTablePage';

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MemoryRouter>
        <MentorTablePage standalone />
      </MemoryRouter>
    </React.StrictMode>
  );
}
