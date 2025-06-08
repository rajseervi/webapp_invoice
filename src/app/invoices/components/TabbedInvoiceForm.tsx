"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Autocomplete,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Chip,
  Divider,
  Tooltip,
  Badge,
  Checkbox,
  ListItemText // Import ListItemText
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Add as AddIcon, 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  ShoppingCart as ShoppingCartIcon,
  Summarize as SummarizeIcon,
  CheckCircle as CheckCircleIcon,
  Percent as PercentIcon,
  Edit as EditIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from '@/app/hooks/useProducts';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import CategoryDiscountEditor from '@/components/invoices/CategoryDiscountEditor';
import LineItemDiscountEditor from '@/components/invoices/LineItemDiscountEditor';
import { transactionService } from '@/services/transactionService';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material'; 
import { useRouter } from 'next/navigation';

interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  categoryDiscounts: Record<string, number>;
  productDiscounts?: Record<string, number>;
}

interface InvoiceLineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  category: string;
  discount: number;
  discountType: 'none' | 'category' | 'product' | 'custom';
  finalPrice: number;
}

interface TabbedInvoiceFormProps {
  onSuccess?: () => void;
  invoiceId?: string;
}

// Tab panel component
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, index, value, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
      style={{ padding: '20px 0' }}
    >
      {value === index && (
        <Box>{children}</Box>
      )}
    </div>
  );
}

// function a11yProps(index: number) {
//   return {
//     id: `invoice-tab-${index}`,
//     'aria-controls': `invoice-tabpanel-${index}`,
//   };
// }

function a11yProps(index: number) {
  return {
    id: `invoice-tab-${index}`,
    'aria-controls': `invoice-tabpanel-${index}`,
  };
}

// export default function InvoiceForm({ onSuccess, invoiceId }: TabbedInvoiceFormProps) {
  export default function InvoiceForm({ onSuccess, invoiceId }: TabbedInvoiceFormProps) {
    const router = useRouter();
    const { parties, loading: loadingParties } = useParties();
 
  // const { parties, loading: loadingParties } = useParties();
  const { products, loading: loadingProducts, error: productsError, refetch: refetchProducts } = useProducts();
  const { userId, userRole } = useCurrentUser();
  const quantityInputRef = React.useRef<HTMLInputElement>(null);
  
  // Handle key press events for product selection
  const handleProductKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && selectedProductId) {
      event.preventDefault();
      handleAddProduct();
    }
  };

  // Handle focus out events for product selection
  const handleProductFocusOut = () => {
    if (selectedProductId) {
      handleAddProduct();
    }
  };
  
  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  
  // Invoice data
  const [selectedPartyId, setSelectedPartyId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  // State to track which line items have editable prices
  const [editablePriceItems, setEditablePriceItems] = useState<Record<number, boolean>>({});
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  
  // Party dialog
  const [openPartyDialog, setOpenPartyDialog] = useState(false);
  const [newParty, setNewParty] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    categoryDiscounts: {} as Record<string, number>,
    productDiscounts: {} as Record<string, number>
  });
  const [creatingParty, setCreatingParty] = useState(false);
  
  // Category discount editor
  const [openCategoryDiscountEditor, setOpenCategoryDiscountEditor] = useState(false);
  
  // New party category discount editor
  const [openNewPartyCategoryDiscountEditor, setOpenNewPartyCategoryDiscountEditor] = useState(false);
  
  // New product dialog
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  
  // Extract unique categories from products
  const uniqueCategories = useMemo(() => {
    const categories = products.map(product => product.category).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [products]);
  
  // Effect to handle custom category toggle
  useEffect(() => {
    if (useCustomCategory) {
      // When switching to custom category, clear the selected category
      setNewProductCategory('');
    } else {
      // When switching back to dropdown, clear the custom category
      setCustomCategory('');
    }
  }, [useCustomCategory]);

  // Fetch existing invoice data if editing
  useEffect(() => {
    const fetchInvoiceData = async () => {
      if (!invoiceId) return;
      if (!parties.length || !products.length) return;
      
      try {
        setLoading(true);
        
        // Use the executeWithRetry utility to handle connectivity issues
        await executeWithRetry(async () => {
          const invoiceRef = doc(db, 'invoices', invoiceId);
          const invoiceSnap = await getDoc(invoiceRef);
          
          if (!invoiceSnap.exists()) {
            setError('Invoice not found');
            return;
          }
          
          const invoiceData = invoiceSnap.data();
          setInvoiceNumber(invoiceData.invoiceNumber);
          setInvoiceDate(invoiceData.date);
          setSelectedPartyId(invoiceData.partyId);
          setTransportCharges(invoiceData.transportCharges || 0); // Load transport charges
          setNotes(invoiceData.notes || ''); // Load notes
          
          // Find the party to get their discounts
          const party = parties.find(p => p.id === invoiceData.partyId);
          
          // Map items preserving original discount values
          setLineItems(invoiceData.items.map((item) => {
            const product = products.find(p => p.id === item.productId);
            
            // Determine the appropriate discount based on saved values
            let discount = 0;
            let discountType: 'none' | 'category' | 'product' = 'none';
            
            if (item.discountType === 'product' || item.discountType === 'category') {
              discount = item.discount;
              discountType = item.discountType;
            } else if (party) {
              // Check for product-specific discount first
              const productDiscount = party.productDiscounts?.[item.productId] || 0;
              
              // Use category name to look up discount
              const categoryName = product?.category || '';
              const categoryDiscount = party.categoryDiscounts[categoryName] || 0;
              
              // Log for debugging
              console.log(`Loading item ${item.name}:`, {
                category: categoryName,
                categoryDiscount,
                productDiscount
              });
              
              if (productDiscount > 0) {
                discount = productDiscount;
                discountType = 'product';
              } else if (categoryDiscount > 0) {
                discount = categoryDiscount;
                discountType = 'category';
              }
            }
            
            const finalPrice = item.price * (1 - discount/100) * item.quantity;
            
            return {
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              category: product?.category || '',
              discount,
              discountType,
              finalPrice: parseFloat(finalPrice.toFixed(2))
            };
          }));
        }, 3, (attempt, maxRetries) => {
          setError(`Connection error while loading invoice. Retrying... (Attempt ${attempt}/${maxRetries})`);
        });
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(getFirestoreErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    
    if (invoiceId) {
      fetchInvoiceData();
    } else {
      // Generate sequential invoice number for new invoices
      const generateInvoiceNumber = async () => {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        try {
          // Use the executeWithRetry utility to handle connectivity issues
          return await executeWithRetry(async () => {
            // Get the latest invoice for the current month
            const invoicesQuery = query(
              collection(db, 'invoices'),
              where('invoiceNumber', '>=', `INV-${year}${month}-000`),
              where('invoiceNumber', '<=', `INV-${year}${month}-999`),
              orderBy('invoiceNumber', 'desc'),
              limit(1)
            );
            
            const snapshot = await getDocs(invoicesQuery);
            let sequence = 1;
            
            if (!snapshot.empty) {
              const latestInvoice = snapshot.docs[0].data();
              const latestNumber = latestInvoice.invoiceNumber;
              
              // Extract the sequence number and increment it
              const currentSequence = parseInt(latestNumber.split('-')[2]);
              sequence = currentSequence + 1;
              
              // If sequence exceeds 999, show error
              if (sequence > 999) {
                setError('Maximum invoice number reached for this month');
                return null;
              }
            }
            
            // Format the sequence number with leading zeros
            const sequenceStr = sequence.toString().padStart(3, '0');
            return `INV-${year}${month}-${sequenceStr}`;
          });
        } catch (err) {
          console.error('Error generating invoice number:', err);
          // Fallback to a timestamp-based number if there's an error
          const timestamp = Date.now();
          return `INV-${timestamp}`;
        }
      };
      
      const initializeInvoiceNumber = async () => {
        const number = await generateInvoiceNumber();
        if (number) setInvoiceNumber(number);
      };
      initializeInvoiceNumber();
    }
  }, [invoiceId, parties.length, products.length]);
  
  // Get selected party
  const selectedParty = parties.find(party => party.id === selectedPartyId) || null;
  
  // Calculate discounts for a single line item
  const calculateItemDiscounts = (item: InvoiceLineItem, party: Party | null) => {
    if (!party) return item;
    
    // If the item already has a custom discount, preserve it
    if (item.discountType === 'custom') {
      console.log('Preserving custom discount for item:', item.name, item.discount);
      const finalPrice = item.price * (1 - item.discount/100) * item.quantity;
      return {
        ...item,
        finalPrice: parseFloat(finalPrice.toFixed(2))
      };
    }
    
    const product = products.find(p => p.id === item.productId);
    if (!product) return item;
    
    // Use category name to look up discount
    const categoryDiscount = party.categoryDiscounts[product.category] || 0;
    
    // Log for debugging
    console.log(`Looking up discount for category "${product.category}": ${categoryDiscount}%`);
    const productDiscount = party.productDiscounts?.[item.productId] || 0;
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    
    if (productDiscount > 0) {
      discount = productDiscount;
      discountType = 'product';
    } else if (categoryDiscount > 0) {
      discount = categoryDiscount;
      discountType = 'category';
    }
    
    const finalPrice = item.price * (1 - discount/100) * item.quantity;
    const result = { 
      ...item, 
      discount, 
      discountType,
      finalPrice: parseFloat(finalPrice.toFixed(2))
    };
    
    // Log for debugging
    console.log('Calculated discount for item:', {
      product: item.name,
      category: item.category,
      originalDiscount: item.discount,
      originalType: item.discountType,
      newDiscount: discount,
      newType: discountType,
      finalPrice: result.finalPrice
    });
    
    return result;
  };

  // Update discounts when party changes
  useEffect(() => {
    if (!selectedParty) return;
    
    const updatedItems = lineItems.map(item => calculateItemDiscounts(item, selectedParty));
    setLineItems(updatedItems);
  }, [selectedPartyId, products, selectedParty]); // Don't include lineItems to avoid infinite loop
  
  const handleOpenPartyDialog = () => {
    setNewParty({
      name: '',
      email: '',
      phone: '',
      address: '',
      categoryDiscounts: {},
      productDiscounts: {}
    });
    setOpenPartyDialog(true);
  };
  
  const handleOpenProductDialog = () => {
    // Reset all product form fields
    setNewProductName('');
    setNewProductPrice(0);
    setNewProductCategory('');
    setCustomCategory('');
    setUseCustomCategory(false);
    setError(null); // Clear any previous errors
    setOpenProductDialog(true);
    
    // Log for debugging
    console.log('Opening product dialog, reset fields:', {
      newProductName: '',
      newProductPrice: 0,
      newProductCategory: '',
      customCategory: '',
      useCustomCategory: false
    });
  };

  const handlePartyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewParty(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handler for updating new party's category discounts
  const handleUpdateNewPartyCategoryDiscounts = (updatedDiscounts: Record<string, number>) => {
    setNewParty(prev => ({
      ...prev,
      categoryDiscounts: updatedDiscounts
    }));
    
    // Show success message
    setSuccessMessage('Category discounts updated for new party');
  };

  const handleCreateParty = async () => {
    if (!newParty.name) {
      setError('Party name is required');
      return;
    }
    
    try {
      setCreatingParty(true);
      
      // Use the executeWithRetry utility to handle connectivity issues
      const partyRef = await executeWithRetry(
        async () => {
          return await addDoc(collection(db, 'parties'), {
            ...newParty,
            createdAt: serverTimestamp()
          });
        },
        3, // Max retries
        (attempt, maxRetries, error) => {
          // This callback is called on each retry attempt
          setError(`Connection error. Retrying... (Attempt ${attempt}/${maxRetries})`);
        }
      );
      
      const newPartyWithId = {
        ...newParty,
        id: partyRef.id
      };
      
      parties.push(newPartyWithId);
      setSelectedPartyId(partyRef.id);
      setOpenPartyDialog(false);
      setError(null);
      
      // Show success message with discount info if any discounts were set
      const discountCount = Object.keys(newParty.categoryDiscounts).length;
      if (discountCount > 0) {
        setSuccessMessage(`Party created successfully with ${discountCount} category discount${discountCount > 1 ? 's' : ''}`);
      } else {
        setSuccessMessage('Party created successfully');
      }
    } catch (err) {
      console.error('Error creating party:', err);
      setError(getFirestoreErrorMessage(err));
    } finally {
      setCreatingParty(false);
    }
  };
  
  const handleCreateProduct = async () => {
    if (!newProductName.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (newProductPrice <= 0) {
      setError('Product price must be greater than 0');
      return;
    }
    
    // Validate custom category if it's being used
    if (useCustomCategory && !customCategory.trim()) {
      setError('Custom category cannot be empty');
      return;
    }
    
    try {
      setCreatingProduct(true);
      setError(null);
      
      // Determine which category to use
      const finalCategory = useCustomCategory ? customCategory.trim() : newProductCategory;
      
      // Log for debugging
      console.log('Creating product with category:', {
        useCustomCategory,
        customCategory: customCategory.trim(),
        selectedCategory: newProductCategory,
        finalCategory
      });
      
      // Create the new product in Firestore
      const productData = {
        name: newProductName.trim(),
        price: newProductPrice,
        category: finalCategory,
        createdAt: serverTimestamp()
      };
      
      // Use the executeWithRetry utility to handle connectivity issues
      const productRef = await executeWithRetry(
        async () => {
          return await addDoc(collection(db, 'products'), productData);
        },
        3, // Max retries
        (attempt, maxRetries, error) => {
          // This callback is called on each retry attempt
          setError(`Connection error. Retrying... (Attempt ${attempt}/${maxRetries})`);
        }
      );
      
      // Create a new product object with the ID
      const newProduct = {
        id: productRef.id,
        name: newProductName.trim(),
        price: newProductPrice,
        category: finalCategory
      };
      
      // Add to local products array
      products.push(newProduct);
      
      // Calculate discount for the new product
      let discount = 0;
      let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
      
      if (selectedParty && finalCategory) {
        const categoryDiscount = selectedParty.categoryDiscounts[finalCategory] || 0;
        if (categoryDiscount > 0) {
          discount = categoryDiscount;
          discountType = 'category';
        }
      }
      
      // Calculate the final price with discount
      const finalPrice = parseFloat((newProductPrice * (1 - discount/100) * 1).toFixed(2));
      
      // Add the new product as a line item
      const newItem: InvoiceLineItem = {
        productId: productRef.id,
        name: newProductName.trim(),
        quantity: 1,
        price: newProductPrice,
        category: finalCategory,
        discount: discount,
        discountType: discountType,
        finalPrice: finalPrice
      };
      
      setLineItems([...lineItems, newItem]);
      
      // Close the dialog
      setOpenProductDialog(false);
      setSuccessMessage('Product created and added to invoice');
      
    } catch (err) {
      console.error('Error creating product:', err);
      setError(getFirestoreErrorMessage(err));
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    
    if (selectedParty) {
      // Use category name to look up discount
      const categoryDiscount = selectedParty.categoryDiscounts[product.category] || 0;
      const productDiscount = selectedParty.productDiscounts?.[product.id] || 0;
      
      // Log for debugging
      console.log(`Adding product "${product.name}" with category "${product.category}"`);
      console.log(`Category discount: ${categoryDiscount}%, Product discount: ${productDiscount}%`);
      
      if (productDiscount > 0) {
        discount = productDiscount;
        discountType = 'product';
      } else if (categoryDiscount > 0) {
        discount = categoryDiscount;
        discountType = 'category';
      }
    }
    
    // Calculate the final price with discount and quantity
    const finalPrice = parseFloat((product.price * (1 - discount/100) * 1).toFixed(2));
    
    let newItem: InvoiceLineItem = {
      productId: product.id,
      name: product.name,
      quantity: 1, // Default to 1 instead of 0
      price: product.price,
      category: product.category || '',
      discount: discount, // Apply the calculated discount
      discountType: discountType, // Apply the calculated discount type
      finalPrice: finalPrice
    };
    
    // Log for debugging
    console.log('Adding product with discount:', {
      product: product.name,
      category: product.category,
      discount,
      discountType,
      finalPrice
    });
    
    setLineItems([...lineItems, newItem]);
    setSelectedProductId(''); // Reset the selected product ID to clear the selection field
    
    // Focus on the quantity input of the newly added item and select its content
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select(); // Select the content so it can be easily replaced
      }
    }, 100); // Slightly longer timeout to ensure the DOM has updated
  };
  
  const handleUpdateQuantity = (index: number, quantity: number) => {
    // Ensure quantity is at least 1
    const validQuantity = Math.max(1, quantity);
    
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, quantity: validQuantity };
      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    
    setLineItems(updatedItems);
  };
  
  const handleUpdatePrice = (index: number, price: number) => {
    // Ensure price is at least 0
    const validPrice = Math.max(0, price);
    
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, price: validPrice };
      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    
    setLineItems(updatedItems);
  };
  
  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
    // Also remove from editable prices if it exists
    if (editablePriceItems[index]) {
      const updatedEditableItems = { ...editablePriceItems };
      delete updatedEditableItems[index];
      setEditablePriceItems(updatedEditableItems);
    }
  };
  
  // Toggle price edit mode for a specific line item
  const togglePriceEditMode = (index: number) => {
    setEditablePriceItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Handle updating category discounts
  const handleUpdateCategoryDiscounts = async (updatedDiscounts: Record<string, number>) => {
    // Log the updated discounts
    console.log('Updating category discounts:', updatedDiscounts);
    
    // Update the party's category discounts (both in state and in the database)
    if (selectedParty) {
      try {
        setLoading(true);
        
        const updatedParty = {
          ...selectedParty,
          categoryDiscounts: {
            ...selectedParty.categoryDiscounts,
            ...updatedDiscounts
          }
        };
        
        // Log the updated party
        console.log('Updated party category discounts:', updatedParty.categoryDiscounts);
        
        // Update the party in the database
        const partyRef = doc(db, 'parties', selectedParty.id);
        await updateDoc(partyRef, {
          categoryDiscounts: updatedParty.categoryDiscounts,
          updatedAt: new Date().toISOString()
        });
        
        // Find the party in the parties array and update it
        const partyIndex = parties.findIndex(p => p.id === selectedParty.id);
        if (partyIndex !== -1) {
          parties[partyIndex] = updatedParty;
        }
        
        // Recalculate discounts for all line items, preserving custom discounts
        const updatedItems = lineItems.map(item => {
          // Skip items with custom discounts
          if (item.discountType === 'custom') {
            return item;
          }
          
          // For items with the category that was updated, apply the new discount
          const product = products.find(p => p.id === item.productId);
          if (product && updatedDiscounts.hasOwnProperty(product.category)) {
            const newDiscount = updatedDiscounts[product.category];
            const finalPrice = item.price * (1 - newDiscount/100) * item.quantity;
            
            return {
              ...item,
              discount: newDiscount,
              discountType: 'category',
              finalPrice: parseFloat(finalPrice.toFixed(2))
            };
          }
          
          // For other items, recalculate using the standard logic
          return calculateItemDiscounts(item, updatedParty);
        });
        
        setLineItems(updatedItems);
        
        // Show success message
        setSuccessMessage('Category discounts updated and saved to party successfully');
        setLoading(false);
      } catch (error) {
        console.error('Error updating party category discounts:', error);
        setError('Failed to update category discounts. Please try again.');
        setLoading(false);
      }
    }
  };
  
  // Handle updating a single line item's discount
  const handleUpdateLineItemDiscount = (index: number, discount: number, discountType: 'none' | 'category' | 'product' | 'custom') => {
    const updatedItems = [...lineItems];
    const item = { ...updatedItems[index] };
    
    console.log('Updating line item discount:', {
      product: item.name,
      oldDiscount: item.discount,
      oldType: item.discountType,
      newDiscount: discount,
      newType: discountType
    });
    
    item.discount = discount;
    item.discountType = discountType; // Keep the custom discount type
    item.finalPrice = item.price * (1 - discount/100) * item.quantity;
    item.finalPrice = parseFloat(item.finalPrice.toFixed(2));
    
    updatedItems[index] = item;
    setLineItems(updatedItems);
  };
  
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal - lineItems.reduce((sum, item) => sum + item.finalPrice, 0);
  // Add transport charges to the total
  const total = subtotal - discountAmount + transportCharges;
  
  const handleSaveInvoice = async () => {
    if (!selectedPartyId || lineItems.length === 0) {
      setError('Please select a party and add at least one product');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null); // Clear previous success message

    const invoiceData = {
      invoiceNumber,
      date: invoiceDate,
      partyId: selectedPartyId,
      partyName: selectedParty?.name || '',
      userId: userId || 'default-user',
      items: lineItems.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount,
        discountType: item.discountType,
        finalPrice: item.finalPrice,
        category: item.category
      })),
      subtotal,
      discount: discountAmount,
      total,
      transportCharges, // Add transport charges
      notes, // Add notes
      categoryDiscounts: selectedParty?.categoryDiscounts || {},
      // Add createdAt only for new invoices, updatedAt for both
      ...(invoiceId ? { updatedAt: serverTimestamp() } : { createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    };

    try {
      let savedInvoiceId = invoiceId;

      // Use the executeWithRetry utility for the main invoice operation
      savedInvoiceId = await executeWithRetry(
        async () => {
          let currentInvoiceId;
          if (invoiceId) {
            // Update existing invoice
            const invoiceRef = doc(db, 'invoices', invoiceId);
            // TODO: Consider fetching previous items if stock adjustment needs difference
            await updateDoc(invoiceRef, invoiceData);
            currentInvoiceId = invoiceId;
          } else {
            // Create new invoice
            const invoiceRef = collection(db, 'invoices');
            const docRef = await addDoc(invoiceRef, invoiceData);
            currentInvoiceId = docRef.id;
          }
          return currentInvoiceId;
        },
        3, // Max retries
        (attempt, maxRetries, error) => {
          setError(`Connection error saving invoice. Retrying... (Attempt ${attempt}/${maxRetries})`);
        }
      );

      // --- Transaction Logic (Run after successful invoice save/update) ---
      try {
        // Only create a transaction for new invoices
        if (!invoiceId && savedInvoiceId) {
          const transactionId = await transactionService.createTransaction({
            partyId: selectedPartyId,
            userId: userId || 'default-user',
            amount: total,
            type: 'debit',
            description: `Invoice ${invoiceNumber}`,
            reference: invoiceNumber,
            date: invoiceDate
          });
          console.log(`Created transaction ${transactionId} for invoice ${invoiceNumber}`);

          // Update the invoice with the transaction ID
          const invoiceRef = doc(db, 'invoices', savedInvoiceId);
          await updateDoc(invoiceRef, { transactionId: transactionId });
          console.log(`Updated invoice ${savedInvoiceId} with transaction ID ${transactionId}`);
        }
      } catch (transactionError) {
        console.error('Error creating/linking transaction for invoice:', transactionError);
        // Log or show a non-blocking warning, as the invoice itself is saved
        setError("Invoice saved, but failed to record the transaction. Please check accounting.");
      }
      // --- End Transaction Logic ---

      // --- Stock Update Logic (Run after successful invoice save/update) ---
      try {
        const batch = writeBatch(db);
        // TODO: For updates, fetch old invoice items to calculate stock difference if needed.
        // Current logic assumes all items in `lineItems` reduce stock.
        for (const item of lineItems) {
          if (item.productId && item.quantity > 0) {
            const productRef = doc(db, 'products', item.productId);
            // Decrement the stock quantity
            batch.update(productRef, {
              stock: increment(-item.quantity) // Use negative increment to decrease
            });
            console.log(`Decreasing stock for ${item.name} by ${item.quantity}`);
          }
        }
        await batch.commit();
        console.log('Product stock updated successfully.');
        // Optionally refetch products if needed immediately in the UI
        // refetchProducts();
      } catch (stockError) {
        console.error("Error updating product stock:", stockError);
        // The invoice is already saved/updated. Show a specific error for stock.
        setError("Invoice saved, but failed to update product stock. Please check manually.");
        // Keep the success message from the invoice save, but maybe append a warning?
        setSuccessMessage((invoiceId ? 'Invoice updated' : 'Invoice created') + ' - Stock update failed.');
        // Do not proceed to onSuccess or navigation if stock failed, let user see the error
        setLoading(false); // Ensure loading is stopped
        return; // Stop further execution like onSuccess or navigation
      }
      // --- End Stock Update Logic ---

      // If we reach here, both invoice and stock updates (if applicable) were successful
      setSuccessMessage(invoiceId ? 'Invoice updated successfully' : 'Invoice created successfully and transaction recorded');

      // Reset form or navigate away after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(); // Call the onSuccess callback if provided
        } else {
          router.push('/invoices'); // Default navigation
        }
      }, 1500);

    } catch (err) {
      // Catch errors from the main invoice save/update (executeWithRetry)
      console.error('Error saving invoice:', err);
      // setError is likely already set by executeWithRetry's retry callback, 
      // but set it again ensure a final error message is shown.
      setError(getFirestoreErrorMessage(err) || 'Failed to save invoice.');
    } finally {
      // Ensure loading is always set to false, even if stock update fails early
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Check if we can proceed to the next tab
  const canProceedToProducts = !!selectedPartyId && !!invoiceNumber && !!invoiceDate;
  const canProceedToSummary = lineItems.length > 0;

  // Navigation between tabs
  const handleNext = () => {
    setActiveTab(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveTab(prev => prev - 1);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="invoice creation tabs"
            variant="fullWidth"
          >
            <Tab 
              label="Invoice Details" 
              icon={<ReceiptIcon />} 
              iconPosition="start" 
              {...a11yProps(0)} 
            />
            <Tab 
              label="Products" 
              icon={<ShoppingCartIcon />} 
              iconPosition="start" 
              {...a11yProps(1)} 
              disabled={!canProceedToProducts}
            />
            <Tab 
              label="Summary" 
              icon={<SummarizeIcon />} 
              iconPosition="start" 
              {...a11yProps(2)} 
              disabled={!canProceedToSummary}
            />
          </Tabs>
        </Box>
        
        {/* Invoice Details Tab */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: { xs: 2, sm: 3 },
            mb: 3,
            '& > *': { flex: 1 }
          }}>
            <TextField
              fullWidth
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              size="small"
              required
              error={!invoiceNumber}
              helperText={!invoiceNumber ? "Invoice number is required" : ""}
            />
            
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              required
              error={!invoiceDate}
              helperText={!invoiceDate ? "Date is required" : ""}
            />
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Party Information
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            {/* Party Selection Row */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              alignItems: 'flex-start',
              mb: 2
            }}>
              <Autocomplete
                fullWidth
                options={parties}
                getOptionLabel={(option) => option.name}
                value={selectedParty}
                onChange={(_, newValue) => {
                  setSelectedPartyId(newValue?.id || '');
                }}
                disabled={loadingParties}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Party"
                    size="small"
                    error={!selectedPartyId}
                    helperText={!selectedPartyId ? "Please select a party" : ""}
                    required
                  />
                )}
                filterOptions={(options, state) => {
                  const inputValue = state.inputValue.toLowerCase().trim();
                  return options.filter(option => 
                    option.name.toLowerCase().includes(inputValue) ||
                    (option.phone && option.phone.includes(inputValue)) ||
                    (option.email && option.email.toLowerCase().includes(inputValue))
                  );
                }}
                loading={loadingParties}
                loadingText="Loading parties..."
                noOptionsText="No parties found"
              />
              
              <Button 
                variant="outlined" 
                onClick={handleOpenPartyDialog}
                size="small"
                sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                startIcon={<PersonIcon />}
              >
                New Party
              </Button>
            </Box>
            
            {/* Category Discounts Button Row */}
            {selectedPartyId && (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                bgcolor: 'background.paper', 
                p: 1, 
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider'
              }}>
                <Tooltip title="Set discount percentages for product categories for this party">
                  <Badge 
                    badgeContent={selectedParty ? Object.keys(selectedParty.categoryDiscounts).length : 0} 
                    color="primary"
                    showZero
                    sx={{ '& .MuiBadge-badge': { right: -3, top: 3 } }}
                  >
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setOpenCategoryDiscountEditor(true)}
                      startIcon={<PercentIcon />}
                      color="primary"
                    >
                      Edit Category Discounts
                    </Button>
                  </Badge>
                </Tooltip>
              </Box>
            )}
          </Box>
          
          {selectedParty && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedParty.name}
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedParty.email && (
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedParty.email}
                  </Typography>
                )}
                
                {selectedParty.phone && (
                  <Typography variant="body2">
                    <strong>Phone:</strong> {selectedParty.phone}
                  </Typography>
                )}
                
                {selectedParty.address && (
                  <Typography variant="body2">
                    <strong>Address:</strong> {selectedParty.address}
                  </Typography>
                )}
                
                {Object.keys(selectedParty.categoryDiscounts).length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Category Discounts:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                      {Object.entries(selectedParty.categoryDiscounts).map(([category, discount]) => (
                        discount > 0 && (
                          <Chip 
                            key={category} 
                            label={`${category}: ${discount}%`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        )
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              disabled={!canProceedToProducts}
            >
              Next: Add Products
            </Button>
          </Box>
        </TabPanel>
        
        {/* Products Tab */}
        <TabPanel value={activeTab} index={1}>
         
          
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxHeight: { xs: 400, sm: 'none' }, mb: 2 }}>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Product</TableCell>
                  <TableCell align="right" sx={{ minWidth: 80 }}>Price</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Quantity</TableCell>
                  <TableCell align="right" sx={{ minWidth: 120 }}>Discount</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No products added
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {editablePriceItems[index] ? (
                            <>
                              <TextField
                                type="number"
                                size="small"
                                value={item.price}
                                onChange={(e) => handleUpdatePrice(index, parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()} // Select all text when focused
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ width: { xs: '80px', sm: '90px' } }}
                                InputProps={{
                                  startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>
                                }}
                                autoFocus
                              />
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => togglePriceEditMode(index)}
                                sx={{ ml: 0.5 }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" sx={{ mr: 1 }}>₹{item.price}</Typography>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => togglePriceEditMode(index)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(index, parseInt(e.target.value) || 1)}
                          onFocus={(e) => e.target.select()} // Select all text when focused
                          inputProps={{ min: 1 }}
                          sx={{ width: { xs: '60px', sm: '70px' } }}
                          inputRef={index === lineItems.length - 1 ? quantityInputRef : null}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const product = products.find(p => p.id === item.productId);
                          const categoryName = product?.category || '';
                          const categoryDiscount = selectedParty?.categoryDiscounts[categoryName] || 0;
                          const productDiscount = selectedParty?.productDiscounts?.[item.productId] || 0;
                          
                          // Log for debugging
                          console.log(`Line item ${index} - ${item.name}:`, {
                            category: categoryName,
                            categoryDiscount,
                            productDiscount,
                            currentDiscount: item.discount,
                            currentType: item.discountType
                          });
                          
                          return (
                            <LineItemDiscountEditor
                              discount={item.discount}
                              discountType={item.discountType}
                              categoryDiscount={categoryDiscount}
                              productDiscount={productDiscount}
                              onSave={(discount, discountType) => 
                                handleUpdateLineItemDiscount(index, discount, discountType)
                              }
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right">₹{item.finalPrice}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            gap: 2, 
            mb: 3,
            alignItems: 'flex-start'
          }}>
            {productsError ? (
              <Box sx={{ width: '100%' }}>
                <Alert 
                  severity="error" 
                  action={
                    <Button 
                      color="inherit" 
                      size="small" 
                      onClick={() => {
                        refetchProducts();
                      }}
                    >
                      Retry
                    </Button>
                  }
                  sx={{ mb: 2 }}
                >
                  {productsError}
                </Alert>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleOpenProductDialog}
                  fullWidth
                >
                  Create New Product Manually
                </Button>
              </Box>
            ) : (
              <Autocomplete
                fullWidth
                options={products}
                getOptionLabel={(product) => `${product.name} - ₹${product.price}`}
                renderOption={(props, option) => ( // Modify renderOption
                  <Box component="li" {...props} key={option.id}>
                    <ListItemText
                      primary={option.name}
                      secondary={
                        <>
                          {/* <Typography component="span" variant="body2" color="text.primary">Price: ₹{option.price.toFixed(2)}</Typography> */}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>Stock: {option.stock !== undefined ? option.stock : 'N/A'}</Typography> {/* Display stock */}
                          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>Category: {option.category || 'N/A'}</Typography>
                        </>
                      }
                    />
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Products"
                    disabled={loadingProducts}
                    placeholder="Type to search..."
                    size="small"
                    onKeyDown={handleProductKeyPress}
                  />
                )}
                onBlur={handleProductFocusOut}
                onChange={(_, product) => setSelectedProductId(product ? product.id : '')}
                value={products.find(p => p.id === selectedProductId) || null}
                loading={loadingProducts}
                loadingText="Loading products..."
                noOptionsText={
                  <Box sx={{ textAlign: 'center', py: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No products found
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // If there's text in the search field, use it as the product name
                        const searchText = document.querySelector('input[placeholder="Type to search..."]') as HTMLInputElement;
                        if (searchText && searchText.value.trim()) {
                          setNewProductName(searchText.value.trim());
                        }
                        handleOpenProductDialog();
                      }}
                      startIcon={<AddIcon />}
                    >
                      Create New Product
                    </Button>
                  </Box>
                }
              />
            )}
            
            {!productsError && (
              <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  disabled={!selectedProductId}
                  size="small"
                  sx={{ minWidth: 'auto' }}
                >
                  Add
                </Button>
                
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenProductDialog}
                  size="small"
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap' }}
                >
                  New Product
                </Button>
              </Box>
            )}
          </Box>

          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Back to Details
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
              disabled={!canProceedToSummary}
            >
              Next: Review
            </Button>
          </Box>
        </TabPanel>
        
        {/* Summary Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="medium">Invoice Number:</Typography>
                  <Typography variant="body1">{invoiceNumber}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="medium">Date:</Typography>
                  <Typography variant="body1">{invoiceDate}</Typography>
                </Box>
                
                <Divider />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" fontWeight="medium">Party:</Typography>
                  <Typography variant="body1">{selectedParty?.name}</Typography>
                </Box>
                
                {selectedParty?.email && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="medium">Email:</Typography>
                    <Typography variant="body1">{selectedParty.email}</Typography>
                  </Box>
                )}
                
                {selectedParty?.phone && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight="medium">Phone:</Typography>
                    <Typography variant="body1">{selectedParty.phone}</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
            
            <Typography variant="h6" gutterBottom>
              Products
            </Typography>
            
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">₹{item.price}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        {item.discount}%
                        {item.discountType === 'category' && ' (Category)'}
                        {item.discountType === 'product' && ' (Product)'}
                        {item.discountType === 'custom' && ' (Custom)'}
                      </TableCell>
                      <TableCell align="right">₹{item.finalPrice}</TableCell>
                    </TableRow>
                  ))}
                  
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="subtitle2">Subtotal:</Typography>
                    </TableCell>
                    <TableCell align="right">₹{subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="subtitle2">Discount:</Typography>
                    </TableCell>
                    <TableCell align="right">₹{discountAmount.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  {/* Transport Charges Row */}
                  <TableRow>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="subtitle2">Transport Charges:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      {/* Make transport charges editable here */}
                      <TextField
                        type="number"
                        size="small"
                        value={transportCharges}
                        onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: '100px', textAlign: 'right' }} // Adjust width as needed
                        variant="standard" // Use standard variant to blend in
                        // Remove underline for cleaner look
                        InputLabelProps={{ shrink: true }}
                        onFocus={(e) => e.target.select()}
                      />
                    </TableCell>
                  </TableRow>

                  {/* Grand Total Row */}
                  <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell colSpan={4} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">Grand Total:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        ₹{total.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Notes Section */}
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="Add any additional notes here..."
              sx={{ mb: 3 }} // Add margin below notes
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              startIcon={<ArrowBackIcon />}
            >
              Back to Products
            </Button>
            
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveInvoice}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {invoiceId ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
      
      {/* Party Creation Dialog */}
      <Dialog open={openPartyDialog} onClose={() => setOpenPartyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Party</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Party Name"
              name="name"
              value={newParty.name}
              onChange={handlePartyInputChange}
              fullWidth
              required
              error={!newParty.name && creatingParty}
              helperText={!newParty.name && creatingParty ? "Party name is required" : ""}
            />
            
            <TextField
              label="Email"
              name="email"
              type="email"
              value={newParty.email}
              onChange={handlePartyInputChange}
              fullWidth
            />
            
            <TextField
              label="Phone"
              name="phone"
              value={newParty.phone}
              onChange={handlePartyInputChange}
              fullWidth
            />
            
            <TextField
              label="Address"
              name="address"
              value={newParty.address}
              onChange={handlePartyInputChange}
              fullWidth
              multiline
              rows={3}
            />
            
            {/* Category Discounts Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PercentIcon fontSize="small" sx={{ mr: 1 }} />
                Category Discounts
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {Object.keys(newParty.categoryDiscounts).length > 0 
                    ? `${Object.keys(newParty.categoryDiscounts).length} category discount${Object.keys(newParty.categoryDiscounts).length > 1 ? 's' : ''} configured` 
                    : 'No category discounts configured'}
                </Typography>
                
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => setOpenNewPartyCategoryDiscountEditor(true)}
                  startIcon={<PercentIcon />}
                >
                  Configure Discounts
                </Button>
              </Box>
              
              {Object.keys(newParty.categoryDiscounts).length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(newParty.categoryDiscounts).map(([category, discount]) => (
                    <Chip 
                      key={category}
                      label={`${category}: ${discount}%`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPartyDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateParty} 
            variant="contained" 
            disabled={creatingParty || !newParty.name}
            startIcon={creatingParty ? <CircularProgress size={20} /> : null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* New Product Dialog */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Product</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              fullWidth
              required
              error={!newProductName.trim() && creatingProduct}
              helperText={!newProductName.trim() && creatingProduct ? "Product name is required" : ""}
            />
            
            <TextField
              label="Price"
              type="number"
              value={newProductPrice}
              onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
              fullWidth
              required
              InputProps={{
                startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>
              }}
              inputProps={{ min: 0, step: 0.01 }}
              error={newProductPrice <= 0 && creatingProduct}
              helperText={newProductPrice <= 0 && creatingProduct ? "Price must be greater than 0" : ""}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth disabled={useCustomCategory}>
                <InputLabel id="new-product-category-label">Category</InputLabel>
                <Select
                  labelId="new-product-category-label"
                  value={newProductCategory}
                  onChange={(e: SelectChangeEvent) => setNewProductCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {uniqueCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                p: 1, 
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1
              }}>
                <Checkbox
                  checked={useCustomCategory}
                  onChange={(e) => {
                    setUseCustomCategory(e.target.checked);
                    console.log('Custom category checkbox changed:', e.target.checked);
                  }}
                  id="use-custom-category"
                  color="primary"
                />
                <Typography component="label" htmlFor="use-custom-category" sx={{ fontWeight: useCustomCategory ? 'bold' : 'normal' }}>
                  Enter a custom category instead
                </Typography>
              </Box>
              
              {useCustomCategory && (
                <TextField
                  label="Custom Category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  fullWidth
                  required
                  error={!customCategory.trim() && creatingProduct}
                  helperText={!customCategory.trim() && creatingProduct ? "Custom category is required" : ""}
                  placeholder="e.g., Electronics, Clothing, etc."
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateProduct} 
            variant="contained" 
            disabled={
              creatingProduct || 
              !newProductName.trim() || 
              newProductPrice <= 0 || 
              (useCustomCategory && !customCategory.trim())
            }
            startIcon={creatingProduct ? <CircularProgress size={20} /> : null}
          >
            Create & Add to Invoice
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Category Discount Editor Dialog for Selected Party */}
      {selectedParty && (
        <CategoryDiscountEditor
          open={openCategoryDiscountEditor}
          onClose={() => setOpenCategoryDiscountEditor(false)}
          partyId={selectedParty.id}
          categoryDiscounts={selectedParty.categoryDiscounts}
          onSave={handleUpdateCategoryDiscounts}
        />
      )}
      
      {/* Category Discount Editor Dialog for New Party */}
      <CategoryDiscountEditor
        open={openNewPartyCategoryDiscountEditor}
        onClose={() => setOpenNewPartyCategoryDiscountEditor(false)}
        partyId="new-party" // Temporary ID for new party
        categoryDiscounts={newParty.categoryDiscounts}
        onSave={handleUpdateNewPartyCategoryDiscounts}
      />
      
      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
    </Box>
  );
}