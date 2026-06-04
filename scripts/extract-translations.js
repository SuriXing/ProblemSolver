const fs = require('fs');
const glob = require('glob');

// Find all hardcoded strings in JSX (very basic example)
const jsxStringRegex = />([^<>{}]+)</g;

// Get all React component files
const files = glob.sync('src/**/*.{jsx,tsx}');

const hardcodedStrings = new Set();

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(jsxStringRegex);
  
  if (matches) {
    matches.forEach(match => {
      // Extract just the text
      const text = match.replace(/^>/, '').replace(/<$/, '').trim();
      if (text && !text.includes('${') && text.length > 2) {
        hardcodedStrings.add(text);
      }
    });
  }
});

console.log('Potential hardcoded strings:');
Array.from(hardcodedStrings).forEach(str => console.log(str)); 