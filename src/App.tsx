// @ts-nocheck
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

import UserDashboard from './pages/user/UserDashboard';
import SearchWorkers from './pages/user/SearchWorkers';
import BookingForm from './pages/user/BookingForm';
import BookingHistory from './pages/user/BookingHistory';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import PendingRequests from './pages/worker/PendingRequests';
import WorkHistory from './pages/worker/WorkHistory';
import Earnings from './pages/worker/Earnings';
import LeaveRequests from './pages/worker/LeaveRequests';

import AdminDashboard from './pages/admin/AdminDashboard';
import VerifyWorkers from './pages/admin/VerifyWorkers';
import ManageUsers from './pages/admin/ManageUsers';
import AllBookings from './pages/admin/AllBookings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/search"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <SearchWorkers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/book/:workerId"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookingForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user/history"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BookingHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/worker"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/requests"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <PendingRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/history"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <WorkHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/earnings"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <Earnings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/leave"
              element={
                <ProtectedRoute allowedRoles={['worker']}>
                  <LeaveRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verify-workers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <VerifyWorkers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/manage-users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AllBookings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
