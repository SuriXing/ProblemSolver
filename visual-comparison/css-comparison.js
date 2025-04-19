/**
 * CSS Comparison Utility
 * This script extracts and compares CSS styles from both Problem_solver and worry-solver
 * implementations to help identify styling differences.
 */

// Run this script in the browser console when viewing both pages side by side

(function() {
  /**
   * Creates a stylesheet comparison table for a specific element
   * @param {string} selector - CSS selector for the element to compare
   * @param {string} description - Human-readable description of the element
   */
  function compareStyles(selector, description) {
    // Get computed styles from both implementations
    let originalElement, reactElement;
    
    try {
      // Get the element from Problem_solver (left frame)
      originalElement = document.querySelector('#original-frame').contentWindow.document.querySelector(selector);
      
      // Get the element from worry-solver (right frame)
      reactElement = document.querySelector('#react-frame').contentWindow.document.querySelector(selector);
      
      if (!originalElement || !reactElement) {
        console.error(`Element with selector "${selector}" not found in one or both implementations`);
        return;
      }
      
      // Get computed styles
      const originalStyles = window.getComputedStyle(originalElement);
      const reactStyles = window.getComputedStyle(reactElement);
      
      // Create table for comparison
      const table = document.createElement('table');
      table.className = 'style-comparison';
      
      // Add header
      const header = document.createElement('tr');
      header.innerHTML = `
        <th colspan="3">${description} (${selector})</th>
      `;
      
      const subheader = document.createElement('tr');
      subheader.innerHTML = `
        <th>Property</th>
        <th>Problem_solver</th>
        <th>worry-solver</th>
      `;
      
      table.appendChild(header);
      table.appendChild(subheader);
      
      // Important CSS properties to compare
      const propertiesToCompare = [
        'display', 'position', 'width', 'height', 'margin', 'padding',
        'color', 'background-color', 'font-family', 'font-size', 'font-weight',
        'border', 'border-radius', 'box-shadow',
        'flex-direction', 'justify-content', 'align-items',
        'grid-template-columns', 'grid-template-rows',
        'transition', 'animation'
      ];
      
      // Compare styles
      propertiesToCompare.forEach(prop => {
        const originalValue = originalStyles.getPropertyValue(prop);
        const reactValue = reactStyles.getPropertyValue(prop);
        
        // Create row
        const row = document.createElement('tr');
        
        // Highlight differences
        if (originalValue !== reactValue) {
          row.className = 'different';
        }
        
        row.innerHTML = `
          <td>${prop}</td>
          <td>${originalValue}</td>
          <td>${reactValue}</td>
        `;
        
        table.appendChild(row);
      });
      
      // Add table to the document
      document.querySelector('#style-comparisons').appendChild(table);
      
    } catch (error) {
      console.error(`Error comparing styles for "${selector}": ${error.message}`);
    }
  }
  
  // Create the UI for the comparison tool
  function createComparisonUI() {
    // Create container
    const container = document.createElement('div');
    container.id = 'css-comparison-tool';
    container.innerHTML = `
      <style>
        #css-comparison-tool {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: white;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        #frames-container {
          display: flex;
          height: 40%;
          margin-bottom: 20px;
          border: 1px solid #ddd;
        }
        
        #frames-container iframe {
          flex: 1;
          border: none;
          border-right: 1px solid #ddd;
        }
        
        #controls {
          padding: 10px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          margin-bottom: 10px;
        }
        
        #style-comparisons {
          overflow: auto;
          flex-grow: 1;
          padding: 10px;
          border: 1px solid #ddd;
        }
        
        .style-comparison {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .style-comparison th {
          background: #f0f0f0;
          padding: 8px;
          text-align: left;
          border: 1px solid #ddd;
        }
        
        .style-comparison td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        
        .different {
          background-color: #fff8e1;
        }
        
        button {
          padding: 8px 12px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        
        button:hover {
          background: #0055aa;
        }
        
        input, select {
          padding: 8px;
          margin-right: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      </style>
      
      <h1>CSS Comparison Tool</h1>
      
      <div id="frames-container">
        <iframe id="original-frame" title="Problem_solver"></iframe>
        <iframe id="react-frame" title="worry-solver"></iframe>
      </div>
      
      <div id="controls">
        <div style="margin-bottom: 10px;">
          <select id="page-selector">
            <option value="index.html">Home Page</option>
            <option value="help.html">Help Page</option>
            <option value="help-detail.html">Help Detail Page</option>
            <option value="help-success.html">Help Success Page</option>
            <option value="past-questions.html">Past Questions Page</option>
            <option value="submit-query.html">Submit Query Page</option>
            <option value="success.html">Success Page</option>
            <option value="topic-detail.html">Topic Detail Page</option>
            <option value="share.html">Share Page</option>
          </select>
          <button id="load-pages">Load Pages</button>
        </div>
        
        <div style="margin-bottom: 10px;">
          <input type="text" id="selector-input" placeholder="CSS Selector (e.g. .header)" style="width: 250px;">
          <input type="text" id="description-input" placeholder="Description (e.g. Header container)" style="width: 250px;">
          <button id="compare-button">Compare Element</button>
        </div>
        
        <div>
          <button id="common-elements">Compare Common Elements</button>
          <button id="clear-comparisons">Clear Results</button>
          <button id="export-results">Export Results</button>
          <button id="close-tool">Close Tool</button>
        </div>
      </div>
      
      <div id="style-comparisons"></div>
    `;
    
    document.body.appendChild(container);
    
    // Map original pages to React routes
    const pageMapping = {
      'index.html': '/',
      'help.html': '/help',
      'help-detail.html': '/help/detail/1',
      'help-success.html': '/help/success',
      'past-questions.html': '/past-questions',
      'submit-query.html': '/submit',
      'success.html': '/success',
      'topic-detail.html': '/topic/1',
      'share.html': '/share'
    };
    
    // Set up event listeners
    document.getElementById('load-pages').addEventListener('click', () => {
      const selectedPage = document.getElementById('page-selector').value;
      const originalUrl = `http://localhost:3000/${selectedPage}`;
      const reactUrl = `http://localhost:3001${pageMapping[selectedPage]}`;
      
      document.getElementById('original-frame').src = originalUrl;
      document.getElementById('react-frame').src = reactUrl;
    });
    
    document.getElementById('compare-button').addEventListener('click', () => {
      const selector = document.getElementById('selector-input').value;
      const description = document.getElementById('description-input').value || selector;
      
      if (selector) {
        compareStyles(selector, description);
      } else {
        alert('Please enter a CSS selector');
      }
    });
    
    document.getElementById('common-elements').addEventListener('click', () => {
      // Compare common elements based on the selected page
      const selectedPage = document.getElementById('page-selector').value;
      
      // Clear previous comparisons
      document.getElementById('style-comparisons').innerHTML = '';
      
      // Common elements for all pages
      compareStyles('header', 'Header');
      compareStyles('footer', 'Footer');
      
      // Page-specific elements
      switch(selectedPage) {
        case 'index.html':
          compareStyles('.main-options', 'Main Options Container');
          compareStyles('.option-card', 'Option Card');
          break;
        case 'help.html':
          compareStyles('.filter-container', 'Filter Container');
          compareStyles('.question-card', 'Question Card');
          break;
        case 'help-detail.html':
          compareStyles('.question-detail', 'Question Detail');
          compareStyles('.reply-form', 'Reply Form');
          break;
        case 'help-success.html':
          compareStyles('.success-message', 'Success Message');
          compareStyles('.navigation-options', 'Navigation Options');
          break;
        case 'past-questions.html':
          compareStyles('.questions-list', 'Questions List');
          compareStyles('.pagination', 'Pagination');
          break;
        case 'submit-query.html':
          compareStyles('form', 'Submission Form');
          compareStyles('.form-group', 'Form Group');
          compareStyles('button[type="submit"]', 'Submit Button');
          break;
        case 'success.html':
          compareStyles('.success-container', 'Success Container');
          compareStyles('.access-code', 'Access Code Display');
          break;
        case 'topic-detail.html':
          compareStyles('.topic-content', 'Topic Content');
          compareStyles('.comments-section', 'Comments Section');
          break;
        case 'share.html':
          compareStyles('.share-options', 'Share Options');
          compareStyles('.social-buttons', 'Social Media Buttons');
          break;
      }
    });
    
    document.getElementById('clear-comparisons').addEventListener('click', () => {
      document.getElementById('style-comparisons').innerHTML = '';
    });
    
    document.getElementById('export-results').addEventListener('click', () => {
      const comparisons = document.getElementById('style-comparisons').innerHTML;
      const wrappedComparisons = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>CSS Comparison Results</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
            }
            
            .style-comparison {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            
            .style-comparison th {
              background: #f0f0f0;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            
            .style-comparison td {
              padding: 8px;
              border: 1px solid #ddd;
            }
            
            .different {
              background-color: #fff8e1;
            }
          </style>
        </head>
        <body>
          <h1>CSS Comparison Results</h1>
          ${comparisons}
        </body>
        </html>
      `;
      
      const blob = new Blob([wrappedComparisons], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'css-comparison-results.html';
      a.click();
      
      URL.revokeObjectURL(url);
    });
    
    document.getElementById('close-tool').addEventListener('click', () => {
      document.getElementById('css-comparison-tool').remove();
    });
    
    // Load default pages
    document.getElementById('load-pages').click();
  }
  
  // Initialize the tool
  createComparisonUI();
})(); 