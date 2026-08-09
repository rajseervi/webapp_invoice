#!/bin/bash

# Verification script for Sales to Regular Invoice conversion

echo "🔍 Verifying Sales to Regular Invoice conversion..."
echo "=================================================="

# Check for any remaining "Sales Invoice" references
echo "1. Checking for remaining 'Sales Invoice' references..."
SALES_REFS=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "Sales Invoice\|Sales Invoices" 2>/dev/null)

if [ -z "$SALES_REFS" ]; then
    echo "   ✅ No 'Sales Invoice' references found"
else
    echo "   ❌ Found remaining 'Sales Invoice' references in:"
    echo "$SALES_REFS"
fi

# Check for any remaining /invoices/sales paths
echo ""
echo "2. Checking for remaining '/invoices/sales' paths..."
SALES_PATHS=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "/invoices/sales" 2>/dev/null)

if [ -z "$SALES_PATHS" ]; then
    echo "   ✅ No '/invoices/sales' paths found"
else
    echo "   ❌ Found remaining '/invoices/sales' paths in:"
    echo "$SALES_PATHS"
fi

# Check for any remaining SalesInvoiceManager references
echo ""
echo "3. Checking for remaining 'SalesInvoiceManager' references..."
SALES_MANAGER_REFS=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "SalesInvoiceManager" 2>/dev/null)

if [ -z "$SALES_MANAGER_REFS" ]; then
    echo "   ✅ No 'SalesInvoiceManager' references found"
else
    echo "   ❌ Found remaining 'SalesInvoiceManager' references in:"
    echo "$SALES_MANAGER_REFS"
fi

# Check that the directory was renamed
echo ""
echo "4. Checking directory structure..."
if [ -d "src/app/invoices/regular" ]; then
    echo "   ✅ Regular invoices directory exists"
else
    echo "   ❌ Regular invoices directory not found"
fi

if [ -d "src/app/invoices/sales" ]; then
    echo "   ❌ Sales invoices directory still exists"
else
    echo "   ✅ Sales invoices directory successfully removed"
fi

# Check that RegularInvoiceManager exists
echo ""
echo "5. Checking component files..."
if [ -f "src/components/Inventory/RegularInvoiceManager.tsx" ]; then
    echo "   ✅ RegularInvoiceManager component exists"
else
    echo "   ❌ RegularInvoiceManager component not found"
fi

if [ -f "src/components/Inventory/SalesInvoiceManager.tsx" ]; then
    echo "   ❌ SalesInvoiceManager component still exists"
else
    echo "   ✅ SalesInvoiceManager component successfully removed"
fi

# Count Regular Invoice references
echo ""
echo "6. Counting 'Regular Invoice' references..."
REGULAR_COUNT=$(find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "Regular Invoice\|Regular Invoices" 2>/dev/null | wc -l)
echo "   📊 Found $REGULAR_COUNT files with 'Regular Invoice' references"

# Check navigation updates
echo ""
echo "7. Checking navigation updates..."
NAV_UPDATED=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "regular-invoices" 2>/dev/null | wc -l)
echo "   📊 Found $NAV_UPDATED navigation files with 'regular-invoices' IDs"

echo ""
echo "📋 Conversion Summary:"
echo "====================="
echo "   • Sales Invoice references: $(echo "$SALES_REFS" | wc -l)"
echo "   • Sales paths remaining: $(echo "$SALES_PATHS" | wc -l)"
echo "   • SalesInvoiceManager references: $(echo "$SALES_MANAGER_REFS" | wc -l)"
echo "   • Regular Invoice references: $REGULAR_COUNT"
echo "   • Navigation updates: $NAV_UPDATED"

if [ -z "$SALES_REFS" ] && [ -z "$SALES_PATHS" ] && [ -z "$SALES_MANAGER_REFS" ] && [ -d "src/app/invoices/regular" ] && [ -f "src/components/Inventory/RegularInvoiceManager.tsx" ]; then
    echo ""
    echo "🎉 Sales to Regular Invoice conversion SUCCESSFUL!"
    echo "   All references updated and files renamed correctly"
else
    echo ""
    echo "⚠️  Sales to Regular Invoice conversion has issues"
    echo "   Please review and fix the items listed above"
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Test the application to ensure all links work"
echo "   2. Verify navigation menus show 'Regular Invoices'"
echo "   3. Check that /invoices/regular route works"
echo "   4. Test invoice creation and management"
echo "   5. Update any documentation or help text"