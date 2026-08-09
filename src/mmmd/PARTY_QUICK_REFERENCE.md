# Party System - Quick Reference

## 🚀 Quick Start

### 1. **Basic Party Creation**
```typescript
// Navigate to party creation
router.push('/parties/new');

// Or with context
router.push('/parties/new?from=invoice&returnTo=/invoices/gst/new');
```

### 2. **Using Party Service**
```typescript
import { partyService } from '@/services/partyService';

// Create party
const partyId = await partyService.createParty(partyData);

// Get parties
const parties = await partyService.getActiveParties();
const gstParties = await partyService.getGstRegisteredParties();

// Search
const results = await partyService.searchParties("search term");
```

### 3. **Form Components**

#### **Enhanced Form (Full Features)**
```typescript
import EnhancedPartyForm from '@/components/EnhancedPartyForm';

<EnhancedPartyForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={existingParty} // Optional
/>
```

#### **Streamlined Form (Invoice Flow)**
```typescript
import StreamlinedPartyForm from '@/components/StreamlinedPartyForm';

<StreamlinedPartyForm
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isInvoiceFlow={true}
  compactMode={false}
/>
```

## 📋 Party Data Structure

```typescript
interface PartyFormData {
  // Required
  name: string;
  phone: string;
  
  // Basic Info
  email?: string;
  address?: string;
  businessType?: 'B2B' | 'B2C' | 'Export' | 'Import';
  
  // GST Info
  isGstRegistered?: boolean;
  gstin?: string;
  stateCode?: string;
  stateName?: string;
  placeOfSupply?: string;
  panNumber?: string;
  
  // Financial
  creditLimit?: number;
  outstandingBalance?: number;
  
  // Status
  isActive?: boolean;
}
```

## 🔧 Common Patterns

### **1. Party Selection in Invoice**
```typescript
const [selectedParty, setSelectedParty] = useState<Party | null>(null);

<Autocomplete
  options={parties}
  getOptionLabel={(party) => `${party.name} (${party.isGstRegistered ? 'GST' : 'Non-GST'})`}
  value={selectedParty}
  onChange={(_, newValue) => setSelectedParty(newValue)}
  renderOption={(props, party) => (
    <Box component="li" {...props}>
      <Box>
        <Typography>{party.name}</Typography>
        <Chip label={party.businessType} size="small" />
        {party.gstin && <Chip label={party.stateName} size="small" />}
      </Box>
    </Box>
  )}
/>
```

### **2. GST Validation**
```typescript
import { GstCalculator } from '@/services/gstService';

// Validate GSTIN
const isValid = GstCalculator.validateGstin(gstin);

// Extract state
const stateCode = GstCalculator.extractStateCodeFromGstin(gstin);
const stateName = GstCalculator.getStateName(stateCode);

// Check inter-state
const isInterState = GstCalculator.isInterState(companyState, partyState);
```

### **3. Party Creation Flow**
```typescript
// From invoice page
const handleCreateParty = () => {
  const currentUrl = window.location.pathname;
  router.push(`/parties/new?from=invoice&returnTo=${encodeURIComponent(currentUrl)}`);
};

// Handle return from party creation
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('partyId');
  if (partyId) {
    // Load and select the newly created party
    loadParty(partyId);
  }
}, []);
```

## 🎯 Best Practices

### **1. Form Validation**
```typescript
// Required fields
const isValid = formData.name.trim() !== '' && formData.phone.trim() !== '';

// GSTIN validation
const gstinValid = !formData.gstin || GstCalculator.validateGstin(formData.gstin);

// Combined validation
const canSubmit = isValid && gstinValid;
```

### **2. Error Handling**
```typescript
try {
  await partyService.createParty(partyData);
  setSuccess('Party created successfully');
} catch (error) {
  setError('Failed to create party: ' + error.message);
}
```

### **3. Loading States**
```typescript
const [loading, setLoading] = useState(false);

const handleSubmit = async (data) => {
  setLoading(true);
  try {
    await partyService.createParty(data);
  } finally {
    setLoading(false);
  }
};
```

## 🔄 Integration Examples

### **1. Invoice Creation Integration**
```typescript
// In invoice creation page
const [selectedParty, setSelectedParty] = useState<Party | null>(null);

// When party is selected, update GST calculations
useEffect(() => {
  if (selectedParty) {
    updateGstCalculations(selectedParty);
  }
}, [selectedParty]);

const updateGstCalculations = (party: Party) => {
  // Determine tax type based on party state
  const isInterState = party.stateCode !== companyStateCode;
  // Update invoice calculations accordingly
};
```

### **2. Party Search & Filter**
```typescript
// Advanced party filtering
const [filters, setFilters] = useState({
  businessType: '',
  gstRegistered: null,
  state: ''
});

const getFilteredParties = async () => {
  let parties = await partyService.getActiveParties();
  
  if (filters.businessType) {
    parties = await partyService.getPartiesByBusinessType(filters.businessType);
  }
  
  if (filters.gstRegistered) {
    parties = await partyService.getGstRegisteredParties();
  }
  
  return parties;
};
```

### **3. Bulk Operations**
```typescript
// Bulk party operations
const bulkUpdateParties = async (partyIds: string[], updates: Partial<PartyFormData>) => {
  const promises = partyIds.map(id => partyService.updateParty(id, updates));
  await Promise.all(promises);
};

// Bulk status change
const activateParties = async (partyIds: string[]) => {
  const promises = partyIds.map(id => partyService.activateParty(id));
  await Promise.all(promises);
};
```

## 📊 Analytics & Reporting

### **1. Party Statistics**
```typescript
const stats = await partyService.getPartyStatistics();

// Usage in dashboard
<Grid container spacing={2}>
  <Grid item xs={3}>
    <StatCard title="Total Parties" value={stats.total} />
  </Grid>
  <Grid item xs={3}>
    <StatCard title="GST Registered" value={stats.gstRegistered} />
  </Grid>
  <Grid item xs={3}>
    <StatCard title="B2B Parties" value={stats.businessTypes.B2B} />
  </Grid>
  <Grid item xs={3}>
    <StatCard title="Outstanding" value={`₹${stats.totalOutstanding}`} />
  </Grid>
</Grid>
```

### **2. Party Performance**
```typescript
// Get party transaction summary
const getPartyPerformance = async (partyId: string) => {
  const party = await partyService.getParty(partyId);
  // Calculate metrics like:
  // - Total invoices
  // - Average invoice value
  // - Payment history
  // - Credit utilization
};
```

## 🚨 Troubleshooting

### **Common Issues & Solutions**

#### **GSTIN Validation Fails**
```typescript
// Check format: exactly 15 characters
// Pattern: 27AABCU9603R1ZX
// Ensure uppercase letters
const cleanGstin = gstin.toUpperCase().trim();
const isValid = GstCalculator.validateGstin(cleanGstin);
```

#### **State Not Detected**
```typescript
// Manual state selection fallback
if (!formData.stateCode && formData.gstin) {
  const stateCode = GstCalculator.extractStateCodeFromGstin(formData.gstin);
  if (stateCode) {
    setFormData(prev => ({
      ...prev,
      stateCode,
      stateName: GstCalculator.getStateName(stateCode)
    }));
  }
}
```

#### **Form Submission Errors**
```typescript
// Validate before submission
const validateForm = (data: PartyFormData): string[] => {
  const errors = [];
  
  if (!data.name.trim()) errors.push('Name is required');
  if (!data.phone.trim()) errors.push('Phone is required');
  if (data.gstin && !GstCalculator.validateGstin(data.gstin)) {
    errors.push('Invalid GSTIN format');
  }
  
  return errors;
};
```

## 📱 Mobile Considerations

### **Responsive Design**
```typescript
// Use responsive breakpoints
<Grid container spacing={{ xs: 2, md: 3 }}>
  <Grid item xs={12} md={6}>
    <TextField fullWidth label="Name" />
  </Grid>
</Grid>

// Mobile-optimized autocomplete
<Autocomplete
  size="small" // Smaller on mobile
  renderInput={(params) => (
    <TextField
      {...params}
      variant="outlined"
      InputProps={{
        ...params.InputProps,
        sx: { fontSize: { xs: '14px', md: '16px' } }
      }}
    />
  )}
/>
```

## 🔗 Related Documentation

- **Full Guide**: `PARTY_USAGE_GUIDE.md`
- **Technical Details**: `ENHANCED_PARTY_SYSTEM.md`
- **Migration**: `src/utils/partyMigration.ts`
- **Examples**: `src/examples/PartyInvoiceIntegration.tsx`