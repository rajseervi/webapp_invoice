"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { validateProductName } from '@/utils/validation';
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
  Check as CheckIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy, doc, getDoc, updateDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { executeWithRetry, getFirestoreErrorMessage } from '@/utils/firestoreHelpers';
import { validateUpdateDocData } from '@/utils/firestoreUtils';
import { useParties } from "@/app/hooks/useParties";
import { useProducts } from '@/app/hooks/useProducts';
import { useCategories } from '@/app/hooks/useCategories';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import CategoryDiscountEditor from '@/components/invoices/CategoryDiscountEditor';
import LineItemDiscountEditor from '@/components/invoices/LineItemDiscountEditor';
import EnhancedPartySelector from '@/components/invoices/EnhancedPartySelector';
import { transactionService } from '@/services/transactionService';
import InvoiceWithStockService from '@/services/invoiceWithStockService';
import StockValidationEnforcementService from '@/services/stockValidationEnforcementService';
import CentralizedInvoiceService from '@/services/centralizedInvoiceService';
import StockValidationConfigService from '@/services/stockValidationConfig';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions 
} from '@mui/material'; 
import { useRouter } from 'next/navigation';
import FullScreenProductSearch from '@/components/invoices/FullScreenProductSearch';
import { getUserPreferences } from '@/services/settingsService';

interface Party {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  // categoryDiscounts can be legacy number or new object { discount, dp }
  categoryDiscounts: Record<string, number | { discount: number; dp?: number }>;
  productDiscounts?: Record<string, number>;
}

interface InvoiceLineItem {
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category: string;
  discount: number;
  discountType: 'none' | 'category' | 'product' | 'custom';
  finalPrice: number;
  gstRate?: number;
  margin?: number;
}

interface TabbedInvoiceFormProps {
  onSuccess?: (invoiceId?: string) => void;
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
  const { categories, loading: loadingCategories, error: categoriesError, refetch: refetchCategories } = useCategories();
  const { userId, userRole } = useCurrentUser();
  const partySearchRef = React.useRef<HTMLInputElement>(null);
  
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
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [transportCharges, setTransportCharges] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  
  // Description column visibility
  const [showDescriptionColumn, setShowDescriptionColumn] = useState<boolean>(false);
  // DP(+) feature enabled by user preference (defaults to enabled)
  const [dpPlusEnabled, setDpPlusEnabled] = useState<boolean>(true);
  
  // Global DP(+) field
  const [globalDp, setGlobalDp] = useState<number | string>('');
  // DP category dialog
  const [openDpCategoryDialog, setOpenDpCategoryDialog] = useState(false);
  const [dpCategorySelection, setDpCategorySelection] = useState<string>('All Categories');
  const dpCategories = ['All Categories', 'Product', 'Service', 'Discount', 'Shipping', 'Other'];
  
  // Product list visibility
  const [showProductList, setShowProductList] = useState<boolean>(true);
  
  // Full-screen product search dialog
  const [openFullScreenSearch, setOpenFullScreenSearch] = useState<boolean>(false);
  
  // Ref for the QuickProductSearch input to programmatically focus it
  const quickSearchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Party dialog
  const [openPartyDialog, setOpenPartyDialog] = useState(false);
  const [openPartyDropdown, setOpenPartyDropdown] = useState(false);
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
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(0);
  const [newProductPurchasePrice, setNewProductPurchasePrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [newProductCategory, setNewProductCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [isQuickCreateMode, setIsQuickCreateMode] = useState(false);
  const [productCreationErrors, setProductCreationErrors] = useState<Record<string, string>>({});
  
  // New category dialog
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  
  // Get all available categories from the categories collection
  const availableCategories = useMemo(() => {
    // Combine categories from the dedicated categories collection and existing product categories
    const categoryNames = new Set<string>();
    
    // Add categories from the categories collection
    categories.forEach(category => {
      if (category.name) {
        categoryNames.add(category.name);
      }
    });
    
    // Also add categories from existing products (for backward compatibility)
    products.forEach(product => {
      if (product.category) {
        categoryNames.add(product.category);
      }
    });
    
    return Array.from(categoryNames).sort();
  }, [categories, products]);
  
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

  useEffect(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product && product.purchasePrice) {
        setPurchasePrice(product.purchasePrice);
      }
    }
  }, [selectedProductId, products]);

  useEffect(() => {
    if (activeTab === 0 && partySearchRef.current) {
      setTimeout(() => {
        partySearchRef.current?.focus();
      }, 100);
    }
    // QuickProductSearch handles its own auto-focus
  }, [activeTab]);

  useEffect(() => {
    if (!loadingParties && parties.length > 0) {
      setTimeout(() => {
        partySearchRef.current?.focus();
        setOpenPartyDropdown(true);
      }, 100);
    }
  }, [loadingParties, parties]);

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
              
              // Use category name to look up discount and dp
              const categoryName = product?.category || '';
              const { discount: catDiscount, dp: catDp } = party ? getCategoryDiscountDetails(party, categoryName) : { discount: 0, dp: 0 };

              if (productDiscount > 0) {
                discount = productDiscount;
                discountType = 'product';
              } else if (catDiscount > 0) {
                discount = catDiscount;
                discountType = 'category';
              }
            }
             
            const finalPrice = item.price * (1 - discount/100) * item.quantity;
             
            return {
              productId: item.productId,
              name: item.name,
              description: item.description || '',
              quantity: item.quantity,
              price: item.price,
              category: product?.category || '',
              discount,
              discountType,
              finalPrice: parseFloat(finalPrice.toFixed(2)),
              margin: typeof item.margin === 'number' ? item.margin : (party ? getCategoryDiscountDetails(party, categoryName).dp : 0),
              gstRate: item.gstRate || 0
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
  
  // Helper to read category discount and dp from party (supports legacy number format)
  const getCategoryDiscountDetails = (party: Party | null, categoryName: string) => {
    if (!party || !party.categoryDiscounts) return { discount: 0, dp: 0 };
    const raw: any = (party as any).categoryDiscounts[categoryName];
    if (raw == null) return { discount: 0, dp: 0 };
    if (typeof raw === 'number') return { discount: raw, dp: 0 };
    return { discount: raw.discount || 0, dp: raw.dp || 0 };
  };

  // Calculate discounts for a single line item
  const calculateItemDiscounts = (item: InvoiceLineItem, party: Party | null) => {
    if (!party) return item;
    
    // If the item already has a custom discount, preserve it
    if (item.discountType === 'custom') {
      const gstRate = item.gstRate || 0;
      const finalPrice = item.price * (1 - item.discount/100) * item.quantity * (1 + gstRate / 100);
      return {
        ...item,
        finalPrice: parseFloat(finalPrice.toFixed(2))
      };
    }
    
    const product = products.find(p => p.id === item.productId);
    if (!product) return item;
    
    // Use category name to look up discount and dp
    const { discount: categoryDiscount, dp: categoryDp } = getCategoryDiscountDetails(party, product.category);
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
    
    // If item has no explicit margin, inherit category DP — only when DP(+) is enabled
    const margin = dpPlusEnabled
      ? ((typeof item.margin === 'number' && !isNaN(item.margin)) ? item.margin : (categoryDp || 0))
      : 0;

    const gstRate = item.gstRate || 0;
    const finalPrice = item.price * (1 - discount/100) * item.quantity * (1 + gstRate / 100) + (item.price * item.quantity * margin / 100);
    const result = { 
      ...item, 
      discount, 
      discountType,
      margin,
      finalPrice: parseFloat(finalPrice.toFixed(2))
    };
    
    return result;
  };

  // Update discounts when party changes
  useEffect(() => {
    if (!selectedParty) return;
    
    const updatedItems = lineItems.map(item => calculateItemDiscounts(item, selectedParty));
    setLineItems(updatedItems);
  }, [selectedPartyId, products, selectedParty]); // Don't include lineItems to avoid infinite loop

  // Load the DP(+) preference so the feature can be hidden/disabled
  useEffect(() => {
    if (!userId) return;
    getUserPreferences(userId)
      .then(prefs => {
        if (prefs && typeof prefs.enableDpPlus === 'boolean') {
          setDpPlusEnabled(prefs.enableDpPlus);
        }
      })
      .catch(err => console.error('Error loading DP(+) preference:', err));
  }, [userId]);
  
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
  
  const handleOpenProductDialog = (searchedName?: string, isQuickCreate?: boolean) => {
    setProductCreationErrors({});
    setNewProductName(searchedName || '');
    setNewProductDescription('');
    setNewProductPrice(0);
    setNewProductPurchasePrice(0);
    setNewProductStock(0);
    setNewProductCategory('');
    setCustomCategory('');
    setUseCustomCategory(false);
    setIsQuickCreateMode(isQuickCreate || false);
    setError(null);
    setOpenProductDialog(true);
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
  
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    try {
      setCreatingCategory(true);
      setError(null);
      
      // Check if category already exists
      const categoriesQuery = query(
        collection(db, 'categories'),
        where('name', '==', newCategoryName.trim())
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      
      if (!categoriesSnapshot.empty) {
        setError('Category with this name already exists');
        return;
      }
      
      // Create new category
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || '',
        isActive: true,
        defaultDiscount: 0,
        sortOrder: 0,
        color: '#1976d2',
        icon: 'category',
        tags: [],
        metadata: {
          totalProducts: 0,
          totalValue: 0,
          averagePrice: 0,
          lastUpdated: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'categories'), categoryData);
      
      // Refresh categories
      await refetchCategories();
      
      // Set the newly created category as selected
      setNewProductCategory(newCategoryName.trim());
      setUseCustomCategory(false);
      
      // Close the category dialog
      setOpenCategoryDialog(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      
      setSuccessMessage('Category created successfully');
      
    } catch (err) {
      console.error('Error creating category:', err);
      setError(getFirestoreErrorMessage(err));
    } finally {
      setCreatingCategory(false);
    }
  };
  
  const handleCreateProduct = async () => {
    const errors: Record<string, string> = {};
    
    if (!newProductName.trim()) {
      errors.name = 'Product name is required';
    }
    
    if (newProductPrice <= 0) {
      errors.price = 'Price must be greater than ₹0';
    } else if (!Number.isFinite(newProductPrice)) {
      errors.price = 'Please enter a valid price';
    }
    
    if (newProductPurchasePrice < 0) {
      errors.purchasePrice = 'Purchase price cannot be negative';
    } else if (!Number.isFinite(newProductPurchasePrice)) {
      errors.purchasePrice = 'Please enter a valid purchase price';
    }

    if (newProductStock < 0) {
      errors.stock = 'Stock quantity cannot be negative';
    } else if (!Number.isFinite(newProductStock)) {
      errors.stock = 'Please enter a valid stock quantity';
    }
    
    if (useCustomCategory && !customCategory.trim()) {
      errors.category = 'Custom category cannot be empty';
    }
    
    if (lineItems.length >= 25) {
      errors.general = 'Maximum 25 items allowed per invoice. Remove some items first.';
    }
    
    if (Object.keys(errors).length > 0) {
      setProductCreationErrors(errors);
      setError(errors.general || Object.values(errors)[0]);
      return;
    }
    
    setProductCreationErrors({});
    
    try {
      setCreatingProduct(true);
      setError(null);
      
      const finalCategoryName = useCustomCategory ? customCategory.trim() : newProductCategory;
      let categoryId = '';
      
      if (finalCategoryName) {
        const categoriesQuery = query(
          collection(db, 'categories'),
          where('name', '==', finalCategoryName)
        );
        const categoriesSnapshot = await getDocs(categoriesQuery);
        
        if (!categoriesSnapshot.empty) {
          categoryId = categoriesSnapshot.docs[0].id;
        } else {
          const categoryData = {
            name: finalCategoryName,
            description: `Auto-created category for ${finalCategoryName} products`,
            isActive: true,
            sortOrder: 0,
            color: '#1976d2',
            icon: 'category',
            tags: [],
            metadata: {
              totalProducts: 0,
              totalValue: 0,
              averagePrice: 0,
              lastUpdated: new Date().toISOString()
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          
          const categoryRef = await addDoc(collection(db, 'categories'), categoryData);
          categoryId = categoryRef.id;
        }
      }
      
      const productData = {
        name: newProductName.trim(),
        price: newProductPrice,
        purchasePrice: newProductPurchasePrice,
        categoryId: categoryId,
        categoryName: finalCategoryName,
        category: finalCategoryName,
        quantity: newProductStock,
        stock: newProductStock,
        description: newProductDescription.trim(),
        isActive: true,
        gstRate: 18,
        unitOfMeasurement: 'PCS',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const productRef = await executeWithRetry(
        async () => {
          return await addDoc(collection(db, 'products'), productData);
        },
        3,
        (attempt, maxRetries) => {
          setError(`Connection error. Retrying... (Attempt ${attempt}/${maxRetries})`);
        }
      );
      
      const newProduct = {
        id: productRef.id,
        name: newProductName.trim(),
        price: newProductPrice,
        purchasePrice: newProductPurchasePrice,
        category: finalCategoryName,
        categoryId: categoryId,
        categoryName: finalCategoryName,
        stock: newProductStock,
        description: newProductDescription.trim()
      };
      
      products.push(newProduct);
      
      let discount = 0;
      let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
      
      if (selectedParty && finalCategoryName) {
        const { discount: categoryDiscount, dp: categoryDp } = getCategoryDiscountDetails(selectedParty, finalCategoryName);
        if (categoryDiscount > 0) {
          discount = categoryDiscount;
          discountType = 'category';
        }
      }
      
      const gstRate = selectedParty?.gstRate || 0;
      const finalPrice = parseFloat((newProductPrice * (1 - discount/100) * 1 * (1 + gstRate / 100)).toFixed(2));
      
      const newItem: InvoiceLineItem = {
        productId: productRef.id,
        name: newProductName.trim(),
        description: newProductDescription.trim(),
        quantity: 1,
        price: newProductPrice,
        category: finalCategoryName,
        discount: discount,
        discountType: discountType,
        finalPrice: finalPrice
      };
      
      setLineItems([...lineItems, newItem]);
      
      setSelectedProductId('');
      
      try {
        await refetchProducts();
        if (categoryId) {
          await refetchCategories();
        }
      } catch (refetchErr) {
        console.warn('Error refetching products:', refetchErr);
      }
      
      setOpenProductDialog(false);
      const stockInfo = newProductStock > 0 ? ` (Stock: ${newProductStock})` : '';
      setSuccessMessage(`✓ Product "${newProductName.trim()}" created and added to invoice${stockInfo}`);
      
    } catch (err) {
      console.error('Error creating product:', err);
      const errorMsg = getFirestoreErrorMessage(err);
      setError(errorMsg || 'Failed to create product. Please try again.');
      setProductCreationErrors({ general: errorMsg || 'Failed to create product' });
    } finally {
      setCreatingProduct(false);
    }
  };  const handleAddProduct = () => {
    if (!selectedProductId) return;
    
    // Check if we've reached the maximum limit of 25 items
    if (lineItems.length >= 25) {
      setWarningMessage('Maximum 25 items allowed per invoice. Please remove some items to add new ones.');
      return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    let margin: number | undefined;
    
    if (selectedParty) {
      // Use category name to look up discount and dp
      const { discount: categoryDiscount, dp: categoryDp } = getCategoryDiscountDetails(selectedParty, product.category || '');
      const productDiscount = selectedParty.productDiscounts?.[product.id] || 0;
      
      if (productDiscount > 0) {
        discount = productDiscount;
        discountType = 'product';
      } else if (categoryDiscount > 0) {
        discount = categoryDiscount;
        discountType = 'category';
      }

      // Inherit the category DP so it applies in the cart (only when DP(+) is enabled)
      margin = dpPlusEnabled ? (categoryDp || 0) : 0;
    }
    
    // Calculate the final price with discount, DP and quantity
    const gstRate = selectedParty?.gstRate || 0;
    const finalPrice = parseFloat((product.price * (1 - discount/100) * 1 * (1 + gstRate / 100) + (product.price * 1 * (margin || 0) / 100)).toFixed(2));
    
    let newItem: InvoiceLineItem = {
      productId: product.id,
      name: product.name,
      description: '', // Default empty description for existing products
      quantity: 1, // Default to 1 instead of 0
      price: product.price,
      purchasePrice: product.purchasePrice,
      category: product.category || '',
      discount: discount, // Apply the calculated discount
      discountType: discountType, // Apply the calculated discount type
      finalPrice: finalPrice,
      margin
    };
    
        
    setLineItems([...lineItems, newItem]);
    setSelectedProductId(''); // Reset the selected product ID to clear the selection field
    // Keep product search list visible after adding so users can quickly add more
    
    // Quantity auto-focus is handled in QuickProductSearch
  };
  
  // Add a product to the cart from the full-screen search (appends to bottom)
  const handleAddProductToCart = (product: { id: string; name: string; price: number; category?: string; stock?: number; quantity?: number }, quantity: number) => {
    if (lineItems.length >= 25) {
      setWarningMessage('Maximum 25 items allowed per invoice. Please remove some items to add new ones.');
      return;
    }
    
    let discount = 0;
    let discountType: 'none' | 'category' | 'product' | 'custom' = 'none';
    let margin: number | undefined;
    
    if (selectedParty) {
      const { discount: categoryDiscount, dp: categoryDp } = getCategoryDiscountDetails(selectedParty, product.category || '');
      const productDiscount = selectedParty.productDiscounts?.[product.id] || 0;
      
      if (productDiscount > 0) {
        discount = productDiscount;
        discountType = 'product';
      } else if (categoryDiscount > 0) {
        discount = categoryDiscount;
        discountType = 'category';
      }
      margin = dpPlusEnabled ? (categoryDp || 0) : 0;
    }
    
    const gstRate = selectedParty?.gstRate || 0;
    const finalPrice = parseFloat((product.price * (1 - discount/100) * quantity * (1 + gstRate / 100) + (product.price * quantity * (margin || 0) / 100)).toFixed(2));
    
    const newItem: InvoiceLineItem = {
      productId: product.id,
      name: product.name,
      description: '',
      quantity,
      price: product.price,
      purchasePrice: products.find(p => p.id === product.id)?.purchasePrice || 0,
      category: product.category || '',
      discount,
      discountType,
      finalPrice,
      margin
    };
    
    setLineItems(prev => [...prev, newItem]);
  };

  // Increment an in-cart item's quantity (from full-screen search)
  const handleIncrementInCart = (productId: string) => {
    setLineItems(prev => prev.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity: item.quantity + 1,
            finalPrice: parseFloat(
              (item.price * (1 - item.discount / 100) * (item.quantity + 1)).toFixed(2)
            )
          }
        : item
    ));
  };

  // Remove an item from cart (from full-screen search)
  const handleRemoveFromCart = (productId: string) => {
    setLineItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleUpdateQuantity = (index: number, quantity: number | string) => {
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, quantity: quantity };
      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    
    setLineItems(updatedItems);
  };
  
  const handleUpdatePrice = (index: number, price: number | string) => {
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;
      
      const updatedItem = { ...item, price: price, margin: undefined };
      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    
    setLineItems(updatedItems);
  };

  const handleUpdateMargin = (index: number, margin: number | string) => {
    if (!dpPlusEnabled) return; // DP(+) disabled — ignore margin edits
    const updatedItems = lineItems.map((item, i) => {
      if (i !== index) return item;

      const numericMargin = typeof margin === 'string' ? parseFloat(margin) : margin;
      
      const updatedItem = { ...item, margin: isNaN(numericMargin) ? undefined : numericMargin };

      return calculateItemDiscounts(updatedItem, selectedParty);
    });
    setLineItems(updatedItems);
  };
  
  // Apply global DP(+) — open category selector first
  const handleApplyGlobalDp = () => {
    if (globalDp === '' || globalDp === null) {
      setWarningMessage('Please enter a DP(+) value');
      return;
    }

    const numericDp = typeof globalDp === 'string' ? parseFloat(globalDp) : globalDp;
    
    if (isNaN(numericDp)) {
      setWarningMessage('Please enter a valid DP(+) value');
      return;
    }

    if (lineItems.length === 0) {
      setWarningMessage('No products added to apply DP(+)');
      return;
    }

    // Open dialog to ask which category to apply the DP to
    setOpenDpCategoryDialog(true);
  };

  // Apply DP(+) to the selected category (or all categories)
  const applyDpToSelectedCategory = () => {
    const numericDp = typeof globalDp === 'string' ? parseFloat(globalDp) : globalDp;
    if (isNaN(numericDp)) {
      setWarningMessage('Please enter a valid DP(+) value');
      setOpenDpCategoryDialog(false);
      return;
    }

    const updatedItems = lineItems.map(item => {
      if (dpCategorySelection === 'All Categories' || item.category === dpCategorySelection) {
        const updatedItem = { ...item, margin: numericDp };
        return calculateItemDiscounts(updatedItem, selectedParty);
      }
      return item;
    });

    setLineItems(updatedItems);
    setSuccessMessage(
      dpCategorySelection === 'All Categories'
        ? `DP(+) value of ${numericDp} applied to all ${updatedItems.length} products`
        : `DP(+) value of ${numericDp} applied to category "${dpCategorySelection}"`
    );
    setGlobalDp('');
    setOpenDpCategoryDialog(false);
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
  const handleUpdateCategoryDiscounts = async (updatedDiscounts: Record<string, number | { discount: number; dp?: number }>) => {
        
    // Update the party's category discounts (both in state and in the database)
    if (selectedParty) {
      try {
        setLoading(true);
        
        const updatedParty = {
          ...selectedParty,
          categoryDiscounts: updatedDiscounts // Replace entirely instead of merging
        };
        
                
        // Update the party in the database
        const partyUpdateData = {
          categoryDiscounts: updatedDiscounts, // Use the complete updated discounts object
          updatedAt: new Date().toISOString()
        };

        // Validate the party update data
        const validation = validateUpdateDocData(partyUpdateData, 'party');
        
        if (!validation.isValid) {
          console.error('Party data validation failed:', validation.errors);
          throw new Error(`Invalid party data: ${validation.errors.join(', ')}`);
        }

        const partyRef = doc(db, 'parties', selectedParty.id);
        await updateDoc(partyRef, validation.cleanedData);
        
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
          
          // For items with a category that was updated, apply the new discount + DP
          const product = products.find(p => p.id === item.productId);
          if (product && updatedDiscounts.hasOwnProperty(product.category)) {
            // Value can be a legacy number or the new { discount, dp } object
            const raw = updatedDiscounts[product.category];
            const categoryDiscount = typeof raw === 'number' ? raw : (raw?.discount || 0);
            const categoryDp = typeof raw === 'number' ? 0 : (raw?.dp || 0);
            
            // Product-specific discount takes precedence over category discount
            const productDiscount = updatedParty.productDiscounts?.[item.productId] || 0;
            const discount = productDiscount > 0 ? productDiscount : categoryDiscount;
            const discountType: 'none' | 'category' | 'product' | 'custom' =
              productDiscount > 0 ? 'product' : (categoryDiscount > 0 ? 'category' : 'none');
            
            const gstRate = item.gstRate || 0;
            // Apply the category DP to the item so it reflects in the cart (only when DP(+) is enabled)
            const margin = dpPlusEnabled ? (categoryDp || 0) : 0;
            const finalPrice = item.price * (1 - discount/100) * item.quantity * (1 + gstRate / 100) + (item.price * item.quantity * margin / 100);
            
            return {
              ...item,
              discount,
              discountType,
              margin,
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
    
        
    item.discount = discount;
    item.discountType = discountType; // Keep the custom discount type
    const gstRate = item.gstRate || 0;
    item.finalPrice = item.price * (1 - discount/100) * item.quantity * (1 + gstRate / 100);
    item.finalPrice = parseFloat(item.finalPrice.toFixed(2));
    
    updatedItems[index] = item;
    setLineItems(updatedItems);
  };
  
  const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = subtotal - lineItems.reduce((sum, item) => sum + item.finalPrice, 0);
  
  // Total DP on unit price (only applies when DP(+) is enabled)
  const totalMargin = lineItems.reduce((sum, item) => {
    const margin = dpPlusEnabled && typeof item.margin === 'number' ? item.margin : 0;
    return sum + (item.price * item.quantity * margin / 100);
  }, 0);
  
  // Calculate exact total before rounding (includes DP)
  const exactTotal = subtotal - discountAmount + transportCharges + totalMargin;
  // Round to nearest rupee for Grand Total
  const total = Math.round(exactTotal);
  // Calculate round-off amount
  const roundOffAmount = total - exactTotal;
  
  const handleSaveInvoice = async () => {
    if (!selectedPartyId || lineItems.length === 0) {
      setError('Please select a party and add at least one product');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const invoiceData = {
      invoiceNumber,
      date: invoiceDate,
      partyId: selectedParty?.id || '',
      partyName: selectedParty?.name || '',
      partyAddress: selectedParty?.address || '',
      partyEmail: selectedParty?.email || '',
      partyPhone: selectedParty?.phone || '',
      partyGstin: selectedParty?.gstin || '',
      partyStateCode: selectedParty?.gstin ? 
        selectedParty.gstin.substring(0, 2) : '',
      userId: userId || 'default-user',
      type: 'sales', // Explicitly set as sales invoice
      items: lineItems.map(item => {
        const itemData: any = {
          productId: item.productId,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          price: item.price,
          discount: item.discount,
          discountType: item.discountType,
          finalPrice: item.finalPrice,
          category: item.category
        };
        
        // Only include margin if DP(+) is enabled and it's a valid number
        if (dpPlusEnabled && typeof item.margin === 'number' && !isNaN(item.margin)) {
          itemData.margin = item.margin;
        }
        
        return itemData;
      }),
      subtotal,
      discount: discountAmount,
      dp: totalMargin, // DP amount total
      total, // This is now the rounded value (includes DP)
      transportCharges,
      roundOffAmount,
      notes,
      categoryDiscounts: selectedParty?.categoryDiscounts || {},
      isGstInvoice: false,
      stockUpdated: false
    };

    try {
      if (invoiceId) {
        // Update existing invoice with stock management
        const updateResult = await InvoiceWithStockService.updateInvoiceWithStock(
          invoiceId,
          invoiceData,
          true // adjustStock
        );

        if (!updateResult.success) {
          setError(updateResult.errors?.join(', ') || 'Failed to update invoice');
          if (updateResult.warnings && updateResult.warnings.length > 0) {
            setSuccessMessage(updateResult.warnings.join(', '));
          }
          return;
        }

        setSuccessMessage('Invoice updated successfully with stock adjustments');
        
        // Show warnings if any
        if (updateResult.warnings && updateResult.warnings.length > 0) {
          setTimeout(() => {
            setSuccessMessage(prev => prev + '. Warnings: ' + updateResult.warnings!.join(', '));
          }, 1000);
        }

      } else {
        // Create new invoice using centralized service with mandatory stock validation
        // Get stock validation configuration
        const stockConfig = StockValidationConfigService.getConfigForInvoiceType('sales');
        
        const createResult = await CentralizedInvoiceService.createInvoice(
          invoiceData,
          stockConfig
        );

        if (!createResult.success) {
          // Handle stock validation errors with user-friendly messages
          if (createResult.blockingErrors && createResult.blockingErrors.length > 0) {
            const stockErrors = createResult.blockingErrors.filter(error => 
              error.includes('ZERO STOCK') || error.includes('INSUFFICIENT STOCK')
            );
            
            if (stockErrors.length > 0) {
              setError('🚫 Cannot create invoice due to stock issues:\n\n' + stockErrors.join('\n\n'));
            } else {
              setError(createResult.blockingErrors.join('\n'));
            }
          } else {
            setError(createResult.errors?.join(', ') || 'Failed to create invoice');
          }
          
          if (createResult.warnings && createResult.warnings.length > 0) {
            setSuccessMessage(createResult.warnings.join(', '));
          }
          return;
        }

        setSuccessMessage('Invoice created successfully with stock management');
        
        // Show warnings if any
        if (createResult.warnings && createResult.warnings.length > 0) {
          setTimeout(() => {
            setSuccessMessage(prev => prev + '. Warnings: ' + createResult.warnings!.join(', '));
          }, 1000);
        }

        // Navigate away after success - use the newly created invoice ID
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(createResult.invoiceId);
          } else {
            router.push('/invoices');
          }
        }, 1500);
        return; // Early return to avoid the general navigation code below
      }

      // Navigate away after success (for update case)
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(invoiceId);
        } else {
          router.push('/invoices');
        }
      }, 1500);

    } catch (err) {
      console.error('Error saving invoice:', err);
      setError(getFirestoreErrorMessage(err) || 'Failed to save invoice');
    } finally {
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
                getOptionLabel={(option) => {
                  let label = option.name;
                  if (option.phone) label += ` • ${option.phone}`;
                  return label;
                }}
                value={selectedParty}
                open={openPartyDropdown}
                onOpen={() => setOpenPartyDropdown(true)}
                onClose={() => setOpenPartyDropdown(false)}
          onChange={(_, newValue) => {
            setSelectedPartyId(newValue?.id || '');
            // Automatically open the full-screen product search when party is selected
            if (newValue?.id) {
              setTimeout(() => {
                setActiveTab(1);
              }, 300);
              setTimeout(() => {
                setOpenFullScreenSearch(true);
              }, 450);
            }
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
                    inputRef={partySearchRef}
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
                      {Object.entries(selectedParty.categoryDiscounts).map(([category, raw]) => {
                        // raw can be a number (legacy) or { discount, dp }
                        const discount = typeof raw === 'number' ? raw : (raw?.discount || 0);
                        const dp = typeof raw === 'number' ? 0 : (raw?.dp || 0);
                        return (
                          (discount > 0 || (dpPlusEnabled && dp > 0)) && (
                            <Chip
                              key={category}
                              label={`${category}: ${discount}%${dpPlusEnabled && dp > 0 ? ` • DP+ ${dp}%` : ''}`}
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          )
                        );
                      })}
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
          {/* Selected Party Display */}
          {selectedParty && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: 'primary.50', 
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.200'
            }}>
              <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                📋 Invoice for: {selectedParty.name}
              </Typography>
              {selectedParty.address && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedParty.address}
                </Typography>
              )}
              {(selectedParty.phone || selectedParty.email) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedParty.phone && selectedParty.phone}
                  {selectedParty.phone && selectedParty.email && ' • '}
                  {selectedParty.email && selectedParty.email}
                </Typography>
              )}
            </Box>
          )}

    {/* Category Discounts Section */}
          {selectedPartyId && (
            <Box sx={{ mt: 3, mb: 2 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                bgcolor: 'background.paper', 
                p: 2, 
                borderRadius: 1,
                border: '1px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PercentIcon color="primary" fontSize="small" />
                  Category Discounts Configuration
                </Typography>
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
              
              {selectedParty && Object.keys(selectedParty.categoryDiscounts).length > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Active Category Discounts:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Object.entries(selectedParty.categoryDiscounts).map(([category, raw]) => {
                      const discount = typeof raw === 'number' ? raw : (raw?.discount || 0);
                      const dp = typeof raw === 'number' ? 0 : (raw?.dp || 0);
                      return (
                        (discount > 0 || (dpPlusEnabled && dp > 0)) && (
                          <Chip
                            key={category}
                            label={`${category}: ${discount}%${dpPlusEnabled && dp > 0 ? ` • DP+ ${dp}%` : ''}`}
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        )
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          
          {/* Apply DP(+) to All Products section hidden per request */}
          {/* Items Header with Count and Description Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" component="h3">
                Invoice Items
              </Typography>
              <Chip 
                label={`${lineItems.length}/25 items`}
                color={lineItems.length >= 25 ? 'error' : lineItems.length >= 22 ? 'warning' : 'primary'}
                size="small"
                variant="outlined"
              />
              {lineItems.length >= 22 && (
                <Typography variant="caption" color="warning.main">
                  {lineItems.length >= 25 ? 'Maximum limit reached' : `${25 - lineItems.length} items remaining`}
                </Typography>
              )}
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon />}
              onClick={() => setShowDescriptionColumn(!showDescriptionColumn)}
              sx={{ textTransform: 'none' }}
            >
              {showDescriptionColumn ? 'Hide' : 'Show'} Description
            </Button>

          </Box>

          {/* Maximum Items Alert */}
          {lineItems.length >= 18 && (
            <Alert 
              severity={lineItems.length >= 25 ? "error" : "warning"} 
              sx={{ mb: 2 }}
              icon={lineItems.length >= 25 ? <CheckCircleIcon /> : undefined}
            >
              <Typography variant="body2">
                {lineItems.length >= 25 ? (
                  <>
                    <strong>Maximum items reached!</strong> You have added the maximum allowed 25 items to this invoice. 
                    To add more items, please remove some existing items first or create a new invoice.
                  </>
                ) : (
                  <>
                    <strong>Approaching limit!</strong> You have {lineItems.length} items. 
                    You can add {25 - lineItems.length} more item{25 - lineItems.length !== 1 ? 's' : ''} to this invoice.
                  </>
                )}
              </Typography>
            </Alert>
          )}
          
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', maxHeight: { xs: 400, sm: 'none' }, mb: 2 }}>
            <Table sx={{ minWidth: 650 }} size="small" aria-label="invoice-items-table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 150 }}>Product</TableCell>
                  {showDescriptionColumn && (
                    <TableCell sx={{ minWidth: 200 }}>Description</TableCell>
                  )}
                  <TableCell align="right" sx={{ minWidth: 80 }}>Price</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Quantity</TableCell>
                  {dpPlusEnabled && (
                    <TableCell align="right" sx={{ minWidth: 100 }}>DP(+)</TableCell>
                  )}
                  <TableCell align="right" sx={{ minWidth: 120 }}>Discount</TableCell>
                  <TableCell align="right" sx={{ minWidth: 100 }}>Total</TableCell>
                  <TableCell align="center" sx={{ minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lineItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6 + (showDescriptionColumn ? 1 : 0) + (dpPlusEnabled ? 1 : 0)} align="center">
                      No products added
                    </TableCell>
                  </TableRow>
                ) : (
                  lineItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      {showDescriptionColumn && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TextField
                              size="small"
                              value={item.description || ''}
                              onChange={(e) => {
                                const updatedItems = [...lineItems];
                                updatedItems[index] = { ...updatedItems[index], description: e.target.value };
                                setLineItems(updatedItems);
                              }}
                              placeholder="Add description..."
                              variant="outlined"
                              sx={{ flexGrow: 1, minWidth: '150px' }}
                              multiline
                              maxRows={2}
                            />
                            <Tooltip title="Add description">
                              <IconButton size="small" color="primary">
                                <DescriptionIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {editablePriceItems[index] ? (
                            <>
                              <TextField
                                type="number"
                                size="small"
                                value={item.price}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    handleUpdatePrice(index, '');
                                  } else {
                                    const numericValue = parseFloat(value);
                                    if (numericValue >= 0 && !isNaN(numericValue)) {
                                      handleUpdatePrice(index, numericValue);
                                    }
                                  }
                                }}
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
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              handleUpdateQuantity(index, '');
                            } else {
                              const numericValue = parseInt(value);
                              if (numericValue >= 0 && !isNaN(numericValue)) {
                                handleUpdateQuantity(index, numericValue);
                              }
                            }
                          }}
                          onFocus={(e) => e.target.select()} // Select all text when focused
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              // Focus the search input to quickly find next product
                              setTimeout(() => quickSearchInputRef.current?.focus(), 50);
                            }
                          }}
                          sx={{ width: { xs: '60px', sm: '70px' } }}
                        />
                      </TableCell>
                      {dpPlusEnabled && (
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.margin || '0'}
                            onChange={(e) => handleUpdateMargin(index, e.target.value)}
                            onFocus={(e) => e.target.select()} // Select all text when focused
                            sx={{ width: { xs: '60px', sm: '70px' } }}
                          />
                        </TableCell>
                      )}
                      <TableCell align="right">
                        {(() => {
                          const product = products.find(p => p.id === item.productId);
                          const categoryName = product?.category || '';
                          const { discount: categoryDiscount } = selectedParty ? getCategoryDiscountDetails(selectedParty, categoryName) : { discount: 0, dp: 0 };
                          const productDiscount = selectedParty?.productDiscounts?.[item.productId] || 0;
                           
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
                  onClick={() => handleOpenProductDialog()}
                  disabled={lineItems.length >= 25}
                  fullWidth
                  title={lineItems.length >= 25 ? 'Maximum 25 items allowed per invoice' : ''}
                >
                  Create New Product Manually {lineItems.length >= 25 ? '(Max 25 reached)' : ''}
                </Button>
              </Box>
            ) : showProductList ? (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 0.5 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      onClick={() => setOpenFullScreenSearch(true)}
                      startIcon={<ShoppingCartIcon />}
                      disabled={lineItems.length >= 25}
                      sx={{ py: 1.5, fontSize: '0.95rem', textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
                    >
                      🔍 Search Products to Add to Invoice ({lineItems.length}/25)
                    </Button>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenProductDialog()}
                    disabled={lineItems.length >= 25}
                    title={lineItems.length >= 25 ? 'Maximum 25 items allowed per invoice' : ''}
                    sx={{ textTransform: 'none', whiteSpace: 'nowrap', alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    New Product
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ width: '100%', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => setShowProductList(true)}
                  sx={{ textTransform: 'none' }}
                >
                  + Add More Products
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenProductDialog()}
                  disabled={lineItems.length >= 25}
                  title={lineItems.length >= 25 ? 'Maximum 25 items allowed per invoice' : ''}
                  sx={{ textTransform: 'none' }}
                >
                  Create New Product {lineItems.length >= 25 ? '(Max 25 reached)' : ''}
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
                    {showDescriptionColumn && (
                      <TableCell>Description</TableCell>
                    )}
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
                      {showDescriptionColumn && (
                        <TableCell>{item.description || '-'}</TableCell>
                      )}
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
                    <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                      <Typography variant="subtitle2">Subtotal:</Typography>
                    </TableCell>
                    <TableCell align="right">₹{subtotal.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                      <Typography variant="subtitle2">Discount:</Typography>
                    </TableCell>
                    <TableCell align="right">₹{discountAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* DP Row - only shown when DP(+) is enabled in settings */}
                  {dpPlusEnabled && (
                    <TableRow>
                      <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                        <Typography variant="subtitle2">DP:</Typography>
                      </TableCell>
                      <TableCell align="right">₹{totalMargin.toFixed(2)}</TableCell>
                    </TableRow>
                  )}
                  
                  {/* Transport Charges Row */}
                  <TableRow>
                    <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                      <Typography variant="subtitle2">Transport Charges:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        size="small"
                        value={transportCharges}
                        onChange={(e) => setTransportCharges(parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: '100px', textAlign: 'right' }}
                        variant="standard"
                        InputLabelProps={{ shrink: true }}
                        onFocus={(e) => e.target.select()}
                      />
                    </TableCell>
                  </TableRow>

                  {/* Round Off Row */}
                  <TableRow>
                    <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                      <Typography variant="subtitle2" color={roundOffAmount >= 0 ? 'success.main' : 'error.main'}>
                        Round Off:
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2" color={roundOffAmount >= 0 ? 'success.main' : 'error.main'}>
                        {roundOffAmount >= 0 ? '+' : ''}₹{roundOffAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* Grand Total Row */}
                  <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                    <TableCell colSpan={showDescriptionColumn ? 5 : 4} align="right">
                      <Typography variant="subtitle1" fontWeight="bold">Grand Total:</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle1" fontWeight="bold">
                        ₹{total.toFixed(0)}
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
                  {Object.entries(newParty.categoryDiscounts).map(([category, raw]) => {
                    const discount = typeof raw === 'number' ? raw : (raw?.discount || 0);
                    const dp = typeof raw === 'number' ? 0 : (raw?.dp || 0);
                    return (
                      (discount > 0 || (dpPlusEnabled && dp > 0)) && (
                        <Chip
                          key={category}
                          label={`${category}: ${discount}%${dpPlusEnabled && dp > 0 ? ` • DP+ ${dp}%` : ''}`}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      )
                    );
                  })}
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
        <DialogTitle>
          {isQuickCreateMode ? '⚡ Create Product Not Found' : 'Create New Product'}
        </DialogTitle>
        <DialogContent>
          {isQuickCreateMode && (
            <Alert severity="info" sx={{ mb: 2, mt: 2 }}>
              Product not found. Fill in the details below to create it and add to your invoice.
            </Alert>
          )}
          <Box sx={{ mt: isQuickCreateMode ? 1 : 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Product Name"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              fullWidth
              required
              error={!!productCreationErrors.name}
              helperText={productCreationErrors.name || validateProductName(newProductName || '') || 'Enter product name'}
              placeholder="e.g., Laptop, Shirt, Food Items"
              autoFocus
            />
            
            {!isQuickCreateMode && (
              <TextField
                label="Description (Optional)"
                value={newProductDescription}
                onChange={(e) => setNewProductDescription(e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Add details about this product..."
                helperText="Helps identify the product later"
              />
            )}
            
            <Box sx={{ display: 'flex', gap: 2 }}>
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
                error={!!productCreationErrors.price}
                helperText={productCreationErrors.price || 'Selling price'}
                placeholder="0.00"
              />
              <TextField
                label="Purchase Price (Optional)"
                type="number"
                value={newProductPurchasePrice}
                onChange={(e) => setNewProductPurchasePrice(parseFloat(e.target.value) || 0)}
                InputProps={{
                  startAdornment: <span style={{ fontSize: '0.8rem', marginRight: '2px' }}>₹</span>
                }}
                inputProps={{ min: 0, step: 0.01 }}
                error={!!productCreationErrors.purchasePrice}
                helperText={productCreationErrors.purchasePrice || 'Cost price'}
                placeholder="0.00"
              />
            </Box>

            <TextField
              label="Stock Quantity (Optional)"
              type="number"
              value={newProductStock}
              onChange={(e) => setNewProductStock(parseInt(e.target.value) || 0)}
              fullWidth
              inputProps={{ min: 0, step: 1 }}
              error={!!productCreationErrors.stock}
              helperText={productCreationErrors.stock || 'Initial stock (can be updated later)'}
              placeholder="0"
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
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
                    {availableCategories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenCategoryDialog(true)}
                  disabled={useCustomCategory || creatingProduct}
                  sx={{ minWidth: 'auto', whiteSpace: 'nowrap', mt: 1 }}
                  size="small"
                >
                  New Category
                </Button>
              </Box>
              
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
                  autoFocus
                  error={!customCategory.trim() && creatingProduct}
                  helperText={!customCategory.trim() && creatingProduct ? "Custom category is required" : "Category will be created if it doesn't exist"}
                  placeholder="e.g., Electronics, Clothing, etc."
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ gap: 1, p: 2 }}>
          <Button 
            onClick={() => {
              setOpenProductDialog(false);
              setProductCreationErrors({});
            }}
            disabled={creatingProduct}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateProduct} 
            variant="contained"
            color="primary"
            disabled={
              creatingProduct || 
              !newProductName.trim() || 
              newProductPrice <= 0 ||
              (useCustomCategory && !customCategory.trim())
            }
            startIcon={creatingProduct ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {creatingProduct ? 'Creating...' : 'Create & Add to Invoice'}
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
          showDp={dpPlusEnabled}
        />
      )}
      
      {/* Category Discount Editor Dialog for New Party */}
      <CategoryDiscountEditor
        open={openNewPartyCategoryDiscountEditor}
        onClose={() => setOpenNewPartyCategoryDiscountEditor(false)}
        partyId="new-party" // Temporary ID for new party
        categoryDiscounts={newParty.categoryDiscounts}
        onSave={handleUpdateNewPartyCategoryDiscounts}
        showDp={dpPlusEnabled}
      />
      
      {/* New Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Category Name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              fullWidth
              required
              error={!newCategoryName.trim() && creatingCategory}
              helperText={!newCategoryName.trim() && creatingCategory ? "Category name is required" : ""}
              placeholder="e.g., Electronics, Clothing, Food Items"
            />
            
            <TextField
              label="Description (Optional)"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="Brief description of this category"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateCategory} 
            variant="contained" 
            disabled={creatingCategory || !newCategoryName.trim()}
            startIcon={creatingCategory ? <CircularProgress size={20} /> : null}
          >
            Create Category
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* DP Category Selection Dialog */}
      <Dialog open={openDpCategoryDialog} onClose={() => setOpenDpCategoryDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Apply DP(+) to Category</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="dp-category-select-label">Category</InputLabel>
              <Select
                labelId="dp-category-select-label"
                value={dpCategorySelection}
                label="Category"
                onChange={(e: SelectChangeEvent) => setDpCategorySelection(e.target.value)}
              >
                {dpCategories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Select 'All Categories' to apply DP(+) to every product.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDpCategoryDialog(false)}>Cancel</Button>
          <Button onClick={applyDpToSelectedCategory} variant="contained" color="info">Apply</Button>
        </DialogActions>
      </Dialog>
      
      {/* Full-Screen Product Search Dialog */}
      <FullScreenProductSearch
        open={openFullScreenSearch}
        onClose={() => setOpenFullScreenSearch(false)}
        products={products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          stock: (p as any).stock ?? (p as any).quantity,
          // Allow searching by SKU / HSN / barcode
          code: (p as any).sku ?? (p as any).barcode ?? (p as any).hsnCode ?? (p as any).sacCode ?? '',
          // Description / specification text (sizes are often stored here)
          description: (p as any).description ?? '',
          specification: (p as any).specification ?? '',
        }))}
        loading={loadingProducts}
        cartItemIds={new Set(lineItems.map(item => item.productId))}
        cartCount={lineItems.length}
        cartQuantities={lineItems.reduce((acc, item) => { acc[item.productId] = item.quantity; return acc; }, {} as Record<string, number>)}
        maxItems={25}
        partyDiscounts={(selectedParty?.categoryDiscounts || {}) as Record<string, number>}
        onAddToCart={handleAddProductToCart}
        onIncrementInCart={handleIncrementInCart}
        onRemoveFromCart={handleRemoveFromCart}
        onCreateNew={(searchText) => { setOpenFullScreenSearch(false); handleOpenProductDialog(searchText, true); }}
      />
      
      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        message={successMessage}
      />
      
      {/* Warning Message Snackbar */}
      <Snackbar
        open={!!warningMessage}
        autoHideDuration={8000}
        onClose={() => setWarningMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setWarningMessage(null)} 
          severity="warning" 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {warningMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
