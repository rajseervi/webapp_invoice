"use client"
import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
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
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  FormControlLabel,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Stack,
  CircularProgress
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  Edit,
  CheckCircle,
  Error,
  Warning,
  ExpandMore,
  ExpandLess,
  FilePresent,
  Image,
  TextFields,
  Analytics,
  Save,
  Refresh,
  Settings,
  Download,
  Upload
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import pdfToText from 'react-pdftotext';
import Tesseract from 'tesseract.js';
import { Timestamp } from 'firebase/firestore';

// Enhanced interfaces
interface ExtractedProduct {
  id: string;
  name: string;
  quantity: number;
  rate: number;
  amount?: number;
  sku?: string;
  category?: string;
  description?: string;
  hsnCode?: string;
  gstRate?: number;
  unit?: string;
  confidence: number;
  source: 'pdf-text' | 'ocr-image' | 'manual';
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  errors?: string[];
  warnings?: string[];
}

interface ProcessedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedProducts: ExtractedProduct[];
  errors: string[];
  warnings: string[];
  processingTime?: number;
  ocrUsed: boolean;
  textExtractionMethod: 'pdf-text' | 'ocr' | 'hybrid';
}

interface BulkPdfImportProps {
  onProductsExtracted: (products: ExtractedProduct[]) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface OCRSettings {
  language: string;
  confidence: number;
  preprocessing: boolean;
  fallbackToOCR: boolean;
  hybridMode: boolean;
}

export default function BulkPdfImport({
  onProductsExtracted,
  onError,
  onSuccess,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
}: BulkPdfImportProps) {
  // State
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [allExtractedProducts, setAllExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [reviewMode, setReviewMode] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  // Settings
  const [ocrSettings, setOcrSettings] = useState<OCRSettings>({
    language: 'eng',
    confidence: 70,
    preprocessing: true,
    fallbackToOCR: true,
    hybridMode: true
  });

  // Dialogs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null);

  // Refs
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Steps
  const steps = [
    'Upload Files',
    'Process Files', 
    'Review Extracted Data',
    'Import Products'
  ];

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      const { file, errors } = rejection;
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          onError(`File ${file.name} is too large. Maximum size is ${maxFileSize / 1024 / 1024}MB.`);
        } else if (error.code === 'file-invalid-type') {
          onError(`File ${file.name} has invalid type. Only PDF and image files are allowed.`);
        }
      });
    });

    // Check file limit
    if (files.length + acceptedFiles.length > maxFiles) {
      onError(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    // Add accepted files
    const newFiles: ProcessedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      extractedProducts: [],
      errors: [],
      warnings: [],
      ocrUsed: false,
      textExtractionMethod: 'pdf-text'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles, maxFileSize, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxSize: maxFileSize,
    multiple: true
  });

  // Initialize Tesseract worker
  const initializeOCRWorker = async () => {
    if (!workerRef.current) {
      workerRef.current = await Tesseract.createWorker(ocrSettings.language);
    }
  };

  // Extract text from PDF using react-pdftotext
  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      return await pdfToText(file);
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      throw error;
    }
  };

  // Convert PDF to images for OCR
  const convertPDFToImages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = function(event) {
        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
        
        // This would require pdf.js for proper PDF to image conversion
        // For now, we'll return empty array and handle differently
        resolve([]);
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  // Perform OCR on image
  const performOCR = async (imageData: string | File): Promise<string> => {
    if (!workerRef.current) {
      await initializeOCRWorker();
    }

    if (!workerRef.current) {
      throw new Error('OCR worker not initialized');
    }

    const { data: { text, confidence } } = await workerRef.current.recognize(imageData);
    
    if (confidence < ocrSettings.confidence) {
      throw new Error(`OCR confidence ${confidence}% below threshold ${ocrSettings.confidence}%`);
    }

    return text;
  };

  // Extract products from text using advanced patterns
  const extractProductsFromText = (text: string, sourceMethod: 'pdf-text' | 'ocr-image'): ExtractedProduct[] => {
    const products: ExtractedProduct[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Enhanced patterns for different invoice formats
    const patterns = [
      // Pattern 1: Item | Qty | Rate | Amount
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/,
      
      // Pattern 2: Description | HSN | Qty | Rate | Amount
      /^(.+?)\s+(\d{4,8})\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/,
      
      // Pattern 3: Sr.No | Description | Qty | Unit | Rate | Amount
      /^\d+\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+([\d,]+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/,
      
      // Pattern 4: Product code | Description | Qty | Rate
      /^([A-Z0-9]+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s+([\d,]+(?:\.\d+)?)$/,
    ];

    // GST rate extraction pattern
    const gstPattern = /(\d+(?:\.\d+)?)\s*%?\s*(?:GST|IGST|CGST|SGST)/i;
    
    // HSN code pattern
    const hsnPattern = /HSN[:\s]*(\d{4,8})/i;

    let currentProduct: Partial<ExtractedProduct> | null = null;
    let confidence = sourceMethod === 'pdf-text' ? 90 : 70;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines
      if (/^(sr\.?\s*no\.?|item|description|quantity|qty|rate|amount|total|subtotal|tax|gst)/i.test(line)) {
        continue;
      }

      // Try each pattern
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const productData: Partial<ExtractedProduct> = {
            id: Math.random().toString(36).substr(2, 9),
            confidence,
            source: sourceMethod,
            status: 'pending',
            errors: [],
            warnings: []
          };

          // Extract based on pattern type
          if (pattern === patterns[0]) {
            // Pattern 1: Item | Qty | Rate | Amount
            productData.name = match[1].trim();
            productData.quantity = parseFloat(match[2]);
            productData.rate = parseFloat(match[3].replace(/,/g, ''));
            productData.amount = parseFloat(match[4].replace(/,/g, ''));
          } else if (pattern === patterns[1]) {
            // Pattern 2: Description | HSN | Qty | Rate | Amount
            productData.name = match[1].trim();
            productData.hsnCode = match[2];
            productData.quantity = parseFloat(match[3]);
            productData.rate = parseFloat(match[4].replace(/,/g, ''));
            productData.amount = parseFloat(match[5].replace(/,/g, ''));
          } else if (pattern === patterns[2]) {
            // Pattern 3: Sr.No | Description | Qty | Unit | Rate | Amount
            productData.name = match[1].trim();
            productData.quantity = parseFloat(match[2]);
            productData.unit = match[3];
            productData.rate = parseFloat(match[4].replace(/,/g, ''));
            productData.amount = parseFloat(match[5].replace(/,/g, ''));
          } else if (pattern === patterns[3]) {
            // Pattern 4: Product code | Description | Qty | Rate
            productData.sku = match[1];
            productData.name = match[2].trim();
            productData.quantity = parseFloat(match[3]);
            productData.rate = parseFloat(match[4].replace(/,/g, ''));
            productData.amount = productData.quantity * productData.rate;
          }

          // Validate extracted data
          const errors: string[] = [];
          const warnings: string[] = [];

          if (!productData.name || productData.name.length < 2) {
            errors.push('Product name is too short or missing');
          }
          if (!productData.quantity || productData.quantity <= 0) {
            errors.push('Invalid quantity');
          }
          if (!productData.rate || productData.rate <= 0) {
            errors.push('Invalid rate');
          }
          if (productData.amount && Math.abs(productData.amount - (productData.quantity * productData.rate)) > 0.01) {
            warnings.push('Amount calculation mismatch');
          }

          // Look for GST rate in nearby lines
          for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
            const gstMatch = lines[j].match(gstPattern);
            if (gstMatch) {
              productData.gstRate = parseFloat(gstMatch[1]);
              break;
            }
          }

          // Look for HSN code if not already extracted
          if (!productData.hsnCode) {
            for (let j = Math.max(0, i - 1); j <= Math.min(lines.length - 1, i + 1); j++) {
              const hsnMatch = lines[j].match(hsnPattern);
              if (hsnMatch) {
                productData.hsnCode = hsnMatch[1];
                break;
              }
            }
          }

          if (errors.length === 0) {
            products.push({
              ...productData,
              errors,
              warnings
            } as ExtractedProduct);
          }
          
          break;
        }
      }
    }

    return products;
  };

  // Process a single file
  const processFile = async (fileData: ProcessedFile): Promise<ProcessedFile> => {
    const startTime = Date.now();
    let updatedFile: ProcessedFile = { ...fileData, status: 'processing', progress: 10 };
    
    try {
      let extractedText = '';
      let extractionMethod: 'pdf-text' | 'ocr' | 'hybrid' = 'pdf-text';
      let ocrUsed = false;

      // Step 1: Try PDF text extraction for PDF files
      if (fileData.type === 'application/pdf') {
        try {
          updatedFile.progress = 30;
          extractedText = await extractTextFromPDF(fileData.file);
          
          // Check if text extraction was successful (not just whitespace/special chars)
          const meaningfulText = extractedText.replace(/\s+/g, ' ').trim();
          if (meaningfulText.length < 50) {
            throw new Error('Insufficient text extracted from PDF');
          }
        } catch (pdfError) {
          console.warn('PDF text extraction failed:', pdfError);
          
          if (ocrSettings.fallbackToOCR) {
            updatedFile.warnings.push('PDF text extraction failed, attempting OCR');
            extractionMethod = 'ocr';
            ocrUsed = true;
          } else {
            throw new Error('PDF text extraction failed and OCR fallback is disabled');
          }
        }
      } else {
        // For image files, use OCR directly
        extractionMethod = 'ocr';
        ocrUsed = true;
      }

      // Step 2: Use OCR if needed
      if (extractionMethod === 'ocr' || ocrSettings.hybridMode) {
        try {
          updatedFile.progress = 50;
          await initializeOCRWorker();
          
          const ocrText = await performOCR(fileData.file);
          
          if (extractionMethod === 'ocr') {
            extractedText = ocrText;
          } else if (ocrSettings.hybridMode) {
            // Combine PDF text and OCR text
            extractedText = extractedText + '\n' + ocrText;
            extractionMethod = 'hybrid';
          }
          
          ocrUsed = true;
        } catch (ocrError) {
          console.warn('OCR failed:', ocrError);
          if (extractionMethod === 'ocr') {
            throw new Error(`OCR failed: ${ocrError}`);
          } else {
            updatedFile.warnings.push('OCR enhancement failed, using PDF text only');
          }
        }
      }

      // Step 3: Extract products from text
      updatedFile.progress = 70;
      const products = extractProductsFromText(
        extractedText, 
        ocrUsed ? 'ocr-image' : 'pdf-text'
      );

      // Step 4: Post-processing and validation
      updatedFile.progress = 90;
      
      if (products.length === 0) {
        updatedFile.warnings.push('No products found in the document');
      }

      // Check for duplicate products within the same file
      const duplicates = products.filter((product, index, arr) => 
        arr.findIndex(p => p.name.toLowerCase() === product.name.toLowerCase()) !== index
      );
      
      if (duplicates.length > 0) {
        updatedFile.warnings.push(`Found ${duplicates.length} potential duplicate products`);
      }

      updatedFile = {
        ...updatedFile,
        status: 'completed',
        progress: 100,
        extractedProducts: products,
        processingTime: Date.now() - startTime,
        ocrUsed,
        textExtractionMethod: extractionMethod
      };

    } catch (error) {
      updatedFile = {
        ...updatedFile,
        status: 'error',
        progress: 0,
        errors: [...updatedFile.errors, error instanceof Error ? error.message : String(error)]
      };
    }

    return updatedFile;
  };

  // Process all files
  const processAllFiles = async () => {
    setProcessing(true);
    setCurrentStep(1);

    try {
      const processPromises = files.map(async (file, index) => {
        const processed = await processFile(file);
        
        // Update state as each file completes
        setFiles(prev => prev.map(f => f.id === file.id ? processed : f));
        
        return processed;
      });

      const processedFiles = await Promise.all(processPromises);
      
      // Collect all products
      const allProducts = processedFiles.flatMap(file => file.extractedProducts);
      setAllExtractedProducts(allProducts);
      
      // Select all products by default
      setSelectedProducts(new Set(allProducts.map(p => p.id)));
      
      setCurrentStep(2);
      setReviewMode(true);
      
      onSuccess(`Successfully processed ${processedFiles.length} files and extracted ${allProducts.length} products`);
      
    } catch (error) {
      onError(`Processing failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setAllExtractedProducts(prev => prev.filter(p => 
      files.find(f => f.id === fileId)?.extractedProducts.every(fp => fp.id !== p.id)
    ));
  };

  // Toggle file expansion
  const toggleFileExpansion = (fileId: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  // Import selected products
  const importSelectedProducts = () => {
    const selectedProductsArray = allExtractedProducts.filter(p => selectedProducts.has(p.id));
    onProductsExtracted(selectedProductsArray);
    setCurrentStep(3);
    
    // Reset state
    setTimeout(() => {
      setFiles([]);
      setAllExtractedProducts([]);
      setSelectedProducts(new Set());
      setCurrentStep(0);
      setReviewMode(false);
    }, 1000);
  };

  // Render file status
  const renderFileStatus = (file: ProcessedFile) => {
    const getStatusColor = () => {
      switch (file.status) {
        case 'completed': return 'success';
        case 'error': return 'error';
        case 'processing': return 'info';
        default: return 'default';
      }
    };

    const getStatusIcon = () => {
      switch (file.status) {
        case 'completed': return <CheckCircle />;
        case 'error': return <Error />;
        case 'processing': return <CircularProgress size={20} />;
        default: return <FilePresent />;
      }
    };

    return (
      <Chip
        icon={getStatusIcon()}
        label={file.status}
        color={getStatusColor()}
        size="small"
      />
    );
  };

  return (
    <Box>
      {/* Stepper */}
      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Settings Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          startIcon={<Settings />}
          onClick={() => setSettingsOpen(true)}
          variant="outlined"
          size="small"
        >
          OCR Settings
        </Button>
      </Box>

      {/* File Upload Area */}
      {!reviewMode && (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            bgcolor: isDragActive ? 'primary.50' : 'background.paper',
            cursor: 'pointer',
            textAlign: 'center',
            mb: 3
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports PDF, JPG, PNG files up to {maxFileSize / 1024 / 1024}MB each (max {maxFiles} files)
          </Typography>
        </Paper>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Uploaded Files ({files.length})
            </Typography>
            {!processing && !reviewMode && (
              <Button
                variant="contained"
                onClick={processAllFiles}
                disabled={files.length === 0}
                startIcon={<Analytics />}
              >
                Process All Files
              </Button>
            )}
          </Box>

          {files.map((file) => (
            <Card key={file.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <FilePresent color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{file.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB • {file.type}
                      </Typography>
                    </Box>
                    {renderFileStatus(file)}
                    {file.extractedProducts.length > 0 && (
                      <Chip
                        label={`${file.extractedProducts.length} products`}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {file.extractedProducts.length > 0 && (
                      <IconButton
                        onClick={() => toggleFileExpansion(file.id)}
                        size="small"
                      >
                        {expandedFiles.has(file.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    )}
                    
                    <IconButton
                      onClick={() => removeFile(file.id)}
                      color="error"
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                {file.status === 'processing' && (
                  <Box sx={{ mt: 2 }}>
                    <LinearProgress variant="determinate" value={file.progress} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Processing... {file.progress}%
                    </Typography>
                  </Box>
                )}

                {file.errors.length > 0 && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {file.errors.join(', ')}
                  </Alert>
                )}

                {file.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {file.warnings.join(', ')}
                  </Alert>
                )}

                {/* Expanded Product List */}
                <Collapse in={expandedFiles.has(file.id)}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Extracted Products:
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Rate</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Confidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {file.extractedProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>₹{product.rate.toFixed(2)}</TableCell>
                              <TableCell>₹{(product.amount || 0).toFixed(2)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={`${product.confidence}%`}
                                  color={product.confidence > 80 ? 'success' : product.confidence > 60 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Review Mode */}
      {reviewMode && allExtractedProducts.length > 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Review Extracted Products ({allExtractedProducts.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => setSelectedProducts(new Set(allExtractedProducts.map(p => p.id)))}
                size="small"
              >
                Select All
              </Button>
              <Button
                onClick={() => setSelectedProducts(new Set())}
                size="small"
              >
                Deselect All
              </Button>
              <Button
                variant="contained"
                onClick={importSelectedProducts}
                disabled={selectedProducts.size === 0}
                startIcon={<Save />}
              >
                Import Selected ({selectedProducts.size})
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedProducts.size === allExtractedProducts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(new Set(allExtractedProducts.map(p => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>HSN</TableCell>
                  <TableCell>GST%</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allExtractedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell padding="checkbox">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => {
                          const newSet = new Set(selectedProducts);
                          if (newSet.has(product.id)) {
                            newSet.delete(product.id);
                          } else {
                            newSet.add(product.id);
                          }
                          setSelectedProducts(newSet);
                        }}
                      />
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>₹{product.rate.toFixed(2)}</TableCell>
                    <TableCell>₹{(product.amount || 0).toFixed(2)}</TableCell>
                    <TableCell>{product.hsnCode || '-'}</TableCell>
                    <TableCell>{product.gstRate ? `${product.gstRate}%` : '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.source}
                        size="small"
                        color={product.source === 'pdf-text' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${product.confidence}%`}
                        size="small"
                        color={product.confidence > 80 ? 'success' : product.confidence > 60 ? 'warning' : 'error'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.status}
                        size="small"
                        color={product.status === 'approved' ? 'success' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* OCR Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>OCR Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>OCR Language</InputLabel>
                <Select
                  value={ocrSettings.language}
                  onChange={(e) => setOcrSettings(prev => ({ ...prev, language: e.target.value }))}
                >
                  <MenuItem value="eng">English</MenuItem>
                  <MenuItem value="hin">Hindi</MenuItem>
                  <MenuItem value="eng+hin">English + Hindi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>Confidence Threshold: {ocrSettings.confidence}%</Typography>
              <input
                type="range"
                min="0"
                max="100"
                value={ocrSettings.confidence}
                onChange={(e) => setOcrSettings(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ocrSettings.fallbackToOCR}
                    onChange={(e) => setOcrSettings(prev => ({ ...prev, fallbackToOCR: e.target.checked }))}
                  />
                }
                label="Fallback to OCR if PDF text extraction fails"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ocrSettings.hybridMode}
                    onChange={(e) => setOcrSettings(prev => ({ ...prev, hybridMode: e.target.checked }))}
                  />
                }
                label="Hybrid mode (combine PDF text + OCR)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}