import React, { useEffect, useState } from 'react';
import { detectBrowser, BrowserInfo, initBrowserCompatibility } from '../utils/browserDetection';
import '../styles/browser-fixes.css';
import './BrowserCompatibilityExample.css'; // Import external CSS file instead

const BrowserCompatibilityExample: React.FC = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Initialize browser compatibility fixes
    initBrowserCompatibility();
    
    // Get browser information for display
    const info = detectBrowser();
    setBrowserInfo(info);
    setIsMounted(true);
  }, []);

  if (!isMounted || !browserInfo) {
    return <div>Loading browser information...</div>;
  }

  return (
    <div className="browser-compatibility-example">
      <h1>Browser Detection Example</h1>
      
      <section className="browser-info-display">
        <h2>Detected Browser Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <strong>Browser:</strong> {browserInfo.browserName}
          </div>
          <div className="info-item">
            <strong>Version:</strong> {browserInfo.browserVersion}
          </div>
          <div className="info-item">
            <strong>Mobile:</strong> {browserInfo.isMobile ? 'Yes' : 'No'}
          </div>
          <div className="info-item">
            <strong>OS:</strong> {browserInfo.os}
          </div>
        </div>
      </section>

      <section className="compatibility-examples">
        <h2>Compatibility Examples</h2>
        
        {/* Flexbox Gap Example - shows the fix for Safari's flexbox gap issues */}
        <div className="example-container">
          <h3>Flexbox Gap Support</h3>
          <p>This example demonstrates the fix for flexbox gap issues in Safari:</p>
          <div className={`flex-container ${browserInfo.isSafari ? 'safari-gap-fix' : ''}`}>
            <div className="flex-item">Item 1</div>
            <div className="flex-item">Item 2</div>
            <div className="flex-item">Item 3</div>
          </div>
        </div>

        {/* Full Height Example - shows the iOS 100vh fix */}
        <div className="example-container">
          <h3>Full Height Elements</h3>
          <p>This example demonstrates the fix for iOS 100vh issues:</p>
          <div className="full-height-demo full-height">
            <p>This element should be full height on all devices</p>
          </div>
        </div>

        {/* Touch-friendly targets for mobile */}
        <div className="example-container">
          <h3>Mobile-Friendly Touch Targets</h3>
          <p>These buttons are larger on mobile devices:</p>
          <div className="button-container">
            <button className="clickable-element">Button 1</button>
            <button className="clickable-element">Button 2</button>
          </div>
        </div>

        {/* Scrollbar styling example */}
        <div className="example-container">
          <h3>Consistent Scrollbars</h3>
          <p>This scrollable area has consistent styling across browsers:</p>
          <div className="scrollable-area">
            <p>Line 1</p>
            <p>Line 2</p>
            <p>Line 3</p>
            <p>Line 4</p>
            <p>Line 5</p>
            <p>Line 6</p>
            <p>Line 7</p>
            <p>Line 8</p>
            <p>Line 9</p>
            <p>Line 10</p>
          </div>
        </div>

        {/* Font rendering example */}
        <div className="example-container">
          <h3>Consistent Font Rendering</h3>
          <p>This text should have consistent rendering across browsers:</p>
          <div className="text-sample">
            <p>Sample text with consistent rendering across browsers.</p>
            <p><strong>Bold text</strong> and <em>italic text</em> examples.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BrowserCompatibilityExample; 