const fs = require('fs');

// Read the file
let content = fs.readFileSync('/Users/prakashseervi/Documents/cust_proj/gst/src/app/invoices/gst/new/page.tsx', 'utf8');

// Replace the products query section
content = content.replace(
  /\/\/ Load products with userId filter\s*const productsQuery = query\(\s*collection\(db, 'products'\),\s*where\('userId', '==', userId\)\s*\);/g,
  `// Load all products
      const productsQuery = query(
        collection(db, 'products')
      );`
);

// Replace the parties query section
content = content.replace(
  /\/\/ Load parties with userId filter\s*const partiesQuery = query\(\s*collection\(db, 'parties'\),\s*where\('userId', '==', userId\)\s*\);/g,
  `// Load all parties
      const partiesQuery = query(
        collection(db, 'parties')
      );`
);

// Replace the categories query section
content = content.replace(
  /\/\/ Load categories with userId filter\s*const categoriesQuery = query\(\s*collection\(db, 'categories'\),\s*where\('userId', '==', userId\)\s*\);/g,
  `// Load all categories
      const categoriesQuery = query(
        collection(db, 'categories')
      );`
);

// Update error message
content = content.replace(
  /No products found\. Please add products first\./g,
  'No products found in the database. Please add products using the Product Management page first.'
);

// Write the file back
fs.writeFileSync('/Users/prakashseervi/Documents/cust_proj/gst/src/app/invoices/gst/new/page.tsx', content);

console.log('Fixed the products loading issue in GST invoice page');