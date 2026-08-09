#!/bin/bash

# Script to change "Sales Invoices" to "Regular Invoices" throughout the application

echo "🔄 Changing Sales Invoices to Regular Invoices..."
echo "================================================"

# Function to update a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "Updating $file..."
        
        # Replace various forms of "Sales Invoice" with "Regular Invoice"
        sed -i.bak 's/Sales Invoice/Regular Invoice/g' "$file"
        sed -i.bak 's/Sales Invoices/Regular Invoices/g' "$file"
        sed -i.bak 's/sales invoice/regular invoice/g' "$file"
        sed -i.bak 's/sales invoices/regular invoices/g' "$file"
        
        # Replace "Sales invoice" (title case) with "Regular invoice"
        sed -i.bak 's/Sales invoice/Regular invoice/g' "$file"
        
        # Replace sales-invoices in IDs and paths
        sed -i.bak 's/sales-invoices/regular-invoices/g' "$file"
        sed -i.bak 's/sales_invoices/regular_invoices/g' "$file"
        
        # Replace specific navigation and component references
        sed -i.bak 's/"Sales Invoices"/"Regular Invoices"/g' "$file"
        sed -i.bak 's/'\''Sales Invoices'\''/'\''Regular Invoices'\''/g' "$file"
        
        # Replace descriptions
        sed -i.bak 's/Sales invoice management/Regular invoice management/g' "$file"
        sed -i.bak 's/sales invoice management/regular invoice management/g' "$file"
        
        # Remove backup file
        rm -f "$file.bak"
        
        echo "✓ Updated $file"
    else
        echo "✗ File not found: $file"
    fi
}

# List of files to update
files=(
    "src/components/ModernSidebar/ModernSidebar.tsx"
    "src/components/Sidebar/ImprovedSidebar.tsx"
    "src/components/Navigation/EnhancedNavigation.tsx"
    "src/components/Inventory/EnhancedInventoryManager.tsx"
    "src/components/Inventory/SalesInvoiceManager.tsx"
    "src/components/Inventory/InventoryDashboard.tsx"
    "src/app/invoices/sales/page.tsx"
    "src/components/invoices/SimplifiedInvoiceCreation.tsx"
    "src/services/enhancedValidationService.ts"
    "src/services/enhancedInvoiceService.ts"
    "src/services/profitLossService.ts"
)

# Update each file
for file in "${files[@]}"; do
    update_file "$file"
done

echo ""
echo "📁 Renaming sales invoice directory..."

# Check if sales directory exists and rename it
if [ -d "src/app/invoices/sales" ]; then
    echo "Renaming src/app/invoices/sales to src/app/invoices/regular..."
    mv "src/app/invoices/sales" "src/app/invoices/regular"
    echo "✓ Directory renamed"
else
    echo "ℹ️  Sales directory not found or already renamed"
fi

# Update any remaining path references
echo ""
echo "🔗 Updating path references..."

# Find and update any remaining /invoices/sales paths
find src -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "/invoices/sales" | while read file; do
    echo "Updating path references in $file..."
    sed -i.bak 's|/invoices/sales|/invoices/regular|g' "$file"
    rm -f "$file.bak"
    echo "✓ Updated paths in $file"
done

echo ""
echo "🎉 Sales to Regular Invoice conversion completed!"
echo ""
echo "Summary of changes:"
echo "==================="
echo "✅ Updated component labels and descriptions"
echo "✅ Updated navigation menu items"
echo "✅ Updated file paths and routes"
echo "✅ Updated service references"
echo "✅ Renamed directory structure"
echo ""
echo "Next steps:"
echo "1. Test the application to ensure all links work"
echo "2. Update any remaining hardcoded references"
echo "3. Check for any broken routes"
echo "4. Update documentation if needed"