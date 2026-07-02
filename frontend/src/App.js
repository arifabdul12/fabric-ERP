import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Bills from "@/pages/Bills";
import NewBill from "@/pages/NewBill";
import ViewBill from "@/pages/ViewBill";
import Purchases from "@/pages/Purchases";
import NewPurchase from "@/pages/NewPurchase";
import Returns from "@/pages/Returns";
import NewReturn from "@/pages/NewReturn";
import Customers from "@/pages/Customers";
import CustomerLedger from "@/pages/CustomerLedger";
import Reports from "@/pages/Reports";

function Protected({ children }) {
  const { user } = useAuth();
  if (user === undefined) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protected><Layout /></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/bills/new" element={<NewBill />} />
            <Route path="/bills/:id" element={<ViewBill />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/purchases/new" element={<NewPurchase />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/returns/new" element={<NewReturn />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:name" element={<CustomerLedger />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
