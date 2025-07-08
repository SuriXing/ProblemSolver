import React from 'react';
import { getTranslation } from '../utils/translationHelper';

const Layout: React.FC = ({ children }) => {
  // Use the fallback-enabled translation function
  const footerText = getTranslation('footerText', '© 2023 Worry Solver. All rights reserved.');
  
  return (
    <div className="layout">
      <main>{children}</main>
      <footer>{footerText}</footer>
    </div>
  );
};

export default Layout; 