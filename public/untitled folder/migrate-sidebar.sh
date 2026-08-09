#!/bin/bash

# Script to migrate all pages to use ImprovedDashboardLayout

echo "Starting sidebar migration..."

# Function to update a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace import statements
        sed -i.bak 's|import DashboardLayout from.*DashboardLayout/DashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        sed -i.bak 's|import EnhancedDashboardLayout from.*DashboardLayout/EnhancedDashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        sed -i.bak 's|import ResponsiveDashboardLayout from.*DashboardLayout/DashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        
        # Replace component usage
        sed -i.bak 's|<DashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</DashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|<EnhancedDashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</EnhancedDashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|<ResponsiveDashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</ResponsiveDashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        
        # Remove backup file
        rm -f "$file.bak"
        
        echo "✓ Updated $file"
    else
        echo "✗ File not found: $file"
    fi
}

# List of files to update
files=(
    "src/app/dashboard/page.tsx"
    "src/app/reports/page.tsx"
    "src/app/reports/hsn-analysis/page.tsx"
    "src/app/reports/some-report/page.tsx"
    "src/app/reports/users/page.tsx"
    "src/app/reports/data-quality/page.tsx"
    "src/app/reports/sales/page.tsx"
    "src/app/reports/products/page.tsx"
    "src/app/categories/page.tsx"
    "src/app/categories/[id]/analytics/page.tsx"
    "src/app/categories/new/page.tsx"
    "src/app/categories/edit/[id]/page.tsx"
    "src/app/categories/dashboard/page.tsx"
    "src/app/orders/page.tsx"
    "src/app/orders/[id]/page.tsx"
    "src/app/orders/new/page.tsx"
    "src/app/orders/[id]/edit/page.tsx"
    "src/app/inventory/purchase-invoices/page.tsx"
    "src/app/inventory/purchase-invoices/[id]/page.tsx"
    "src/app/inventory/purchase-invoices/new/page.tsx"
    "src/app/inventory/alerts/page.tsx"
    "src/app/admin/page.tsx"
    "src/app/admin/users/page.tsx"
    "src/app/admin/permissions/manage.tsx"
    "src/app/admin/roles/page.tsx"
    "src/app/admin/roles/assign/page.tsx"
    "src/app/admin/permissions/page.tsx"
    "src/app/products/page.tsx"
    "src/app/products/management/page.tsx"
    "src/app/products/enhanced/page.tsx"
    "src/app/products/enhanced/edit/[id]/page.tsx"
    "src/app/products/edit/[id]/page.tsx"
    "src/app/invoices/[id]/page.tsx"
    "src/app/invoices/[id]/edit/page.tsx"
    "src/app/invoices/[id]/simple/page.tsx"
    "src/app/invoices/new/page.tsx"
    "src/app/invoices/gst/[id]/edit/page.tsx"
    "src/app/stock-management/page.tsx"
    "src/app/parties/page.tsx"
    "src/app/parties/[id]/history/page.tsx"
    "src/app/profile/page.tsx"
    "src/app/quick-links/page.tsx"
    "src/app/quick-links/enhanced-page.tsx"
    "src/app/gst-ledger/page.tsx"
    "src/app/ledger/page.tsx"
)

# Update each file
for file in "${files[@]}"; do
    update_file "$file"
done

echo ""
echo "Migration completed!"
echo "Files updated: ${#files[@]}"
echo ""
echo "Next steps:"
echo "1. Test the application"
echo "2. Check for any compilation errors"
echo "3. Verify all pages are working correctly"
echo "4. Update any remaining custom layout usages manually"