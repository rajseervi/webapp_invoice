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
  CheckCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  MoreVertical,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  RefreshCw
} from 'lucide-react';
import { Party, PartyFilters, PartyStatistics } from '@/types/party_no_gst';
import PartyNoGstService, { PartySearchOptions } from '@/services/partyNoGstService';
import PartyFormModal from './PartyFormModal';
import PartyDetailsModal from './PartyDetailsModal';

interface PartyNoGstManagerEnhancedProps {
  userId?: string;
  onPartySelect?: (party: Party) => void;
  showStatistics?: boolean;
  allowBulkOperations?: boolean;
}

const PartyNoGstManagerEnhanced: React.FC<PartyNoGstManagerEnhancedProps> = ({
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'outstandingBalance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Load parties and statistics
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [partiesData, statsData] = await Promise.all([
        PartyNoGstService.getParties({}, userId),
        showStatistics ? PartyNoGstService.getPartyStatistics(userId) : Promise.resolve(null)
      ]);
      
      setParties(partiesData);
      setStatistics(statsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load party data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, showStatistics]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and search parties
  useEffect(() => {
    let filtered = parties;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(party =>
        party.name.toLowerCase().includes(term) ||
        party.email?.toLowerCase().includes(term) ||
        party.phone?.toLowerCase().includes(term) ||
        party.contactPerson?.toLowerCase().includes(term)
      );
    }

    // Apply business type filter
    if (businessTypeFilter) {
      filtered = filtered.filter(party => party.businessType === businessTypeFilter);
    }

    // Apply active filter
    if (activeFilter) {
      const isActive = activeFilter === 'active';
      filtered = filtered.filter(party => party.isActive === isActive);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredParties(filtered);
    setCurrentPage(1);
  }, [parties, searchTerm, businessTypeFilter, activeFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredParties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParties = filteredParties.slice(startIndex, startIndex + itemsPerPage);

  // Handle party operations
  const handleDeleteParty = async (partyId: string) => {
    if (!window.confirm('Are you sure you want to delete this party?')) return;
    
    try {
      await PartyNoGstService.deleteParty(partyId);
      await loadData();
    } catch (err) {
      setError('Failed to delete party');
    }
  };

  const handleToggleActive = async (party: Party) => {
    try {
      await PartyNoGstService.updateParty(party.id, { isActive: !party.isActive });
      await loadData();
    } catch (err) {
      setError('Failed to update party status');
    }
  };

  const handleExport = async () => {
    try {
      const data = await PartyNoGstService.exportParties(userId!);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parties-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export parties');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await PartyNoGstService.importParties(data, userId!);
      await loadData();
    } catch (err) {
      setError('Failed to import parties');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading party management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Party Management</h1>
                  <p className="text-blue-100">Manage your business parties and customers</p>
                </div>
                <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 flex items-center space-x-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Party</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 flex items-center space-x-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Download className="h-5 w-5" />
                    <span>Export</span>
                  </button>
                  <label className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 flex items-center space-x-2 font-semibold cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Upload className="h-5 w-5" />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={loadData}
                    className="bg-slate-500 text-white px-6 py-3 rounded-xl hover:bg-slate-600 flex items-center space-x-2 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <span className="text-red-700 font-medium">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {showStatistics && statistics && (
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Total Parties</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2">{statistics.totalParties}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Active Parties</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{statistics.activeParties}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Outstanding</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">₹{statistics.totalOutstanding.toLocaleString()}</p>
                  </div>
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Credit Limit</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">₹{statistics.totalCreditLimit.toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <CreditCard className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search parties by name, email, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <select
                  value={businessTypeFilter}
                  onChange={(e) => setBusinessTypeFilter(e.target.value)}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-all duration-200"
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
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 hover:bg-white transition-all duration-200"
                >
                  <option value="name">Sort by Name</option>
                  <option value="createdAt">Sort by Date</option>
                  <option value="outstandingBalance">Sort by Outstanding</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-200"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-5 w-5" /> : <SortDesc className="h-5 w-5" />}
                </button>

                <div className="flex border border-slate-300 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-3 transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-3 transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parties Grid/List */}
        <div className="mb-8">
          {paginatedParties.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No parties found</h3>
              <p className="text-slate-500 mb-6">
                {searchTerm || businessTypeFilter || activeFilter 
                  ? 'Try adjusting your search or filters' 
                  : 'Get started by adding your first party'
                }
              </p>
              {!searchTerm && !businessTypeFilter && !activeFilter && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold transition-all duration-200"
                >
                  Add Your First Party
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedParties.map((party) => (
                    <div
                      key={party.id}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-3">
                            <Building2 className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg">{party.name}</h3>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                              party.businessType === 'Customer' ? 'bg-green-100 text-green-800' :
                              party.businessType === 'Supplier' ? 'bg-blue-100 text-blue-800' :
                              party.businessType === 'B2B' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {party.businessType}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleActive(party)}
                            className={`p-2 rounded-lg transition-all duration-200 ${
                              party.isActive 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                          >
                            {party.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        {party.contactPerson && (
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{party.contactPerson}</span>
                          </div>
                        )}
                        {party.email && (
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Mail className="h-4 w-4" />
                            <span className="text-sm">{party.email}</span>
                          </div>
                        )}
                        {party.phone && (
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{party.phone}</span>
                          </div>
                        )}
                        {party.address && (
                          <div className="flex items-start space-x-2 text-slate-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span className="text-sm line-clamp-2">{party.address}</span>
                          </div>
                        )}
                      </div>

                      {(party.creditLimit || party.outstandingBalance) && (
                        <div className="bg-slate-50 rounded-xl p-4 mb-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Credit Limit</p>
                              <p className="font-semibold text-slate-900">₹{(party.creditLimit || 0).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-500 uppercase tracking-wide">Outstanding</p>
                              <p className={`font-semibold ${
                                (party.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                ₹{(party.outstandingBalance || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingParty(party)}
                          className="flex-1 bg-blue-50 text-blue-600 py-2 px-3 rounded-lg hover:bg-blue-100 transition-all duration-200 flex items-center justify-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="text-sm font-medium">View</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingParty(party);
                            setShowEditForm(true);
                          }}
                          className="flex-1 bg-green-50 text-green-600 py-2 px-3 rounded-lg hover:bg-green-100 transition-all duration-200 flex items-center justify-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteParty(party.id)}
                          className="bg-red-50 text-red-600 py-2 px-3 rounded-lg hover:bg-red-100 transition-all duration-200 flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Party</th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Contact</th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Type</th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Financial</th>
                          <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                          <th className="text-right py-4 px-6 font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {paginatedParties.map((party) => (
                          <tr key={party.id} className="hover:bg-slate-50 transition-colors duration-200">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{party.name}</p>
                                  {party.contactPerson && (
                                    <p className="text-sm text-slate-500">{party.contactPerson}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                {party.email && (
                                  <div className="flex items-center space-x-1 text-sm text-slate-600">
                                    <Mail className="h-3 w-3" />
                                    <span>{party.email}</span>
                                  </div>
                                )}
                                {party.phone && (
                                  <div className="flex items-center space-x-1 text-sm text-slate-600">
                                    <Phone className="h-3 w-3" />
                                    <span>{party.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                party.businessType === 'Customer' ? 'bg-green-100 text-green-800' :
                                party.businessType === 'Supplier' ? 'bg-blue-100 text-blue-800' :
                                party.businessType === 'B2B' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {party.businessType}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-slate-500">Credit: </span>
                                  <span className="font-medium">₹{(party.creditLimit || 0).toLocaleString()}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-slate-500">Outstanding: </span>
                                  <span className={`font-medium ${
                                    (party.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    ₹{(party.outstandingBalance || 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => handleToggleActive(party)}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
                                  party.isActive 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {party.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setViewingParty(party)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingParty(party);
                                    setShowEditForm(true);
                                  }}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteParty(party.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
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
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <PartyFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={loadData}
          userId={userId!}
          mode="add"
        />

        <PartyFormModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingParty(null);
          }}
          onSave={loadData}
          party={editingParty}
          userId={userId!}
          mode="edit"
        />

        <PartyDetailsModal
          isOpen={!!viewingParty}
          onClose={() => setViewingParty(null)}
          party={viewingParty}
          onEdit={(party) => {
            setEditingParty(party);
            setShowEditForm(true);
            setViewingParty(null);
          }}
          onDelete={handleDeleteParty}
        />
      </div>
    </div>
  );
};

export default PartyNoGstManagerEnhanced;