import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  ToggleLeft,
  ToggleRight,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Party, PartyFilters, PartyStatistics } from '@/types/party_no_gst';
import PartyNoGstService, { PartySearchOptions } from '@/services/partyNoGstService';

interface PartyNoGstManagerProps {
  userId?: string;
  onPartySelect?: (party: Party) => void;
  showStatistics?: boolean;
  allowBulkOperations?: boolean;
}

const PartyNoGstManager: React.FC<PartyNoGstManagerProps> = ({
  userId,
  onPartySelect,
  showStatistics = true,
  allowBulkOperations = true
}) => {
  // State management
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [statistics, setStatistics] = useState<PartyStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());

  // UI State
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingParty, setEditingParty] = useState<Party | null>(null);
  const [viewingParty, setViewingParty] = useState<Party | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<PartyFilters>({});
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState<Partial<Party>>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    panNumber: '',
    businessType: 'Customer',
    isActive: true,
    creditLimit: 0,
    outstandingBalance: 0,
    paymentTerms: '',
    notes: '',
    tags: [],
    preferredCategories: []
  });

  // Load parties and statistics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [partiesData, statsData] = await Promise.all([
        PartyNoGstService.getParties(filters, userId),
        showStatistics ? PartyNoGstService.getPartyStatistics(userId) : Promise.resolve(null)
      ]);

      setParties(partiesData);
      setFilteredParties(partiesData);
      setStatistics(statsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading parties:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, userId, showStatistics]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply search and filters
  useEffect(() => {
    let filtered = [...parties];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(party =>
        party.name.toLowerCase().includes(search) ||
        (party.email && party.email.toLowerCase().includes(search)) ||
        (party.phone && party.phone.includes(searchTerm)) ||
        (party.contactPerson && party.contactPerson.toLowerCase().includes(search))
      );
    }

    // Business type filter
    if (businessTypeFilter && businessTypeFilter !== 'all') {
      filtered = filtered.filter(party => party.businessType === businessTypeFilter);
    }

    // Active status filter
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'active';
      filtered = filtered.filter(party => party.isActive === isActive);
    }

    setFilteredParties(filtered);
  }, [parties, searchTerm, businessTypeFilter, activeFilter]);

  // Form handlers
  const handleInputChange = (field: keyof Party, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (tags: string[]) => {
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleCategoriesChange = (categories: string[]) => {
    setFormData(prev => ({ ...prev, preferredCategories: categories }));
  };

  // CRUD Operations
  const handleCreateParty = async () => {
    try {
      setLoading(true);
      
      const validation = PartyNoGstService.validatePartyData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      const partyData = { ...formData, userId } as Omit<Party, 'id' | 'createdAt' | 'updatedAt'>;
      await PartyNoGstService.createParty(partyData);
      
      setShowAddForm(false);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        panNumber: '',
        businessType: 'Customer',
        isActive: true,
        creditLimit: 0,
        outstandingBalance: 0,
        paymentTerms: '',
        notes: '',
        tags: [],
        preferredCategories: []
      });
      
      await loadData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateParty = async () => {
    if (!editingParty) return;

    try {
      setLoading(true);
      
      const validation = PartyNoGstService.validatePartyData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      await PartyNoGstService.updateParty(editingParty.id!, formData);
      
      setShowEditForm(false);
      setEditingParty(null);
      await loadData();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update party');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async (partyId: string, hardDelete: boolean = false) => {
    if (!confirm(`Are you sure you want to ${hardDelete ? 'permanently delete' : 'deactivate'} this party?`)) {
      return;
    }

    try {
      setLoading(true);
      await PartyNoGstService.deleteParty(partyId, hardDelete);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete party');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (partyId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await PartyNoGstService.activateParty(partyId);
      } else {
        await PartyNoGstService.deactivateParty(partyId);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle party status');
    }
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedParties.size === 0) return;
    
    if (!confirm(`Are you sure you want to deactivate ${selectedParties.size} parties?`)) {
      return;
    }

    try {
      setLoading(true);
      const updates = Array.from(selectedParties).map(id => ({
        id,
        data: { isActive: false }
      }));
      
      await PartyNoGstService.bulkUpdateParties(updates);
      setSelectedParties(new Set());
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk delete parties');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkActivate = async () => {
    if (selectedParties.size === 0) return;

    try {
      setLoading(true);
      const updates = Array.from(selectedParties).map(id => ({
        id,
        data: { isActive: true }
      }));
      
      await PartyNoGstService.bulkUpdateParties(updates);
      setSelectedParties(new Set());
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk activate parties');
    } finally {
      setLoading(false);
    }
  };

  // Export/Import
  const handleExport = async () => {
    try {
      const exportData = await PartyNoGstService.exportParties(userId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parties_no_gst_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export parties');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const importData = JSON.parse(text);
      
      if (!Array.isArray(importData)) {
        throw new Error('Invalid file format');
      }

      const createdIds = await PartyNoGstService.importParties(importData, userId);
      alert(`Successfully imported ${createdIds.length} parties`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import parties');
    } finally {
      setLoading(false);
    }
  };

  // UI Helpers
  const openEditForm = (party: Party) => {
    setEditingParty(party);
    setFormData(party);
    setShowEditForm(true);
  };

  const openViewModal = (party: Party) => {
    setViewingParty(party);
  };

  const togglePartySelection = (partyId: string) => {
    const newSelection = new Set(selectedParties);
    if (newSelection.has(partyId)) {
      newSelection.delete(partyId);
    } else {
      newSelection.add(partyId);
    }
    setSelectedParties(newSelection);
  };

  const selectAllParties = () => {
    if (selectedParties.size === filteredParties.length) {
      setSelectedParties(new Set());
    } else {
      setSelectedParties(new Set(filteredParties.map(p => p.id!)));
    }
  };

  if (loading && parties.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading parties...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Party Management (Non-GST)</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Party</span>
          </button>
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics */}
      {showStatistics && statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Parties</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalParties}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Parties</p>
                <p className="text-2xl font-bold text-green-600">{statistics.activeParties}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">₹{statistics.totalOutstanding.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Limit</p>
                <p className="text-2xl font-bold text-purple-600">₹{statistics.totalCreditLimit.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search parties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={businessTypeFilter}
            onChange={(e) => setBusinessTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="Customer">Customer</option>
            <option value="Supplier">Supplier</option>
            <option value="B2B">B2B</option>
            <option value="B2C">B2C</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {allowBulkOperations && selectedParties.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-700">
              {selectedParties.size} parties selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkActivate}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parties Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {allowBulkOperations && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedParties.size === filteredParties.length && filteredParties.length > 0}
                      onChange={selectAllParties}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredParties.map((party) => (
                <tr key={party.id} className="hover:bg-gray-50">
                  {allowBulkOperations && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedParties.has(party.id!)}
                        onChange={() => togglePartySelection(party.id!)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{party.name}</div>
                        {party.contactPerson && (
                          <div className="text-sm text-gray-500">{party.contactPerson}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      party.businessType === 'Customer' ? 'bg-blue-100 text-blue-800' :
                      party.businessType === 'Supplier' ? 'bg-green-100 text-green-800' :
                      party.businessType === 'B2B' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {party.businessType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{party.phone}</div>
                    <div className="text-gray-500">{party.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(party.outstandingBalance || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(party.id!, !party.isActive)}
                      className="flex items-center space-x-1"
                    >
                      {party.isActive ? (
                        <>
                          <ToggleRight className="h-5 w-5 text-green-600" />
                          <span className="text-green-600 text-sm">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-400 text-sm">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(party)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditForm(party)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteParty(party.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredParties.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No parties found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || businessTypeFilter || activeFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating a new party'
              }
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Party Modal */}
      {(showAddForm || showEditForm) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showAddForm ? 'Add New Party' : 'Edit Party'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter party name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type *
                  </label>
                  <select
                    value={formData.businessType || 'Customer'}
                    onChange={(e) => handleInputChange('businessType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                    <option value="B2B">B2B</option>
                    <option value="B2C">B2C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={formData.panNumber || ''}
                    onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter PAN number"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    value={formData.creditLimit || 0}
                    onChange={(e) => handleInputChange('creditLimit', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter credit limit"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outstanding Balance
                  </label>
                  <input
                    type="number"
                    value={formData.outstandingBalance || 0}
                    onChange={(e) => handleInputChange('outstandingBalance', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter outstanding balance"
                    min="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter address"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms || ''}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter payment terms"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter notes"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive ?? true}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingParty(null);
                    setFormData({
                      name: '',
                      contactPerson: '',
                      email: '',
                      phone: '',
                      address: '',
                      panNumber: '',
                      businessType: 'Customer',
                      isActive: true,
                      creditLimit: 0,
                      outstandingBalance: 0,
                      paymentTerms: '',
                      notes: '',
                      tags: [],
                      preferredCategories: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={showAddForm ? handleCreateParty : handleUpdateParty}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (showAddForm ? 'Create Party' : 'Update Party')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Party Modal */}
      {viewingParty && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Party Details</h3>
                <button
                  onClick={() => setViewingParty(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{viewingParty.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Business Type</label>
                  <p className="text-sm text-gray-900">{viewingParty.businessType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="text-sm text-gray-900">{viewingParty.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{viewingParty.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{viewingParty.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                  <p className="text-sm text-gray-900">{viewingParty.panNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Credit Limit</label>
                  <p className="text-sm text-gray-900">₹{(viewingParty.creditLimit || 0).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Outstanding Balance</label>
                  <p className="text-sm text-gray-900">₹{(viewingParty.outstandingBalance || 0).toLocaleString()}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Address</label>
                  <p className="text-sm text-gray-900">{viewingParty.address || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Payment Terms</label>
                  <p className="text-sm text-gray-900">{viewingParty.paymentTerms || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900">{viewingParty.notes || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className={`text-sm ${viewingParty.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {viewingParty.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(viewingParty.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setViewingParty(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartyNoGstManager;