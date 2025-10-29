import React, { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { setupAdminAccount } from "./utils/setupAdmin";
import { initEmailService } from "./utils/emailService";
import AddWeeklyPerformance from "./pages/AddWeeklyPerfoma";

// Lazy-loaded components
const Login = lazy(() => import("./pages/Login"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HodDashboard = lazy(() => import("./pages/HodDashboard"));
const PortRegistration = lazy(() => import("./pages/PortRegistration"));
const HodRegistration = lazy(() => import("./pages/HodRegistration"));
const PortDashboard = lazy(() => import("./pages/PortDashboard"));
const PortDetailsView = lazy(() => import("./pages/PortDetailsView"));
const PortProfile = lazy(() => import("./pages/PortProfile"));
const WeeklyPerformance = lazy(() => import("./pages/WeeklyPerformance"));
const AddVessel = lazy(() => import("./pages/AddVessel"));
const ManageCargoTypes = lazy(() => import("./pages/ManageCargoTypes"));
const VesselList = lazy(() => import("./pages/VesselList"));
const VesselDetails = lazy(() => import("./pages/VesselDetails"));
const Revenue = lazy(() => import("./pages/Revenue"));
const CargoHandled = lazy(() => import("./pages/CargoHandled"));
const VesselsPage = lazy(() => import("./pages/VesselsPage"));
const WeeklyPage = lazy(() => import("./pages/WeeklyPage"));

function App() {
  useEffect(() => {
    initEmailService();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Suspense
          fallback={
            <LoadingSpinner fullScreen message="Loading application..." />
          }
        >
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/port-registration/:portId"
              element={<PortRegistration />}
            />
            <Route
              path="/hod-registration/:hodId"
              element={<HodRegistration />}
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/vessels"
              element={
                <ProtectedRoute requiredRole="admin">
                  <VesselsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/weekly"
              element={
                <ProtectedRoute requiredRole="admin">
                  <WeeklyPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/manage-cargo-types"
              element={
                <ProtectedRoute requiredRole="admin">
                  <ManageCargoTypes />
                </ProtectedRoute>
              }
            />

            {/* HOD Routes */}
            <Route
              path="/hod-dashboard"
              element={
                <ProtectedRoute requiredRole="hod">
                  <HodDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hod/vessels"
              element={
                <ProtectedRoute requiredRole="hod">
                  <VesselsPage />
                </ProtectedRoute>
              }
            />

            {/* Port Routes */}
            <Route
              path="/port-dashboard"
              element={
                <ProtectedRoute requiredRole="port">
                  <PortDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/weekly-performance"
              element={
                <ProtectedRoute requiredRole="port">
                  <WeeklyPerformance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/port-profile"
              element={
                <ProtectedRoute requiredRole="port">
                  <PortProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-vessel"
              element={
                <ProtectedRoute requiredRole="port">
                  <AddVessel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-weekly-performance"
              element={
                <ProtectedRoute requiredRole="port">
                  <AddWeeklyPerformance />
                </ProtectedRoute>
              }
            />

            {/* Shared Routes with Role-Based Access Control */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/port-details/:portId"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <PortDetailsView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vessel-list/:portId"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod", "port"]}>
                  <VesselList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vessel-details/:vesselId"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod", "port"]}>
                  <VesselDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/revenue"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <Revenue />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cargo-handled"
              element={
                <ProtectedRoute allowedRoles={["admin", "hod"]}>
                  <CargoHandled />
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </AuthProvider>
    </Router>
  );
}

export default App;
