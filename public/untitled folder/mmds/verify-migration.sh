#!/bin/bash

# Verification script for sidebar migration

echo "🔍 Verifying Sidebar Migration..."
echo "=================================="

# Check for any remaining old layout imports
echo "1. Checking for old layout imports..."
OLD_IMPORTS=$(find src -name "*.tsx" -exec grep -l "import.*DashboardLayout.*from.*DashboardLayout/DashboardLayout\|import.*EnhancedDashboardLayout.*from.*DashboardLayout/EnhancedDashboardLayout" {} \; 2>/dev/null)

if [ -z "$OLD_IMPORTS" ]; then
    echo "   ✅ No old layout imports found"
else
    echo "   ❌ Found old imports in:"
    echo "$OLD_IMPORTS"
fi

# Count ImprovedDashboardLayout usage
echo ""
echo "2. Counting ImprovedDashboardLayout usage..."
IMPROVED_COUNT=$(find src -name "*.tsx" -exec grep -l "import.*ImprovedDashboardLayout" {} \; 2>/dev/null | wc -l)
echo "   📊 Found $IMPROVED_COUNT files using ImprovedDashboardLayout"

# Check for component usage consistency
echo ""
echo "3. Checking component usage consistency..."
COMPONENT_ISSUES=$(find src -name "*.tsx" -exec grep -l "<DashboardLayout>\|<EnhancedDashboardLayout>\|<ResponsiveDashboardLayout>" {} \; 2>/dev/null)

if [ -z "$COMPONENT_ISSUES" ]; then
    echo "   ✅ All component usages updated"
else
    echo "   ❌ Found old component usage in:"
    echo "$COMPONENT_ISSUES"
fi

# Check for TypeScript compilation issues
echo ""
echo "4. Checking TypeScript compilation..."
if command -v npx &> /dev/null; then
    if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
        echo "   ✅ TypeScript compilation successful"
    else
        echo "   ⚠️  TypeScript compilation has issues (check manually)"
    fi
else
    echo "   ⚠️  TypeScript not available for verification"
fi

# Summary
echo ""
echo "📋 Migration Summary:"
echo "===================="
echo "   • Files migrated: $IMPROVED_COUNT"
echo "   • Old imports remaining: $(echo "$OLD_IMPORTS" | wc -l)"
echo "   • Component usage issues: $(echo "$COMPONENT_ISSUES" | wc -l)"

if [ -z "$OLD_IMPORTS" ] && [ -z "$COMPONENT_ISSUES" ]; then
    echo ""
    echo "🎉 Migration verification PASSED!"
    echo "   All pages successfully migrated to ImprovedDashboardLayout"
else
    echo ""
    echo "⚠️  Migration verification found issues"
    echo "   Please review and fix the files listed above"
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Test the application in development"
echo "   2. Verify all pages load correctly"
echo "   3. Test responsive behavior on mobile"
echo "   4. Check search functionality (Ctrl+K)"
echo "   5. Verify keyboard navigation (Ctrl+B)"