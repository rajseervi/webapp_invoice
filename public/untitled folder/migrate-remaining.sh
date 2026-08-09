#!/bin/bash

# Script to migrate remaining files to use ImprovedDashboardLayout

echo "Updating remaining files..."

# Function to update a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace import statements
        sed -i.bak 's|import DashboardLayout from.*DashboardLayout/DashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        sed -i.bak 's|import ResponsiveDashboardLayout from.*DashboardLayout/DashboardLayout.*|import ImprovedDashboardLayout from '\''@/components/DashboardLayout/ImprovedDashboardLayout'\'';|g' "$file"
        
        # Replace component usage
        sed -i.bak 's|<DashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</DashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|<ResponsiveDashboardLayout>|<ImprovedDashboardLayout>|g' "$file"
        sed -i.bak 's|</ResponsiveDashboardLayout>|</ImprovedDashboardLayout>|g' "$file"
        
        # Remove backup file
        rm -f "$file.bak"
        
        echo "✓ Updated $file"
    else
        echo "✗ File not found: $file"
    fi
}

# Remaining files to update
files=(
    "src/app/products/new/page.tsx"
    "src/app/products/enhanced/test/page.tsx"
    "src/app/products/enhanced-page.tsx"
    "src/app/settings/page.tsx"
    "src/app/accounting/page.tsx"
    "src/app/accounting/statements/page.tsx"
    "src/app/accounting/ledger/page.tsx"
    "src/app/accounting/journal/page.tsx"
    "src/app/accounting/transactions/[id]/page.tsx"
    "src/app/accounting/transactions/page.tsx"
    "src/app/accounting/statements/party-bills/page.tsx"
    "src/app/accounting/transactions/new/page.tsx"
    "src/app/accounting/transactions/[id]/edit/page.tsx"
)

# Update each file
for file in "${files[@]}"; do
    update_file "$file"
done

echo ""
echo "Remaining files migration completed!"
echo "Files updated: ${#files[@]}"