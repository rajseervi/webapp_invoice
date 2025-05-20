// Format date for display
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Format currency
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

// Get status color
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

// Get customer initial for avatar
export const getCustomerInitial = (name: string) => {
  return name.charAt(0).toUpperCase();
};

// Get random color for customer avatar
export const getCustomerAvatarColor = (id: string) => {
  const colors = [
    '#1976d2', '#388e3c', '#d32f2f', '#f57c00', '#7b1fa2',
    '#0288d1', '#689f38', '#e64a19', '#fbc02d', '#512da8'
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
};