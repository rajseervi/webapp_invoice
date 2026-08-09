# Party Management System (Non-GST)

A comprehensive party management system for handling non-GST parties with full CRUD operations, advanced filtering, bulk operations, and data import/export capabilities.

## Features

### Core Functionality
- ✅ **Add Party**: Create new parties with comprehensive details
- ✅ **Edit Party**: Update existing party information
- ✅ **Delete Party**: Soft delete (deactivate) or hard delete parties
- ✅ **View Party**: Detailed view of party information
- ✅ **Search & Filter**: Advanced search and filtering capabilities
- ✅ **Bulk Operations**: Select multiple parties for bulk actions

### Advanced Features
- 📊 **Statistics Dashboard**: Real-time statistics and insights
- 📤 **Export Data**: Export parties to JSON format
- 📥 **Import Data**: Import parties from JSON files
- 🏷️ **Tags & Categories**: Organize parties with tags and preferred categories
- 💰 **Financial Tracking**: Track credit limits and outstanding balances
- 🔄 **Status Management**: Activate/deactivate parties
- 📱 **Responsive Design**: Works on all device sizes

## File Structure

```
src/
├── services/
│   └── partyNoGstService.ts          # Service layer for party operations
├── components/
│   └── PartyNoGstManager.tsx         # Main party management component
├── pages/
│   └── PartyNoGstPage.tsx           # Page wrapper component
├── types/
│   └── party_no_gst.ts              # TypeScript interfaces
└── utils/
    └── firestoreUtils.ts            # Utility functions (updated)
```

## Installation & Setup

1. **Import the required files** into your project
2. **Install dependencies** (if not already installed):
   ```bash
   npm install firebase lucide-react
   ```
3. **Update your Firebase configuration** to ensure Firestore is properly configured
4. **Add the component** to your routing system

## Usage

### Basic Usage

```tsx
import PartyNoGstManager from '@/components/PartyNoGstManager';

function MyPage() {
  return (
    <PartyNoGstManager
      userId="user123"
      showStatistics={true}
      allowBulkOperations={true}
    />
  );
}
```

### Advanced Usage with Event Handlers

```tsx
import PartyNoGstManager from '@/components/PartyNoGstManager';
import { Party } from '@/types/party_no_gst';

function MyPage() {
  const handlePartySelect = (party: Party) => {
    console.log('Selected party:', party);
    // Handle party selection
  };

  return (
    <PartyNoGstManager
      userId="user123"
      onPartySelect={handlePartySelect}
      showStatistics={true}
      allowBulkOperations={true}
    />
  );
}
```

## API Reference

### PartyNoGstService

#### Methods

##### `createParty(partyData)`
Creates a new party.

```typescript
const partyId = await PartyNoGstService.createParty({
  name: "ABC Company",
  businessType: "Customer",
  email: "contact@abc.com",
  phone: "+91-9876543210",
  isActive: true
});
```

##### `updateParty(partyId, updates)`
Updates an existing party.

```typescript
await PartyNoGstService.updateParty("party123", {
  name: "Updated Company Name",
  creditLimit: 50000
});
```

##### `deleteParty(partyId, hardDelete?)`
Deletes a party (soft delete by default).

```typescript
// Soft delete (deactivate)
await PartyNoGstService.deleteParty("party123");

// Hard delete (permanent)
await PartyNoGstService.deleteParty("party123", true);
```

##### `getPartyById(partyId)`
Retrieves a party by ID.

```typescript
const party = await PartyNoGstService.getPartyById("party123");
```

##### `getParties(filters?, userId?)`
Retrieves parties with optional filters.

```typescript
const parties = await PartyNoGstService.getParties({
  businessType: "Customer",
  isActive: true,
  searchTerm: "ABC"
}, "user123");
```

##### `searchParties(options, userId?)`
Advanced search with multiple options.

```typescript
const parties = await PartyNoGstService.searchParties({
  searchTerm: "company",
  businessType: "Customer",
  isActive: true,
  limitCount: 10
}, "user123");
```

##### `getPartyStatistics(userId?)`
Gets comprehensive party statistics.

```typescript
const stats = await PartyNoGstService.getPartyStatistics("user123");
```

##### `bulkUpdateParties(updates)`
Performs bulk updates on multiple parties.

```typescript
await PartyNoGstService.bulkUpdateParties([
  { id: "party1", data: { isActive: false } },
  { id: "party2", data: { creditLimit: 25000 } }
]);
```

##### `updateOutstandingBalance(partyId, amount, operation?)`
Updates party's outstanding balance.

```typescript
// Set balance to specific amount
await PartyNoGstService.updateOutstandingBalance("party123", 10000, "set");

// Add to existing balance
await PartyNoGstService.updateOutstandingBalance("party123", 5000, "add");

// Subtract from existing balance
await PartyNoGstService.updateOutstandingBalance("party123", 2000, "subtract");
```

##### `exportParties(userId?)`
Exports parties to JSON format.

```typescript
const exportData = await PartyNoGstService.exportParties("user123");
```

##### `importParties(parties, userId?)`
Imports parties from JSON data.

```typescript
const createdIds = await PartyNoGstService.importParties(importData, "user123");
```

##### `validatePartyData(partyData)`
Validates party data before saving.

```typescript
const validation = PartyNoGstService.validatePartyData({
  name: "Test Company",
  email: "invalid-email"
});

if (!validation.isValid) {
  console.log("Errors:", validation.errors);
}
```

### Component Props

#### PartyNoGstManager Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `userId` | `string?` | `undefined` | User ID to filter parties |
| `onPartySelect` | `(party: Party) => void` | `undefined` | Callback when party is selected |
| `showStatistics` | `boolean` | `true` | Show statistics dashboard |
| `allowBulkOperations` | `boolean` | `true` | Enable bulk operations |

## Data Structure

### Party Interface

```typescript
interface Party {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  panNumber?: string;
  businessType: 'B2B' | 'B2C' | 'Supplier' | 'Customer';
  isActive: boolean;
  
  // Financial Information
  creditLimit?: number;
  outstandingBalance?: number;
  paymentTerms?: string;
  
  // Additional Information
  notes?: string;
  tags?: string[];
  preferredCategories?: string[];
  
  // System Fields
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  userId?: string;
}
```

### Filters Interface

```typescript
interface PartyFilters {
  businessType?: string;
  isActive?: boolean;
  searchTerm?: string;
  tags?: string[];
  creditLimitFrom?: number;
  creditLimitTo?: number;
  outstandingBalanceFrom?: number;
  outstandingBalanceTo?: number;
}
```

## Validation Rules

### Required Fields
- `name`: Party name (required)
- `businessType`: Must be one of 'B2B', 'B2C', 'Supplier', 'Customer'

### Optional Field Validations
- `email`: Must be valid email format
- `phone`: Must be valid phone number format
- `panNumber`: Must be valid PAN format (10 characters: 5 letters + 4 digits + 1 letter)
- `creditLimit`: Cannot be negative
- `outstandingBalance`: Cannot be negative

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const partyId = await PartyNoGstService.createParty(partyData);
  console.log('Party created:', partyId);
} catch (error) {
  console.error('Failed to create party:', error.message);
  // Handle error appropriately
}
```

## Performance Considerations

1. **Pagination**: For large datasets, consider implementing pagination
2. **Indexing**: Ensure Firestore indexes are created for filtered fields
3. **Caching**: Consider implementing client-side caching for frequently accessed data
4. **Batch Operations**: Use bulk operations for multiple updates

## Security Rules

Ensure your Firestore security rules allow appropriate access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /parties_no_gst/{partyId} {
      allow read, write: if request.auth != null && 
        (resource == null || resource.data.userId == request.auth.uid);
    }
  }
}
```

## Customization

### Styling
The component uses Tailwind CSS classes. You can customize the appearance by:
1. Modifying the CSS classes in the component
2. Adding custom CSS overrides
3. Using CSS-in-JS solutions

### Adding Custom Fields
To add custom fields:
1. Update the `Party` interface in `types/party_no_gst.ts`
2. Update the form in `PartyNoGstManager.tsx`
3. Update validation in `PartyNoGstService.ts`

### Custom Business Logic
You can extend the service with custom methods:

```typescript
// Add to PartyNoGstService class
static async getPartiesWithHighOutstanding(threshold: number, userId?: string): Promise<Party[]> {
  const parties = await this.getParties({}, userId);
  return parties.filter(party => (party.outstandingBalance || 0) > threshold);
}
```

## Troubleshooting

### Common Issues

1. **Firestore Permission Denied**
   - Check your Firestore security rules
   - Ensure user is authenticated

2. **Import/Export Not Working**
   - Check file format (must be valid JSON)
   - Ensure data structure matches Party interface

3. **Search Not Working**
   - Check if Firestore indexes are created
   - Verify search terms are properly formatted

4. **Bulk Operations Failing**
   - Check batch size limits (Firestore has a 500 operation limit per batch)
   - Ensure all party IDs exist

### Debug Mode

Enable debug logging:

```typescript
// Add to your component
const [debugMode, setDebugMode] = useState(false);

// Use in service calls
if (debugMode) {
  console.log('Service call:', method, params);
}
```

## Contributing

To contribute to this party management system:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Add validation for new fields
5. Update documentation

## License

This party management system is part of your application and follows your project's license terms.