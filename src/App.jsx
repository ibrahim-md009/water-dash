import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import AddMinutes from './pages/AddMinutes';
import Requests from './pages/Requests';
import Confirmed from './pages/Confirmed';
import Statistics from './pages/Statistics';
import PaymentSettings from './pages/PaymentSettings';
import { APP_NAME, APP_TAGLINE } from './config/app';

export default function App() {
  useEffect(() => {
    document.title = `${APP_NAME} | ${APP_TAGLINE}`;
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<Overview />} />
                  <Route path="add-minutes" element={<AddMinutes />} />
                  <Route path="requests" element={<Requests />} />
                  <Route path="confirmed" element={<Confirmed />} />
                  <Route path="statistics" element={<Statistics />} />
                  <Route path="payment-settings" element={<PaymentSettings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
