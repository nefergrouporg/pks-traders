import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./pages/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ProductManagement from "./pages/ProductManagement";
import POSInterface from "./pages/POSInterface";
import UserManagement from "./pages/UserManagement";
import { AuthProvider } from './context/AuthContext';
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import Unauthorized from "./pages/Unauthorized";
import SalesList from "./pages/Sales";
import Suppliers from "./pages/Suppliers";
import Employees from "./pages/Employees";
import StockEntryManagement from "./pages/StockEntry";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Dashboard />
                </RoleProtectedRoute>
              } />
              <Route path="products" element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <ProductManagement />
                </RoleProtectedRoute>
              } />
              <Route path="pos" element={
                <RoleProtectedRoute allowedRoles={['staff', 'admin', 'manager']}>
                  <POSInterface />
                </RoleProtectedRoute>
              } />
              <Route path="suppliers" element={
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Suppliers />
                </RoleProtectedRoute>
              } />
              <Route path="employees" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Employees />
                </RoleProtectedRoute>
              } />
              <Route path="users" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <UserManagement />
                </RoleProtectedRoute>
              } />
              <Route path="stockEntry" element={
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <StockEntryManagement />
                </RoleProtectedRoute>
              } />
              <Route path="sales" element={
                <RoleProtectedRoute allowedRoles={['staff', 'admin', 'manager']}>
                  <SalesList />
                </RoleProtectedRoute>
              } />
            </Route>
          </Route>
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};


export default App;