# Product Form Fixes

## Issues Fixed

### 1. Category Selection Not Working

**Problem**: The product form was not showing categories in the dropdown because:
- Categories created through the categories page didn't have the `isActive` field
- The ProductForm was filtering categories with `cat.isActive` which excluded categories where `isActive` was undefined

**Solution**:
- Updated the category loading logic to include categories where `isActive !== false` (includes undefined)
- Modified the category creation in both the categories page and categoryService to always set `isActive: true`
- Added proper default values for `defaultDiscount` and `description` fields

### 2. GST Price Calculation Confusion

**Problem**: The form only supported GST-exclusive pricing, which was confusing for users who wanted to enter final selling prices including GST.

**Solution**:
- Added a toggle switch to choose between "Price Includes GST" and "Price Excludes GST"
- Updated price calculation functions to handle both scenarios:
  - **GST Exclusive**: User enters base price, GST is added on top
  - **GST Inclusive**: User enters final price, GST is calculated backwards
- Enhanced the tax calculation preview to show different breakdowns based on the pricing mode
- Updated labels and help text to be clearer about what price is being entered

## New Features

### Price Configuration Toggle
- Users can now choose whether the entered price includes or excludes GST
- Real-time calculation preview shows the breakdown in both modes
- Clear labeling and help text guide users on what to enter

### Enhanced Tax Calculation Preview
- Shows different calculations based on pricing mode
- For GST Inclusive: Shows entered price → base price → tax breakdown
- For GST Exclusive: Shows base price → tax calculation → final price
- Displays total tax amount separately for clarity

### Improved Category Management
- Categories now have proper default values when created
- Better filtering logic that doesn't exclude categories with undefined `isActive`
- Consistent data structure across the application

## Usage

### For GST Exclusive Pricing (Default)
1. Leave the "Price Includes GST" toggle OFF
2. Enter the base price (before tax)
3. The system will add GST on top to show the final selling price

### For GST Inclusive Pricing
1. Turn ON the "Price Includes GST" toggle
2. Enter the final selling price (including all taxes)
3. The system will calculate the base price and tax breakdown

## Default Categories Script

A script `add-default-categories.js` has been created to add some default categories for testing:
- Electronics
- Clothing  
- Books
- Home & Garden
- Sports & Fitness
- Food & Beverages
- Services

To use this script:
1. Update the Firebase configuration in the script
2. Run: `node add-default-categories.js`

## Technical Changes

### Files Modified:
1. `src/app/products/components/ProductForm.tsx`
   - Added price inclusion toggle
   - Enhanced price calculation functions
   - Improved tax preview display
   - Fixed category filtering logic

2. `src/services/categoryService.ts`
   - Added proper default values for category creation

3. `src/app/categories/page.tsx`
   - Updated category creation to include required fields

### New Functions:
- `getBasePriceExcludingTax()`: Calculates base price when GST is included
- Enhanced `calculateTaxAmount()`: Handles both inclusive and exclusive pricing
- Updated `getTotalPriceWithTax()`: Returns correct final price based on mode