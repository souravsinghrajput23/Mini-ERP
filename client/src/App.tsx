import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { CustomerList } from './pages/customers/CustomerList';
import { Customer360 } from './pages/customers/Customer360';
import { FollowUpBoard } from './pages/followups/FollowUpBoard';
import { ProductCatalog } from './pages/inventory/ProductCatalog';
import { StockLedger } from './pages/stock/StockLedger';
import { ChallanList } from './pages/challans/ChallanList';
import { ChallanCreate } from './pages/challans/ChallanCreate';
import { ChallanDetail } from './pages/challans/ChallanDetail';
import { AuditLogPage } from './pages/audit/AuditLogPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { Role } from './types';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Role[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Dashboard & Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* CRM & Customer 360 */}
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <CustomerList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <Customer360 />
              </ProtectedRoute>
            }
          />

          {/* Follow-ups */}
          <Route
            path="/followups"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                <FollowUpBoard />
              </ProtectedRoute>
            }
          />

          {/* Product Catalog & Inventory Health */}
          <Route path="/inventory" element={<ProductCatalog />} />

          {/* Stock Movements */}
          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE', 'ACCOUNTS']}>
                <StockLedger />
              </ProtectedRoute>
            }
          />

          {/* Sales Challans */}
          <Route
            path="/challans"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                <ChallanList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/create"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                <ChallanCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challans/:id"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']}>
                <ChallanDetail />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
