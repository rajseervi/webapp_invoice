#!/bin/bash

# Verification script for JSX syntax fixes

echo "🔍 Verifying JSX syntax fixes..."
echo "================================"

# Check for any remaining EnhancedDashboardLayout JSX usage
echo "1. Checking for remaining EnhancedDashboardLayout JSX usage..."
ENHANCED_JSX=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "<EnhancedDashboardLayout\|</EnhancedDashboardLayout>" 2>/dev/null)

if [ -z "$ENHANCED_JSX" ]; then
    echo "   ✅ No EnhancedDashboardLayout JSX usage found"
else
    echo "   ❌ Found remaining EnhancedDashboardLayout JSX usage in:"
    echo "$ENHANCED_JSX"
fi

# Check for proper ImprovedDashboardLayout usage
echo ""
echo "2. Checking ImprovedDashboardLayout usage..."
IMPROVED_JSX=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "<ImprovedDashboardLayout\|</ImprovedDashboardLayout>" 2>/dev/null | wc -l)
echo "   📊 Found $IMPROVED_JSX files using ImprovedDashboardLayout JSX"

# Check for import/JSX consistency
echo ""
echo "3. Checking import/JSX consistency..."
INCONSISTENT_FILES=()

for file in $(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx"); do
    if grep -q "import.*ImprovedDashboardLayout" "$file" 2>/dev/null; then
        if grep -q "<EnhancedDashboardLayout\|</EnhancedDashboardLayout>" "$file" 2>/dev/null; then
            INCONSISTENT_FILES+=("$file")
        fi
    fi
done

if [ ${#INCONSISTENT_FILES[@]} -eq 0 ]; then
    echo "   ✅ All files have consistent import/JSX usage"
else
    echo "   ❌ Found inconsistent import/JSX usage in:"
    for file in "${INCONSISTENT_FILES[@]}"; do
        echo "      $file"
    done
fi

# Check specific problematic files mentioned in the error
echo ""
echo "4. Checking specific files mentioned in error..."

FILES_TO_CHECK=(
    "src/components/ModernSidebar/ResponsiveSidebarDemo.tsx"
    "src/app/sidebar-demo/page.tsx"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        if grep -q "<EnhancedDashboardLayout\|</EnhancedDashboardLayout>" "$file" 2>/dev/null; then
            echo "   ❌ $file still has EnhancedDashboardLayout JSX"
        else
            echo "   ✅ $file is fixed"
        fi
    else
        echo "   ⚠️  $file not found"
    fi
done

echo ""
echo "📋 Fix Summary:"
echo "==============="
echo "   • EnhancedDashboardLayout JSX remaining: $(echo "$ENHANCED_JSX" | wc -l)"
echo "   • ImprovedDashboardLayout JSX files: $IMPROVED_JSX"
echo "   • Inconsistent files: ${#INCONSISTENT_FILES[@]}"

if [ -z "$ENHANCED_JSX" ] && [ ${#INCONSISTENT_FILES[@]} -eq 0 ]; then
    echo ""
    echo "🎉 All JSX syntax issues FIXED!"
    echo "   No more EnhancedDashboardLayout JSX usage found"
    echo "   All imports and JSX usage are consistent"
else
    echo ""
    echo "⚠️  JSX syntax issues still exist"
    echo "   Please review and fix the files listed above"
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Test the application compilation"
echo "   2. Verify all pages load correctly"
echo "   3. Check for any remaining TypeScript errors"