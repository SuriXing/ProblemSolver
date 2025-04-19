#!/bin/bash

# Script to organize all visual consistency resources

# Create the visual-consistency-resources directory
mkdir -p visual-consistency-resources

# Copy all the resources to the directory
cp worry-solver-theme-constants.ts visual-consistency-resources/
cp home-page-example.tsx visual-consistency-resources/
cp visual-consistency-implementation-guide.md visual-consistency-resources/
cp visual-consistency-tracker.md visual-consistency-resources/
cp visual-consistency-README.md visual-consistency-resources/README.md

# Copy visual comparison directory if it exists
if [ -d "visual-comparison" ]; then
  cp -r visual-comparison visual-consistency-resources/
else
  echo "Warning: visual-comparison directory not found. Please run setup-visual-comparison.sh first."
fi

echo "Visual consistency resources have been organized in the visual-consistency-resources directory."
echo "You can now use these resources for implementing visual consistency in Phase 7.2." 