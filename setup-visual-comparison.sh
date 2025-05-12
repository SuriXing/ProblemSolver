#!/bin/bash

# Setup script for the visual comparison tools

# Create the visual comparison directory
mkdir -p visual-comparison

# Copy the files to the directory
cp visual-comparison.sh visual-comparison/
cp css-comparison.js visual-comparison/
cp UI-Comparison-Report.md visual-comparison/
cp visual-comparison-README.md visual-comparison/README.md

# Make the shell script executable
chmod +x visual-comparison/visual-comparison.sh

echo "Visual comparison tools setup completed."
echo "You can now cd into the visual-comparison directory and start using the tools:"
echo "cd visual-comparison"
echo "./visual-comparison.sh" 