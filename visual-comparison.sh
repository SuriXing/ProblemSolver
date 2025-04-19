#!/bin/bash

# This script facilitates the visual comparison between Problem_solver and worry-solver
# It helps with capturing screenshots and generating a comparison report

# Create necessary directories
mkdir -p comparison/screenshots/problem_solver
mkdir -p comparison/screenshots/worry_solver

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Visual Comparison Tool ===${NC}"
echo "This tool helps compare the original Problem_solver with the new worry-solver"

# Function to start the original Problem_solver server
start_original() {
  echo -e "${YELLOW}Starting original Problem_solver...${NC}"
  # Use a simple HTTP server to serve the original files
  # Kill any existing Python HTTP server
  pkill -f "python -m http.server 3000" || true
  cd .. && python -m http.server 3000 &
  ORIGINAL_PID=$!
  echo "Original server started with PID: $ORIGINAL_PID"
  echo "Access at http://localhost:3000"
}

# Function to start the React-based worry-solver
start_react() {
  echo -e "${YELLOW}Starting React-based worry-solver...${NC}"
  # Kill any existing React development server
  pkill -f "react-scripts start" || true
  cd worry-solver && npm start &
  REACT_PID=$!
  echo "React server started with PID: $REACT_PID"
  echo "Access at http://localhost:3001"
}

# Function to capture screenshots of both versions
capture_screenshots() {
  echo -e "${YELLOW}Preparing to capture screenshots...${NC}"
  
  # Install puppeteer if not already installed
  if ! npm list -g puppeteer > /dev/null; then
    echo "Installing puppeteer for screenshot capture..."
    npm install -g puppeteer
  fi
  
  # Create a temporary Node.js script for capturing screenshots
  cat > screenshot.js << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');

// Page mapping between old and new versions
const pages = [
  { name: 'home', original: 'http://localhost:3000/index.html', react: 'http://localhost:3001/' },
  { name: 'help', original: 'http://localhost:3000/help.html', react: 'http://localhost:3001/help' },
  { name: 'help-detail', original: 'http://localhost:3000/help-detail.html', react: 'http://localhost:3001/help/detail/1' },
  { name: 'help-success', original: 'http://localhost:3000/help-success.html', react: 'http://localhost:3001/help/success' },
  { name: 'past-questions', original: 'http://localhost:3000/past-questions.html', react: 'http://localhost:3001/past-questions' },
  { name: 'submit-query', original: 'http://localhost:3000/submit-query.html', react: 'http://localhost:3001/submit' },
  { name: 'success', original: 'http://localhost:3000/success.html', react: 'http://localhost:3001/success' },
  { name: 'topic-detail', original: 'http://localhost:3000/topic-detail.html', react: 'http://localhost:3001/topic/1' },
  { name: 'share', original: 'http://localhost:3000/share.html', react: 'http://localhost:3001/share' }
];

// Viewport sizes to capture
const viewports = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 812, name: 'mobile' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  for (const page of pages) {
    console.log(`Capturing screenshots for ${page.name}...`);
    
    for (const viewport of viewports) {
      // Capture original version
      const originalPage = await browser.newPage();
      await originalPage.setViewport({ width: viewport.width, height: viewport.height });
      try {
        await originalPage.goto(page.original, { waitUntil: 'networkidle2', timeout: 10000 });
        // Wait for any animations to complete
        await originalPage.waitForTimeout(1000);
        const originalPath = `comparison/screenshots/problem_solver/${page.name}_${viewport.name}.png`;
        await originalPage.screenshot({ path: originalPath, fullPage: true });
        console.log(`✅ Captured original ${page.name} at ${viewport.name} size`);
      } catch (error) {
        console.error(`❌ Failed to capture original ${page.name}: ${error.message}`);
      }
      await originalPage.close();
      
      // Capture React version
      const reactPage = await browser.newPage();
      await reactPage.setViewport({ width: viewport.width, height: viewport.height });
      try {
        await reactPage.goto(page.react, { waitUntil: 'networkidle2', timeout: 10000 });
        // Wait for any animations to complete
        await reactPage.waitForTimeout(1000);
        const reactPath = `comparison/screenshots/worry_solver/${page.name}_${viewport.name}.png`;
        await reactPage.screenshot({ path: reactPath, fullPage: true });
        console.log(`✅ Captured React ${page.name} at ${viewport.name} size`);
      } catch (error) {
        console.error(`❌ Failed to capture React ${page.name}: ${error.message}`);
      }
      await reactPage.close();
    }
  }
  
  await browser.close();
  console.log('All screenshots captured successfully!');
})();
EOF

  # Run the screenshot capture script
  echo "Capturing screenshots, please wait..."
  node screenshot.js
  
  # Clean up
  rm screenshot.js
}

# Function to generate HTML comparison report
generate_comparison_report() {
  echo -e "${YELLOW}Generating visual comparison report...${NC}"
  
  # Create HTML report file
  cat > comparison/visual-comparison.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Comparison Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 1800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #333;
    }
    .comparison-container {
      display: flex;
      flex-direction: column;
      margin-bottom: 40px;
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }
    .comparison-header {
      background: #f5f5f5;
      padding: 15px;
      border-bottom: 1px solid #ddd;
    }
    .comparison-images {
      display: flex;
      flex-wrap: wrap;
    }
    .image-container {
      flex: 1;
      min-width: 300px;
      padding: 15px;
      border-right: 1px solid #eee;
    }
    .image-container:last-child {
      border-right: none;
    }
    .image-container img {
      max-width: 100%;
      border: 1px solid #ccc;
    }
    .viewport-tabs {
      display: flex;
      background: #eee;
      border-bottom: 1px solid #ddd;
    }
    .viewport-tab {
      padding: 10px 20px;
      cursor: pointer;
      border-right: 1px solid #ddd;
    }
    .viewport-tab.active {
      background: #fff;
      border-bottom: 2px solid #0066cc;
    }
    .viewport-content {
      display: none;
    }
    .viewport-content.active {
      display: flex;
    }
    .notes-section {
      padding: 15px;
      background: #f9f9f9;
      border-top: 1px solid #ddd;
    }
    textarea {
      width: 100%;
      height: 100px;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      resize: vertical;
    }
    button {
      background: #0066cc;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 10px;
    }
    button:hover {
      background: #0055aa;
    }
  </style>
</head>
<body>
  <h1>Visual Comparison Report</h1>
  <p>This report shows side-by-side comparisons of the original Problem_solver and the new React-based worry-solver implementation.</p>
  
  <div id="comparisons"></div>
  
  <script>
    // Page definitions
    const pages = [
      { name: 'home', title: 'Home Page', original: 'index.html', react: '/' },
      { name: 'help', title: 'Help Page', original: 'help.html', react: '/help' },
      { name: 'help-detail', title: 'Help Detail Page', original: 'help-detail.html', react: '/help/detail/1' },
      { name: 'help-success', title: 'Help Success Page', original: 'help-success.html', react: '/help/success' },
      { name: 'past-questions', title: 'Past Questions Page', original: 'past-questions.html', react: '/past-questions' },
      { name: 'submit-query', title: 'Submit Query Page', original: 'submit-query.html', react: '/submit' },
      { name: 'success', title: 'Success Page', original: 'success.html', react: '/success' },
      { name: 'topic-detail', title: 'Topic Detail Page', original: 'topic-detail.html', react: '/topic/1' },
      { name: 'share', title: 'Share Page', original: 'share.html', react: '/share' }
    ];
    
    // Viewport sizes
    const viewports = [
      { name: 'desktop', label: 'Desktop (1920×1080)' },
      { name: 'tablet', label: 'Tablet (768×1024)' },
      { name: 'mobile', label: 'Mobile (375×812)' }
    ];
    
    const comparisonsContainer = document.getElementById('comparisons');
    
    // Generate comparison sections for each page
    pages.forEach(page => {
      const section = document.createElement('div');
      section.className = 'comparison-container';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'comparison-header';
      header.innerHTML = `<h2>${page.title}</h2>
        <p><strong>Original:</strong> ${page.original} | <strong>React:</strong> ${page.react}</p>`;
      section.appendChild(header);
      
      // Create viewport tabs
      const tabs = document.createElement('div');
      tabs.className = 'viewport-tabs';
      
      viewports.forEach((viewport, index) => {
        const tab = document.createElement('div');
        tab.className = `viewport-tab ${index === 0 ? 'active' : ''}`;
        tab.setAttribute('data-viewport', viewport.name);
        tab.setAttribute('data-page', page.name);
        tab.textContent = viewport.label;
        tab.onclick = function() {
          // Deactivate all tabs for this page
          document.querySelectorAll(`.viewport-tab[data-page="${page.name}"]`).forEach(t => {
            t.classList.remove('active');
          });
          // Deactivate all viewport contents for this page
          document.querySelectorAll(`.viewport-content[data-page="${page.name}"]`).forEach(c => {
            c.classList.remove('active');
          });
          // Activate this tab
          this.classList.add('active');
          // Activate corresponding content
          document.querySelector(`.viewport-content[data-page="${page.name}"][data-viewport="${viewport.name}"]`).classList.add('active');
        };
        tabs.appendChild(tab);
      });
      
      section.appendChild(tabs);
      
      // Create comparison images for each viewport
      viewports.forEach((viewport, index) => {
        const viewportContent = document.createElement('div');
        viewportContent.className = `viewport-content ${index === 0 ? 'active' : ''}`;
        viewportContent.setAttribute('data-viewport', viewport.name);
        viewportContent.setAttribute('data-page', page.name);
        
        // Original image
        const originalContainer = document.createElement('div');
        originalContainer.className = 'image-container';
        originalContainer.innerHTML = `
          <h3>Problem_solver</h3>
          <img src="screenshots/problem_solver/${page.name}_${viewport.name}.png" alt="Original ${page.title} (${viewport.name})">
        `;
        viewportContent.appendChild(originalContainer);
        
        // React image
        const reactContainer = document.createElement('div');
        reactContainer.className = 'image-container';
        reactContainer.innerHTML = `
          <h3>worry-solver (React)</h3>
          <img src="screenshots/worry_solver/${page.name}_${viewport.name}.png" alt="React ${page.title} (${viewport.name})">
        `;
        viewportContent.appendChild(reactContainer);
        
        section.appendChild(viewportContent);
      });
      
      // Add notes section
      const notesSection = document.createElement('div');
      notesSection.className = 'notes-section';
      notesSection.innerHTML = `
        <h3>Discrepancy Notes</h3>
        <textarea id="notes-${page.name}" placeholder="Document visual discrepancies here..."></textarea>
        <button onclick="saveNotes('${page.name}')">Save Notes</button>
      `;
      section.appendChild(notesSection);
      
      comparisonsContainer.appendChild(section);
    });
    
    // Function to save notes (in a real implementation, this would save to a file or database)
    function saveNotes(pageName) {
      const notes = document.getElementById(`notes-${pageName}`).value;
      // In a real implementation, you would save these notes to a file or database
      console.log(`Notes for ${pageName}:`, notes);
      alert(`Notes for ${pageName} saved!`);
      
      // This is just a mockup - in a real implementation you would save the notes to a file or database
      localStorage.setItem(`visual-comparison-notes-${pageName}`, notes);
    }
    
    // Load previously saved notes
    pages.forEach(page => {
      const savedNotes = localStorage.getItem(`visual-comparison-notes-${page.name}`);
      if (savedNotes) {
        const notesElement = document.getElementById(`notes-${page.name}`);
        if (notesElement) {
          notesElement.value = savedNotes;
        }
      }
    });
  </script>
</body>
</html>
EOF

  echo -e "${GREEN}Comparison report generated: comparison/visual-comparison.html${NC}"
}

# Function to clean up processes on exit
cleanup() {
  echo -e "${YELLOW}Cleaning up...${NC}"
  # Kill servers
  kill $ORIGINAL_PID 2>/dev/null || true
  kill $REACT_PID 2>/dev/null || true
  echo "Done"
}

# Execute main functions
main() {
  # Display menu
  echo "1) Start both servers"
  echo "2) Capture screenshots"
  echo "3) Generate HTML comparison report"
  echo "4) Do all of the above"
  echo "5) Exit"
  
  read -p "Enter your choice (1-5): " choice
  
  case $choice in
    1)
      start_original
      start_react
      ;;
    2)
      capture_screenshots
      ;;
    3)
      generate_comparison_report
      ;;
    4)
      start_original
      start_react
      # Wait for servers to start
      sleep 5
      capture_screenshots
      generate_comparison_report
      # Open the report
      if [[ "$OSTYPE" == "darwin"* ]]; then
        open comparison/visual-comparison.html
      elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open comparison/visual-comparison.html
      fi
      ;;
    5)
      cleanup
      exit 0
      ;;
    *)
      echo -e "${RED}Invalid choice${NC}"
      ;;
  esac
  
  # Return to menu
  echo ""
  main
}

# Register cleanup function
trap cleanup EXIT

# Run main function
main 