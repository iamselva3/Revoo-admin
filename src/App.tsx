import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { RequestsListPage } from './pages/requests/RequestsListPage';
import { RequestDetailPage } from './pages/requests/RequestDetailPage';
import { ModelsPage } from './pages/catalogue/ModelsPage';
import { BrandsPage } from './pages/catalogue/BrandsPage';
import { PricingPage } from './pages/pricing/PricingPage';
import { BannersPage } from './pages/marketing/BannersPage';
import { PopupsPage } from './pages/marketing/PopupsPage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { EnquiriesPage } from './pages/enquiries/EnquiriesPage';
import { AuditLogsPage } from './pages/dashboard/AuditLogsPage';
import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-revoo-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="requests" element={<RequestsListPage />} />
        <Route path="requests/:id" element={<RequestDetailPage />} />
        <Route path="catalogue" element={<ModelsPage />} />
        <Route path="catalogue/brands" element={<BrandsPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="banners" element={<BannersPage />} />
        <Route path="popups" element={<PopupsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="enquiries" element={<EnquiriesPage />} />
        <Route path="audits" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

