"use client"
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Autocomplete,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  useTheme,
  alpha
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as PdfIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Merge as MergeIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  LocalOffer as PriceIcon,
  Inventory as StockIcon
} from '@mui/icons-material';
import pdfToText from 'react-pdftotext';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/firebase/config';
import ProductMappingDialog from './ProductMappingDialog';
import ExtractedProductsEditor from './ExtractedProductsEditor';

// Types
interface ExtractedProduct {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  description?: string;
  confidence: number; // 0-100 confidence score
  rawText?: string; // Original text from PDF
}

interface ExistingProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

interface Category {
  id: string;
  name: string;
}

interface ProductMapping {
  extractedProductId: string;
  action: 'create' | 'update' | 'ignore';
  existingProductId?: string;
  newCategory?: string;
  updatePrice?: boolean;
  updateStock?: boolean;
  confidence: number;
}

interface PdfProductImportProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PdfProductImport: React.FC<PdfProductImportProps> = ({ open, onClose, onSuccess }) => {
  const theme = useTheme();
  
  // State management
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [rawPdfText, setRawPdfText] = useState<string>('');
  const [demoMode, setDemoMode] = useState(false);
  const [autoMapping, setAutoMapping] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [editorDialogOpen, setEditorDialogOpen] = useState(false);

  const steps = ['Upload PDF', 'Extract Data', 'Map Products', 'Review & Import'];

  // Load existing data
  useEffect(() => {
    if (open) {
      loadExistingData();
    }
  }, [open]);

  const loadExistingData = async () => {
    try {
      // Load existing products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        category: doc.data().category,
        price: doc.data().price,
        stock: doc.data().stock
      }));
      setExistingProducts(products);

      // Load categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const cats = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setCategories(cats);
    } catch (err) {
      console.error('Error loading existing data:', err);
      setError('Failed to load existing data');
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setError(null);
      setActiveStep(1);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // PDF text extraction
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      setProcessingStatus('Extracting text from PDF...');
      const text = await pdfToText(file);
      setRawPdfText(text);
      return text;
    } catch (err) {
      throw new Error('Failed to extract text from PDF: ' + (err as Error).message);
    }
  };

  // Enhanced product data extraction with improved parsing
  const extractProductData = (text: string): ExtractedProduct[] => {
    setProcessingStatus('Analyzing product data...');
    
    const products: ExtractedProduct[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    console.log('PDF Text Lines:', lines); // Debug log
    console.log('Total lines to process:', lines.length);

    // Enhanced extraction patterns with better name and quantity matching
    const patterns = [
      // Pattern 1: Table format with clear separators (|, tabs)
      {
        regex: /^(.+?)\s*[\|\t]+\s*(\d+(?:\.\d+)?)\s*[\|\t]+\s*[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 98,
        description: 'Table with pipe/tab separators'
      },
      
      // Pattern 2: Multiple spaces (3 or more) as separators
      {
        regex: /^(.+?)\s{3,}(\d+(?:\.\d+)?)\s{3,}[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 95,
        description: 'Multiple spaces (3+) separator'
      },
      
      // Pattern 3: Two or more spaces as separators
      {
        regex: /^(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 90,
        description: 'Multiple spaces (2+) separator'
      },
      
      // Pattern 4: Serial number followed by product name, qty, price
      {
        regex: /^(?:\d+\.?\s+)(.+?)\s+(\d+(?:\.\d+)?)\s+[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 88,
        description: 'Serial number prefix'
      },
      
      // Pattern 5: Product name with units/description in parentheses
      {
        regex: /^(.+?(?:\s*\([^)]*\))?)\s+(\d+(?:\.\d+)?)\s+[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 85,
        description: 'Name with parentheses'
      },
      
      // Pattern 6: Name, quantity with units (like "10 pcs"), price
      {
        regex: /^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|pieces?|units?|nos?|kg|gm|ltr|ml)?\s+[₹$€£]?\s*([\d,]+\.?\d*)\s*$/i,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 83,
        description: 'Quantity with units'
      },
      
      // Pattern 7: Currency symbol at the end
      {
        regex: /^(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+\.?\d*)\s*[₹$€£]\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 82,
        description: 'Currency at end'
      },
      
      // Pattern 8: Name ending with colon or dash
      {
        regex: /^(.+?)[\:\-]\s*(\d+(?:\.\d+)?)\s+[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 80,
        description: 'Name with colon/dash'
      },
      
      // Pattern 9: Simple format with single space separators
      {
        regex: /^([A-Za-z][A-Za-z\s\-\(\)\/\&\,\.]{2,}?)\s+(\d+(?:\.\d+)?)\s+[₹$€£]?\s*([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 78,
        description: 'Single space separator'
      },
      
      // Pattern 10: Flexible pattern for edge cases
      {
        regex: /^(.+?)\s+(\d+)\s+([\d,]+\.?\d*)\s*$/,
        nameIndex: 1,
        qtyIndex: 2,
        priceIndex: 3,
        confidence: 75,
        description: 'Basic three-column'
      }
    ];

    // Enhanced header detection with better table structure analysis
    const headerPatterns = [
      /(?:item|product|description|name|particulars|goods)/i,
      /(?:qty|quantity|units|nos|pieces|qnty)/i,
      /(?:price|rate|amount|cost|value|total)/i
    ];

    // Find header line and determine column positions
    let headerLine = '';
    let headerIndex = -1;
    let columnPositions: { name: number, qty: number, price: number } | null = null;

    // Smart table detection - look for lines with multiple header keywords
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matchCount = headerPatterns.filter(pattern => pattern.test(line)).length;
      
      if (matchCount >= 2) { // At least 2 header patterns match
        headerLine = line;
        headerIndex = i;
        
        // Try to determine column positions more accurately
        const namePosMatch = line.match(/(?:item|product|description|name|particulars|goods)/i);
        const qtyPosMatch = line.match(/(?:qty|quantity|units|nos|pieces|qnty)/i);
        const pricePosMatch = line.match(/(?:price|rate|amount|cost|value|total)/i);
        
        if (namePosMatch && qtyPosMatch && pricePosMatch) {
          columnPositions = {
            name: line.indexOf(namePosMatch[0]),
            qty: line.indexOf(qtyPosMatch[0]),
            price: line.indexOf(pricePosMatch[0])
          };
        }
        break;
      }
    }

    // If no clear header found, try to detect table structure from data patterns
    if (!headerLine && lines.length > 5) {
      console.log('No clear header found, analyzing data patterns...');
      
      // Look for consistent patterns in the first few data lines
      const potentialDataLines = lines.slice(0, Math.min(20, lines.length))
        .filter(line => line.length > 15 && /[A-Za-z]/.test(line) && /\d/.test(line));
      
      if (potentialDataLines.length >= 3) {
        // Analyze spacing patterns to infer column positions
        const spacingAnalysis = potentialDataLines.map(line => {
          const parts = line.split(/\s{2,}/); // Split on 2+ spaces
          return parts.length;
        });
        
        const avgParts = spacingAnalysis.reduce((a, b) => a + b, 0) / spacingAnalysis.length;
        
        if (avgParts >= 3) {
          console.log('Detected table structure with', avgParts, 'average columns');
          // Use the first line to estimate column positions
          const firstLine = potentialDataLines[0];
          const parts = firstLine.split(/\s{2,}/);
          
          if (parts.length >= 3) {
            let pos = 0;
            columnPositions = {
              name: 0,
              qty: firstLine.indexOf(parts[parts.length - 2]),
              price: firstLine.indexOf(parts[parts.length - 1])
            };
            console.log('Estimated column positions:', columnPositions);
          }
        }
      }
    }

    console.log('Header found:', headerLine, 'at index:', headerIndex);
    console.log('Column positions:', columnPositions);

    // Analyze line patterns to understand the PDF structure
    const analyzeLinePattern = (line: string) => {
      const words = line.split(/\s+/);
      const numbers = line.match(/\d+(?:\.\d+)?/g) || [];
      const hasText = /[A-Za-z]{3,}/.test(line);
      const hasCurrency = /[₹$€£]/.test(line);
      
      return {
        wordCount: words.length,
        numberCount: numbers.length,
        hasText,
        hasCurrency,
        length: line.length,
        numbers: numbers.map(n => parseFloat(n))
      };
    };

    // Extract products using patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines, empty lines, and lines that are too short
      if (i === headerIndex || line.length < 5) continue;
      
      // Skip lines that look like totals, footers, or page numbers
      if (/(?:total|subtotal|sum|page|footer|grand|net|tax|discount|amount|signature|thank|regards|terms|conditions)/i.test(line)) {
        console.log('Skipping footer/total line:', line);
        continue;
      }
      
      // Skip lines that are mostly numbers (likely not product lines)
      if (/^\s*[\d\s\.\,\-\|\t]+\s*$/.test(line)) {
        console.log('Skipping number-only line:', line);
        continue;
      }

      // Skip very short lines that are unlikely to contain product info
      if (line.length < 10) {
        console.log('Skipping short line:', line);
        continue;
      }

      let productFound = false;

      // Try position-based extraction if we have column positions
      if (columnPositions && headerIndex >= 0 && i > headerIndex) {
        try {
          // Calculate column boundaries more accurately
          const sortedPositions = [
            { name: 'name', pos: columnPositions.name },
            { name: 'qty', pos: columnPositions.qty },
            { name: 'price', pos: columnPositions.price }
          ].sort((a, b) => a.pos - b.pos);

          // Extract text based on column positions
          let nameText = '';
          let qtyText = '';
          let priceText = '';

          if (sortedPositions[0].name === 'name') {
            const nameEnd = sortedPositions[1].pos;
            nameText = line.substring(0, nameEnd).trim();
            
            if (sortedPositions[1].name === 'qty') {
              const qtyEnd = sortedPositions[2].pos;
              qtyText = line.substring(sortedPositions[1].pos, qtyEnd).trim();
              priceText = line.substring(sortedPositions[2].pos).trim();
            } else {
              // name, price, qty order
              priceText = line.substring(sortedPositions[1].pos, sortedPositions[2].pos).trim();
              qtyText = line.substring(sortedPositions[2].pos).trim();
            }
          }

          // Clean and extract the data
          if (nameText && qtyText && priceText) {
            // Extract quantity - look for the first number
            const qtyMatch = qtyText.match(/(\d+(?:\.\d+)?)/);
            // Extract price - look for number with possible currency symbols
            const priceMatch = priceText.match(/([\d,]+\.?\d*)/);

            if (qtyMatch && priceMatch) {
              const quantity = parseFloat(qtyMatch[1]);
              const rawPrice = priceMatch[1].replace(/,/g, '').replace(/[₹$€£]/g, '');
              const price = parseFloat(rawPrice);

              if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
                const cleanName = cleanProductName(nameText);
                
                if (cleanName.length > 2) {
                  products.push({
                    id: `extracted_${products.length + 1}`,
                    name: cleanName,
                    quantity,
                    price,
                    confidence: 95,
                    rawText: line,
                    category: inferCategory(cleanName)
                  });
                  productFound = true;
                  console.log('Position-based extraction:', { 
                    name: cleanName, 
                    quantity, 
                    price,
                    nameText: nameText,
                    qtyText: qtyText,
                    priceText: priceText
                  });
                }
              }
            }
          }
        } catch (err) {
          console.log('Position-based extraction failed for line:', line, 'Error:', err);
        }
      }

      // If position-based extraction didn't work, try pattern matching
      if (!productFound) {
        // Analyze the line structure first
        const lineAnalysis = analyzeLinePattern(line);
        console.log(`Analyzing line ${i}: "${line}"`, lineAnalysis);
        
        // Only try pattern matching on lines that look like product data
        if (lineAnalysis.hasText && lineAnalysis.numberCount >= 2 && lineAnalysis.wordCount >= 2) {
          for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
              console.log(`Pattern matched (${pattern.description}):`, match);
              
              const nameText = match[pattern.nameIndex]?.trim();
              const qtyText = match[pattern.qtyIndex]?.trim();
              const priceText = match[pattern.priceIndex]?.trim();

              if (nameText && qtyText && priceText) {
                // More robust quantity extraction
                const qtyMatch = qtyText.match(/(\d+(?:\.\d+)?)/);
                const quantity = qtyMatch ? parseFloat(qtyMatch[1]) : parseFloat(qtyText);
                
                // Better price cleaning - remove currency symbols and commas
                const cleanPriceText = priceText.replace(/[₹$€£,\s]/g, '').trim();
                const price = parseFloat(cleanPriceText);

                if (!isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
                  const cleanName = cleanProductName(nameText);

                  if (cleanName.length > 2) {
                    products.push({
                      id: `extracted_${products.length + 1}`,
                      name: cleanName,
                      quantity,
                      price,
                      confidence: pattern.confidence,
                      rawText: line,
                      category: inferCategory(cleanName)
                    });
                    productFound = true;
                    console.log('Pattern extraction:', { 
                      name: cleanName, 
                      quantity, 
                      price, 
                      pattern: pattern.description,
                      originalName: nameText,
                      originalQty: qtyText,
                      originalPrice: priceText
                    });
                    break; // Found a match, don't try other patterns
                  }
                }
              }
            }
          }
        } else {
          console.log(`Skipping line ${i} - doesn't look like product data:`, lineAnalysis);
        }
      }

      // If no pattern matched, try a fallback extraction for lines that might contain products
      if (!productFound && line.length > 15) {
        // Look for any line that has at least one word followed by numbers
        const fallbackMatch = line.match(/([A-Za-z][^0-9]*?)\s+.*?(\d+(?:\.\d+)?)\s+.*?([\d,]+\.?\d*)/);
        if (fallbackMatch) {
          const nameText = fallbackMatch[1]?.trim();
          const quantity = parseFloat(fallbackMatch[2]);
          const rawPrice = fallbackMatch[3].replace(/[₹$€£,]/g, '').trim();
          const price = parseFloat(rawPrice);

          if (nameText && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            const cleanName = cleanProductName(nameText);
            
            if (cleanName.length > 3) {
              products.push({
                id: `extracted_${products.length + 1}`,
                name: cleanName,
                quantity,
                price,
                confidence: 60, // Lower confidence for fallback extraction
                rawText: line,
                category: inferCategory(cleanName)
              });
              console.log('Fallback extraction:', { name: cleanName, quantity, price });
            }
          }
        }
      }
    }

    console.log('Total products extracted:', products.length);
    
    // If no products found, try a more aggressive extraction
    if (products.length === 0) {
      console.log('No products found with standard patterns, trying aggressive extraction...');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip obvious non-product lines
        if (line.length < 8 || /(?:total|page|footer|header|date|invoice|bill)/i.test(line)) continue;
        
        // Look for any line with text and at least two numbers
        const aggressiveMatch = line.match(/([A-Za-z][^0-9]{2,}?)\s+.*?(\d+(?:\.\d+)?)\s+.*?([\d,]+\.?\d*)/);
        if (aggressiveMatch) {
          const nameText = aggressiveMatch[1]?.trim();
          const quantity = parseFloat(aggressiveMatch[2]);
          const rawPrice = aggressiveMatch[3].replace(/[₹$€£,]/g, '').trim();
          const price = parseFloat(rawPrice);

          if (nameText && !isNaN(quantity) && !isNaN(price) && quantity > 0 && price > 0) {
            const cleanName = cleanProductName(nameText);
            
            if (cleanName.length > 3) {
              products.push({
                id: `extracted_${products.length + 1}`,
                name: cleanName,
                quantity,
                price,
                confidence: 40, // Very low confidence for aggressive extraction
                rawText: line,
                category: inferCategory(cleanName)
              });
              console.log('Aggressive extraction:', { name: cleanName, quantity, price });
            }
          }
        }
      }
    }

    return products;
  };

  // Helper function to clean product names while preserving important information
  const cleanProductName = (name: string): string => {
    let cleaned = name;
    
    // Remove leading serial numbers like "1.", "Sr. No. 1", etc.
    cleaned = cleaned.replace(/^\d+\.?\s*/, '');
    cleaned = cleaned.replace(/^Sr\.?\s*No\.?\s*\d+\s*/i, '');
    
    // Remove obvious SKU codes (all caps/numbers at the beginning)
    cleaned = cleaned.replace(/^[A-Z0-9\-_]{3,}\s+/, '');
    
    // Remove trailing punctuation but preserve important parentheses content
    cleaned = cleaned.replace(/[\:\-]\s*$/, '');
    
    // Normalize spaces but preserve the structure
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove leading/trailing whitespace and non-essential characters
    cleaned = cleaned.replace(/^[\s\-\.\,\:]+/, '');
    cleaned = cleaned.replace(/[\s\-\.\,\:]+$/, '');
    
    // Only remove trailing parentheses if they seem to contain units or codes
    cleaned = cleaned.replace(/\s*\([^)]*(?:pcs?|pieces?|units?|nos?|kg|gm|ltr|ml|code|ref)\)\s*$/i, '');
    
    return cleaned.trim();
  };

  // Infer category based on product name
  const inferCategory = (productName: string): string => {
    const categoryKeywords = {
      'Electronics': ['laptop', 'computer', 'phone', 'tablet', 'monitor', 'keyboard', 'mouse', 'headphone', 'speaker'],
      'Office Supplies': ['pen', 'paper', 'notebook', 'folder', 'stapler', 'clip', 'desk', 'chair'],
      'Furniture': ['table', 'chair', 'desk', 'cabinet', 'shelf', 'sofa', 'bed'],
      'Clothing': ['shirt', 'pant', 'dress', 'shoe', 'jacket', 'hat', 'sock'],
      'Books': ['book', 'manual', 'guide', 'textbook', 'novel', 'magazine'],
      'Tools': ['hammer', 'screwdriver', 'drill', 'saw', 'wrench', 'plier']
    };

    const nameLower = productName.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => nameLower.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  };

  // Generate demo data
  const generateDemoData = (): ExtractedProduct[] => {
    const demoProducts = [
      { name: 'Premium Wireless Headphones', quantity: 25, price: 199.99, category: 'Electronics' },
      { name: 'Ergonomic Office Chair', quantity: 10, price: 299.50, category: 'Furniture' },
      { name: 'Bluetooth Keyboard', quantity: 15, price: 89.99, category: 'Electronics' },
      { name: 'LED Monitor 24"', quantity: 8, price: 249.00, category: 'Electronics' },
      { name: 'Office Desk Organizer', quantity: 30, price: 24.99, category: 'Office Supplies' }
    ];

    return demoProducts.map((product, index) => ({
      id: `demo_${index + 1}`,
      ...product,
      confidence: 95,
      rawText: `${product.name} ${product.quantity} ${product.price}`
    }));
  };

  // Process PDF
  const processPdf = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);

    try {
      let products: ExtractedProduct[] = [];

      if (demoMode) {
        setProcessingStatus('Generating demo data...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        products = generateDemoData();
      } else {
        const text = await extractTextFromPdf(selectedFile);
        products = extractProductData(text);
        
        if (products.length === 0) {
          setProcessingStatus('No products found. Generating demo data...');
          products = generateDemoData();
        }
      }

      setExtractedProducts(products);
      setActiveStep(2);
      setProcessingStatus(`Successfully extracted ${products.length} products`);
      
      // Open mapping dialog
      setMappingDialogOpen(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle mapping completion
  const handleMappingComplete = (mappings: ProductMapping[]) => {
    setProductMappings(mappings);
    setMappingDialogOpen(false);
    setActiveStep(3);
  };

  // Handle extracted products edit
  const handleProductsEdit = (editedProducts: ExtractedProduct[]) => {
    setExtractedProducts(editedProducts);
    setEditorDialogOpen(false);
  };

  // Import products
  const importProducts = async () => {
    setIsProcessing(true);
    setProcessingStatus('Importing products...');
    
    try {
      let imported = 0;
      let updated = 0;
      
      for (const mapping of productMappings) {
        if (mapping.action === 'ignore') continue;
        
        const extractedProduct = extractedProducts.find(p => 
          p.id === mapping.extractedProductId
        );
        
        if (!extractedProduct) continue;
        
        if (mapping.action === 'create') {
          // Create new product
          await addDoc(collection(db, 'products'), {
            name: extractedProduct.name,
            category: mapping.newCategory || 'General',
            price: extractedProduct.price,
            stock: extractedProduct.quantity,
            description: extractedProduct.description || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          imported++;
        } else if (mapping.action === 'update' && mapping.existingProductId) {
          // Update existing product
          const productRef = doc(db, 'products', mapping.existingProductId);
          const updateData: any = {
            updatedAt: new Date().toISOString()
          };
          
          if (mapping.updateStock) {
            updateData.stock = extractedProduct.quantity;
          }
          
          if (mapping.updatePrice) {
            updateData.price = extractedProduct.price;
          }
          
          await updateDoc(productRef, updateData);
          updated++;
        }
      }
      
      setProcessingStatus(`Import complete: ${imported} created, ${updated} updated`);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
      
    } catch (err) {
      setError('Failed to import products: ' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setActiveStep(0);
    setSelectedFile(null);
    setExtractedProducts([]);
    setProductMappings([]);
    setError(null);
    setProcessingStatus('');
    setRawPdfText('');
    setSelectedProducts(new Set());
    setMappingDialogOpen(false);
    setEditorDialogOpen(false);
    onClose();
  };

  // Render step content
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PdfIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload PDF Document
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a PDF file containing product information
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                />
              }
              label="Demo Mode (Generate sample data)"
              sx={{ mb: 3 }}
            />
            
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              size="large"
            >
              Choose PDF File
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            
            {selectedFile && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Selected: {selectedFile.name}
              </Alert>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Extract Product Data
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing PDF and extracting product information
              </Typography>
            </Box>
            
            {isProcessing && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {processingStatus}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                onClick={processPdf}
                disabled={!selectedFile || isProcessing}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                {isProcessing ? 'Processing...' : 'Extract Data'}
              </Button>
              
              <Button variant="outlined" onClick={() => setActiveStep(0)}>
                Back
              </Button>
            </Box>
            
            {rawPdfText && (
              <Box sx={{ mt: 3 }}>
                <Accordion expanded={previewExpanded} onChange={() => setPreviewExpanded(!previewExpanded)}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>PDF Text Preview & Debug Info</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Raw PDF Text:
                        </Typography>
                        <Box
                          sx={{
                            maxHeight: 300,
                            overflow: 'auto',
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            border: '1px solid',
                            borderColor: 'grey.300'
                          }}
                        >
                          {rawPdfText.split('\n').map((line, index) => (
                            <Box key={index} sx={{ mb: 0.5 }}>
                              <Typography
                                component="span"
                                sx={{
                                  color: 'grey.500',
                                  fontSize: '0.7rem',
                                  mr: 1,
                                  minWidth: '30px',
                                  display: 'inline-block'
                                }}
                              >
                                {index + 1}:
                              </Typography>
                              <Typography
                                component="span"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  whiteSpace: 'pre'
                                }}
                              >
                                {line || '(empty line)'}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Extracted Products Preview:
                        </Typography>
                        <Box
                          sx={{
                            maxHeight: 300,
                            overflow: 'auto',
                            bgcolor: 'success.50',
                            p: 2,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'success.200'
                          }}
                        >
                          {extractedProducts.length > 0 ? (
                            extractedProducts.map((product, index) => (
                              <Box key={index} sx={{ mb: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {product.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Qty: {product.quantity} | Price: ${product.price} | Confidence: {product.confidence}%
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                                  Raw: {product.rawText}
                                </Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No products extracted yet. Click "Extract Data" to process the PDF.
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Box>
            )}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <MergeIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Product Mapping Complete
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Products have been mapped to your database. Review the mappings and proceed to import.
            </Typography>
            
            {productMappings.length > 0 && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {productMappings.filter(m => m.action === 'create').length} products will be created, {' '}
                {productMappings.filter(m => m.action === 'update').length} will be updated, {' '}
                {productMappings.filter(m => m.action === 'ignore').length} will be ignored
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setEditorDialogOpen(true)}
                startIcon={<EditIcon />}
              >
                Edit Products
              </Button>
              <Button
                variant="outlined"
                onClick={() => setMappingDialogOpen(true)}
              >
                Review Mappings
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                disabled={productMappings.length === 0}
              >
                Proceed to Import
              </Button>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review & Import
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Final review before importing products to your database
            </Typography>
            
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Options</TableCell>
                    <TableCell align="center">Confidence</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {extractedProducts.map((product) => {
                    const mapping = productMappings.find(m => m.extractedProductId === product.id);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell align="right">{product.quantity}</TableCell>
                        <TableCell align="right">${product.price}</TableCell>
                        <TableCell>
                          {mapping?.action === 'create' ? mapping.newCategory : product.category}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={mapping?.action || 'create'}
                            color={
                              mapping?.action === 'create' ? 'primary' :
                              mapping?.action === 'update' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {mapping?.action === 'update' && (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {mapping.updatePrice && (
                                <Chip label="Price" size="small" color="info" />
                              )}
                              {mapping.updateStock && (
                                <Chip label="Stock" size="small" color="info" />
                              )}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${mapping?.confidence || product.confidence}%`}
                            size="small"
                            color={(mapping?.confidence || product.confidence) > 80 ? 'success' : 'warning'}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                {productMappings.filter(m => m.action === 'create').length} products will be created, {' '}
                {productMappings.filter(m => m.action === 'update').length} will be updated
              </Typography>
            </Alert>
            
            {isProcessing && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  {processingStatus}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={importProducts}
                disabled={isProcessing || productMappings.length === 0}
                startIcon={isProcessing ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {isProcessing ? 'Importing...' : 'Import Products'}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '70vh',
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">PDF Product Import</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {renderStepContent()}
      </DialogContent>

      {/* Product Mapping Dialog */}
      <ProductMappingDialog
        open={mappingDialogOpen}
        onClose={() => setMappingDialogOpen(false)}
        extractedProducts={extractedProducts}
        existingProducts={existingProducts}
        categories={categories}
        onMappingComplete={handleMappingComplete}
      />

      {/* Extracted Products Editor Dialog */}
      <ExtractedProductsEditor
        open={editorDialogOpen}
        onClose={() => setEditorDialogOpen(false)}
        products={extractedProducts}
        onSave={handleProductsEdit}
      />
    </Dialog>
  );
};

export default PdfProductImport;