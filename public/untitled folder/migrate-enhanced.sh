#!/bin/bash

# Script to migrate remaining EnhancedDashboardLayout files

echo "Updating remaining EnhancedDashboardLayout files..."

# Function to update a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace import statements
        sed -i.bak 's|import EnhancedDashboardLayout from.*DashboardLayout/EnhancedDashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        sed -i.bak 's|import EnhancedDashboardLayout from.*../DashboardLayout/EnhancedDashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        
        # Replace component usage
        sed -i.bak 's|<EnhancedDashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</EnhancedDashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        
        # Remove backup file
        rm -f "$file.bak"
        
        echo "✓ Updated $file"
    else
        echo "✗ File not found: $file"
    fi
}

# Files with EnhancedDashboardLayout to update
files=(
    "src/components/ModernSidebar/ResponsiveSidebarDemo.tsx"
    "src/app/inventory/page.tsx"
    "src/app/invoices/gst-only/page.tsx"
    "src/app/invoices/create/page.tsx"
    "src/app/invoices/page.tsx"
    "src/app/invoices/sales/page.tsx"
    "src/app/invoices/gst/page.tsx"
    "src/app/invoices/gst/inclusive/page.tsx"
    "src/app/invoices/gst/new/page.tsx"
    "src/app/invoices/gst/new/page_with_quick_setup.tsx"
    "src/app/inventory/purchase-invoices/[id]/payment/page.tsx"
    "src/app/reports/profit-loss/page.tsx"
    "src/app/parties/new/page.tsx"
    "src/app/parties/[id]/page.tsx"
    "src/app/parties/edit/[id]/page.tsx"
    "src/app/sidebar-demo/page.tsx"
    "src/app/admin/dashboard/page.tsx"
    "src/app/products/enhanced-management/page.tsx"
    "src/app/products/import/page.tsx"
    "src/app/products/import/enhanced-page.tsx"
    "src/app/products/new-multiple/page.tsx"
    "src/app/products/dashboard/page.tsx"
    "src/app/settings/gst/page.tsx"
)

# Update each file
for file in "${files[@]}"; do
    update_file "$file"
done

echo ""
echo "EnhancedDashboardLayout migration completed!"
echo "Files updated: ${#files[@]}"