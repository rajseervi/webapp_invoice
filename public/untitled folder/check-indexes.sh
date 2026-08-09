#!/bin/bash

# Check Firestore Indexes Status Script
# This script checks the current status of all Firestore indexes

echo "🔍 Checking Firestore Indexes Status..."
echo "======================================"

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

# Show current project
PROJECT_ID=$(firebase use --json 2>/dev/null | jq -r '.result.project // .result' 2>/dev/null || firebase use)
echo "📋 Current Firebase project: $PROJECT_ID"
echo ""

# Check indexes status
echo "📊 Current Firestore Indexes:"
echo "-----------------------------"

if firebase firestore:indexes 2>/dev/null; then
    echo ""
    echo "✅ Index status check completed!"
else
    echo "❌ Failed to retrieve index status"
    echo "This might be due to:"
    echo "1. No indexes deployed yet"
    echo "2. Permission issues"
    echo "3. Project not properly configured"
fi

echo ""
echo "🌐 You can also check indexes in Firebase Console:"
echo "https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
echo ""

# Check if indexes file exists locally
if [ -f "firestore.indexes.json" ]; then
    INDEX_COUNT=$(jq '.indexes | length' firestore.indexes.json 2>/dev/null || echo "unknown")
    echo "📁 Local indexes file: $INDEX_COUNT indexes defined"
else
    echo "⚠️  No local firestore.indexes.json found"
fi

echo ""
echo "💡 Quick actions:"
echo "• Deploy indexes: ./deploy-indexes.sh"
echo "• View in console: https://console.firebase.google.com/project/$PROJECT_ID/firestore/indexes"
echo "• Check specific collection: firebase firestore:indexes --collection products"