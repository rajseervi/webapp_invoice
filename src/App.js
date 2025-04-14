import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import RegistrationSuccess from './components/Auth/RegistrationSuccess';
import Dashboard from './components/Dashboard/Dashboard';
import Inventory from './components/Inventory/Inventory';
import Sales from './components/Sales/Sales';
import PurchaseOrders from './components/PurchaseOrders/PurchaseOrders';
import StockAlerts from './components/StockAlerts/StockAlerts';
import Ledger from './components/Ledger/Ledger';
import UserManagement from './components/Admin/UserManagement';
import NotFound from './components/Common/NotFound';
import Unauthorized from './components/Common/Unauthorized';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          
          {/* Protected Routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            {/* Inventory - Accessible by all authenticated users */}
            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <Inventory />
              </ProtectedRoute>
            } />

            {/* Sales - Accessible by admin and manager */}
            <Route path="/sales" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Sales />
              </ProtectedRoute>
            } />

            {/* Purchase Orders - Admin only */}
            <Route path="/purchase-orders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PurchaseOrders />
              </ProtectedRoute>
            } />

            {/* Stock Alerts - Accessible by all authenticated users */}
            <Route path="/stock-alerts" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'staff']}>
                <StockAlerts />
              </ProtectedRoute>
            } />

            {/* Ledger - Admin and manager only */}
            <Route path="/ledger" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Ledger />
              </ProtectedRoute>
            } />

            {/* User Management - Admin only */}
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;