import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { AuthProvider, useAuth } from "./state/auth.jsx"
import AppLayout from "./components/AppLayout.jsx"
import Login from "./pages/Login.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import NewBill from "./pages/NewBill.jsx"
import Inventory from "./pages/Inventory.jsx"
import BillingHistory from "./pages/BillingHistory.jsx"
import AdminPanel from "./pages/AdminPanel.jsx"

function Protected({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <AppLayout />
              </Protected>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="new-bill" element={<NewBill />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="history" element={<BillingHistory />} />
            <Route path="admin" element={<AdminPanel />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
