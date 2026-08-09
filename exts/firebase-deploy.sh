#!/bin/bash

# Firebase Deployment Script for GST Project
# This script deploys Firestore indexes and rules to Firebase

echo "🚀 Starting Firebase deployment for GST Project..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ You are not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

# Get current project
PROJECT=$(firebase use --json | jq -r '.result.project // empty')
if [ -z "$PROJECT" ]; then
    echo "❌ No Firebase project selected. Please select a project:"
    echo "firebase use --add"
    exit 1
fi

echo "📋 Current Firebase project: $PROJECT"

# Validate configuration files
echo "🔍 Validating configuration files..."

if [ ! -f "firestore.indexes.json" ]; then
    echo "❌ firestore.indexes.json not found!"
    exit 1
fi

if [ ! -f "firestore.rules" ]; then
    echo "❌ firestore.rules not found!"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    echo "❌ firebase.json not found!"
    exit 1
fi

echo "✅ All configuration files found"

# Deploy Firestore rules
echo "📝 Deploying Firestore security rules..."
if firebase deploy --only firestore:rules; then
    echo "✅ Firestore rules deployed successfully"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

# Deploy Firestore indexes
echo "🗂️  Deploying Firestore indexes..."
if firebase deploy --only firestore:indexes; then
    echo "✅ Firestore indexes deployed successfully"
else
    echo "❌ Failed to deploy Firestore indexes"
    exit 1
fi

echo ""
echo "🎉 Firebase deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  - Project: $PROJECT"
echo "  - Firestore Rules: ✅ Deployed"
echo "  - Firestore Indexes: ✅ Deployed"
echo ""
echo "🔗 Useful links:"
echo "  - Firebase Console: https://console.firebase.google.com/project/$PROJECT"
echo "  - Firestore Database: https://console.firebase.google.com/project/$PROJECT/firestore"
echo "  - Firestore Indexes: https://console.firebase.google.com/project/$PROJECT/firestore/indexes"
echo ""
echo "⚠️  Note: Index creation may take several minutes to complete."
echo "   You can monitor the progress in the Firebase Console."