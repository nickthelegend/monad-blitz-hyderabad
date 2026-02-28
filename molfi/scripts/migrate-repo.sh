#!/bin/bash

# Molfi-Fun Migration Script
# Run this to migrate the project to the new official repository

echo "🚀 Starting MolFi Migration to molfi-fun..."

# 1. Login if needed
gh auth status || gh auth login

# 2. Create the new repository if it doesn't exist
echo "📦 Creating GitHub repository: jaibajrang/molfi-fun..."
gh repo create jaibajrang/molfi-fun --public --description "Autonomous AI Hedge Fund Protocol on Monad" || echo "Repo might already exist."

# 3. Update remotes
echo "🔗 Updating git remotes..."
git remote set-url origin https://github.com/jaibajrang/molfi-fun.git || git remote add origin https://github.com/jaibajrang/molfi-fun.git

# 4. Push code
echo "📤 Pushing code to main branch..."
git add .
git commit -m "Genesis: Phase 7 Deployment & Integration"
git push -u origin main

echo "✅ Migration Complete! Molfi is now live at molfi-fun."
