#!/bin/bash

# Deploy Firestore Indexes Script
# This script deploys all Firestore indexes to resolve query requirements

echo "🚀 Deploying Firestore Indexes..."
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed!"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase!"
    echo "Please login with: firebase login"
    exit 1
fi

# Check if firebase.json exists
if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found!"
    echo "Please make sure you're in the project root directory."
    exit 1
fi

# Check if firestore.indexes.json exists
if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ firestore.indexes.json not found!"
    echo "Please make sure the indexes file exists."
    exit 1
fi

echo "✅ All prerequisites met!"
echo ""

# Show current project
PROJECT_ID=$(firebase use 2>/dev/null | grep "Now using project" | awk '{print $4}' || echo "unknown")
echo "📋 Current Firebase project: $PROJECT_ID"
echo ""

# Validate the indexes file
echo "🔍 Validating firestore.indexes.json..."
if python3 -m json.tool firestore.indexes.json > /dev/null 2>&1; then
    echo "✅ JSON file is valid"
elif node -e "JSON.parse(require('fs').readFileSync('firestore.indexes.json', 'utf8'))" > /dev/null 2>&1; then
    echo "✅ JSON file is valid"
else
    echo "❌ Invalid JSON in firestore.indexes.json!"
    exit 1
fi

# Count indexes (simple approach)
INDEX_COUNT=$(grep -c '"collectionGroup"' firestore.indexes.json)
echo "✅ Found $INDEX_COUNT indexes to deploy"
echo ""

# Deploy indexes
echo "🚀 Deploying Firestore indexes..."
echo "This may take several minutes..."
echo ""

if firebase deploy --only firestore:indexes; then
    echo ""
    echo "✅ Firestore indexes deployed successfully!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Wait for indexes to build (this can take 10-30 minutes)"
    echo "2. Check index status in Firebase Console:"
    echo "   https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
    echo "3. Test your queries once indexes are ready"
    echo ""
    echo "💡 Tip: You can check index build status with:"
    echo "   firebase firestore:indexes"
else
    echo ""
    echo "❌ Failed to deploy indexes!"
    echo "Please check the error messages above and try again."
    exit 1
fi

echo "🎉 Index deployment completed!"