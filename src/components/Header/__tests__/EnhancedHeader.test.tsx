import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AuthContext } from '@/contexts/AuthContext';
import EnhancedHeader from '../EnhancedHeader';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}));

// Mock services
jest.mock('@/services/partyService', () => ({
  partyService: {
    getAllParties: jest.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Party',
        email: 'test@example.com',
        phone: '1234567890',
        type: 'Customer',
      },
    ]),
  },
}));

jest.mock('@/services/productService', () => ({
  productService: {
    getAllProducts: jest.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Product',
        code: 'TP001',
        category: 'Electronics',
      },
    ]),
  },
}));

// Mock auth utilities
jest.mock('@/utils/authRedirects', () => ({
  handleLogout: jest.fn(),
}));

const theme = createTheme();

const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

const mockAuthContext = {
  user: mockUser,
  loading: false,
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('EnhancedHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the header with title', () => {
    renderWithProviders(
      <EnhancedHeader title="Test Dashboard" />
    );

    expect(screen.getByText('Test Dashboard')).toBeInTheDocument();
  });

  it('shows search input when showSearch is true', () => {
    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    expect(screen.getByPlaceholderText(/search parties, products, invoices/i)).toBeInTheDocument();
  });

  it('hides search input when showSearch is false', () => {
    renderWithProviders(
      <EnhancedHeader showSearch={false} />
    );

    expect(screen.queryByPlaceholderText(/search parties, products, invoices/i)).not.toBeInTheDocument();
  });

  it('shows quick actions button when showQuickActions is true', () => {
    renderWithProviders(
      <EnhancedHeader showQuickActions={true} />
    );

    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('displays user avatar with initials when no photo URL', () => {
    renderWithProviders(
      <EnhancedHeader />
    );

    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of "Test User"
  });

  it('opens profile menu when avatar is clicked', async () => {
    renderWithProviders(
      <EnhancedHeader />
    );

    const avatar = screen.getByRole('button', { name: /profile/i });
    fireEvent.click(avatar);

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('opens quick actions menu when quick actions button is clicked', async () => {
    renderWithProviders(
      <EnhancedHeader showQuickActions={true} />
    );

    const quickActionsButton = screen.getByText('Quick Actions');
    fireEvent.click(quickActionsButton);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('New Invoice')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
    });
  });

  it('performs search when typing in search input', async () => {
    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    const searchInput = screen.getByPlaceholderText(/search parties, products, invoices/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByText('Test Party')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('shows notifications badge', () => {
    renderWithProviders(
      <EnhancedHeader />
    );

    const notificationButton = screen.getByRole('button', { name: /notifications/i });
    expect(notificationButton).toBeInTheDocument();
    
    // Check for badge (the number 3 should be visible)
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('toggles theme when theme button is clicked', () => {
    const mockThemeToggle = jest.fn();
    
    renderWithProviders(
      <EnhancedHeader onThemeToggle={mockThemeToggle} isDarkMode={false} />
    );

    const themeButton = screen.getByRole('button', { name: /theme/i });
    fireEvent.click(themeButton);

    expect(mockThemeToggle).toHaveBeenCalledTimes(1);
  });

  it('shows drawer toggle button on mobile', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    const mockDrawerToggle = jest.fn();
    
    renderWithProviders(
      <EnhancedHeader onDrawerToggle={mockDrawerToggle} />
    );

    // The mobile menu button should be present
    const menuButtons = screen.getAllByRole('button', { name: /menu/i });
    expect(menuButtons.length).toBeGreaterThan(0);
  });

  it('displays custom quick actions when provided', async () => {
    const customQuickActions = [
      {
        id: 'custom-1',
        title: 'Custom Action',
        icon: <div>Custom Icon</div>,
        path: '/custom',
        color: '#FF5722',
      },
    ];

    renderWithProviders(
      <EnhancedHeader 
        showQuickActions={true} 
        customQuickActions={customQuickActions}
      />
    );

    const quickActionsButton = screen.getByText('Quick Actions');
    fireEvent.click(quickActionsButton);

    await waitFor(() => {
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });

  it('handles search result click navigation', async () => {
    const mockPush = jest.fn();
    
    // Mock useRouter to return our mock push function
    jest.doMock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
      usePathname: () => '/dashboard',
    }));

    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    const searchInput = screen.getByPlaceholderText(/search parties, products, invoices/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      const searchResult = screen.getByText('Test Party');
      fireEvent.click(searchResult);
    }, { timeout: 500 });

    // Note: This test might need adjustment based on actual router mock implementation
  });

  it('shows loading spinner during search', async () => {
    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    const searchInput = screen.getByPlaceholderText(/search parties, products, invoices/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should show loading spinner briefly
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles empty search results', async () => {
    // Mock empty results
    jest.doMock('@/services/partyService', () => ({
      partyService: {
        getAllParties: jest.fn().mockResolvedValue([]),
      },
    }));

    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    const searchInput = screen.getByPlaceholderText(/search parties, products, invoices/i);
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('closes search results when clicking away', async () => {
    renderWithProviders(
      <EnhancedHeader showSearch={true} />
    );

    const searchInput = screen.getByPlaceholderText(/search parties, products, invoices/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.focus(searchInput);

    await waitFor(() => {
      expect(screen.getByText('Test Party')).toBeInTheDocument();
    }, { timeout: 500 });

    // Click away
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Test Party')).not.toBeInTheDocument();
    });
  });
});

// Integration tests
describe('EnhancedHeader Integration', () => {
  it('integrates properly with auth context', () => {
    const customAuthContext = {
      ...mockAuthContext,
      user: {
        ...mockUser,
        displayName: 'John Doe',
        email: 'john@example.com',
      },
    };

    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={customAuthContext}>
          <EnhancedHeader />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial
  });

  it('handles missing user gracefully', () => {
    const noUserAuthContext = {
      ...mockAuthContext,
      user: null,
    };

    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={noUserAuthContext}>
          <EnhancedHeader />
        </AuthContext.Provider>
      </ThemeProvider>
    );

    expect(screen.getByText('U')).toBeInTheDocument(); // Default avatar initial
  });
});