import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import LoginPage from './auth/LoginPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductListPage from './pages/products/ProductListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import VendorListPage from './pages/vendors/VendorListPage';
import VendorFormPage from './pages/vendors/VendorFormPage';
import WarehouseListPage from './pages/warehouse/WarehouseListPage';
import WarehouseFormPage from './pages/warehouse/WarehouseFormPage';
import PurchaseOrderListPage from './pages/purchasing/PurchaseOrderListPage';
import PurchaseOrderFormPage from './pages/purchasing/PurchaseOrderFormPage';
import GoodsReceiptPage from './pages/purchasing/GoodsReceiptPage';
import StockLevelsPage from './pages/inventory/StockLevelsPage';
import ReorderAlertsPage from './pages/inventory/ReorderAlertsPage';
import StockAdjustmentPage from './pages/inventory/StockAdjustmentPage';
import StockMovementPage from './pages/inventory/StockMovementPage';
import ReportsPage from './pages/reports/ReportsPage';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/products/new" element={<ProductFormPage />} />
                <Route path="/products/:id/edit" element={<ProductFormPage />} />
                <Route path="/vendors" element={<VendorListPage />} />
                <Route path="/vendors/new" element={<VendorFormPage />} />
                <Route path="/vendors/:id/edit" element={<VendorFormPage />} />
                <Route path="/warehouses" element={<WarehouseListPage />} />
                <Route path="/warehouses/new" element={<WarehouseFormPage />} />
                <Route path="/warehouses/:id/edit" element={<WarehouseFormPage />} />
                <Route path="/purchase-orders" element={<PurchaseOrderListPage />} />
                <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
                <Route path="/purchase-orders/:id" element={<PurchaseOrderFormPage />} />
                <Route path="/goods-receipts" element={<GoodsReceiptPage />} />
                <Route path="/inventory/stock" element={<StockLevelsPage />} />
                <Route path="/inventory/alerts" element={<ReorderAlertsPage />} />
                <Route path="/inventory/adjustments" element={<StockAdjustmentPage />} />
                <Route path="/inventory/movements" element={<StockMovementPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        </ErrorBoundary>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
