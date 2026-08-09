import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  CreditCard, 
  Calendar,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Party } from '@/types/party_no_gst';

interface PartyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: Party | null;
  onEdit?: (party: Party) => void;
  onDelete?: (partyId: string) => void;
}

const PartyDetailsModal: React.FC<PartyDetailsModalProps> = ({
  isOpen,
  onClose,
  party,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !party) return null;

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'Customer': return 'bg-green-100 text-green-800';
      case 'Supplier': return 'bg-blue-100 text-blue-800';
      case 'B2B': return 'bg-purple-100 text-purple-800';
      case 'B2C': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white bg-opacity-20 rounded-xl p-3">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{party.name}</h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getBusinessTypeColor(party.businessType || 'Customer')} bg-opacity-20 text-white`}>
                    {party.businessType || 'Customer'}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    party.isActive !== false 
                      ? 'bg-green-500 bg-opacity-20 text-white' 
                      : 'bg-red-500 bg-opacity-20 text-white'
                  }`}>
                    {party.isActive !== false ? (
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
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(party)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                  title="Edit Party"
                >
                  <Edit className="h-5 w-5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(party.id)}
                  className="text-white hover:bg-red-500 hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
                  title="Delete Party"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Party Name</label>
                    <p className="text-lg font-semibold text-gray-900">{party.name}</p>
                  </div>
                  
                  {party.contactPerson && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Contact Person</label>
                      <p className="text-gray-900">{party.contactPerson}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Business Type</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getBusinessTypeColor(party.businessType || 'Customer')}`}>
                      {party.businessType || 'Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 mr-2 text-green-600" />
                  Contact Information
                </h3>
                
                <div className="space-y-4">
                  {party.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Email</label>
                        <a 
                          href={`mailto:${party.email}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {party.email}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {party.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Phone</label>
                        <a 
                          href={`tel:${party.phone}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {party.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {party.address && (
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900 whitespace-pre-line">{party.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                  Financial Information
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Credit Limit</label>
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{(party.creditLimit || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Outstanding</label>
                      <p className={`text-2xl font-bold ${
                        (party.outstandingBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ₹{(party.outstandingBalance || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {party.paymentTerms && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Terms</label>
                      <p className="text-gray-900">{party.paymentTerms}</p>
                    </div>
                  )}
                  
                  {(party.creditLimit || 0) > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Credit Utilization</label>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            ((party.outstandingBalance || 0) / (party.creditLimit || 1)) > 0.8 
                              ? 'bg-red-500' 
                              : ((party.outstandingBalance || 0) / (party.creditLimit || 1)) > 0.6 
                                ? 'bg-yellow-500' 
                                : 'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min(100, ((party.outstandingBalance || 0) / (party.creditLimit || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {(((party.outstandingBalance || 0) / (party.creditLimit || 1)) * 100).toFixed(1)}% utilized
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-orange-600" />
                  Additional Information
                </h3>
                
                <div className="space-y-4">
                  {party.tags && party.tags.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {party.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {party.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                      <div className="bg-white rounded-xl p-4 border border-orange-200">
                        <p className="text-gray-900 whitespace-pre-line">{party.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(party.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Last Updated</label>
                      <div className="flex items-center space-x-2 text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(party.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-all duration-200"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(party)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Party</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartyDetailsModal;