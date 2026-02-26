import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandProvider } from './contexts/BrandContext';

// Pages
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SetupPage from './pages/SetupPage';
import DashboardPage from './pages/DashboardPage';
import CalendarPage from './pages/CalendarPage';
import AppointmentsPage from './pages/AppointmentsPage';
import AppointmentDetailPage from './pages/AppointmentDetailPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import CasesPage from './pages/CasesPage';
import CaseDetailPage from './pages/CaseDetailPage';
import TemplatesPage from './pages/TemplatesPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import BrandSettingsPage from './pages/BrandSettingsPage';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-[#D4AF37]">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/portal/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/book" replace />} />
      <Route path="/book" element={<BookingPage />} />
      
      {/* Auth routes */}
      <Route path="/portal/login" element={<LoginPage />} />
      <Route path="/portal/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/portal/reset-password" element={<ResetPasswordPage />} />
      <Route path="/portal/setup" element={<SetupPage />} />
      
      {/* Protected portal routes */}
      <Route path="/portal" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/portal/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:id" element={<CaseDetailPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="staff" element={
          <ProtectedRoute adminOnly>
            <StaffPage />
          </ProtectedRoute>
        } />
        <Route path="settings" element={
          <ProtectedRoute adminOnly>
            <SettingsPage />
          </ProtectedRoute>
        } />
        <Route path="brand" element={
          <ProtectedRoute adminOnly>
            <BrandSettingsPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/book" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrandProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </AuthProvider>
      </BrandProvider>
    </LanguageProvider>
  );
}

export default App;
