import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import './App.css';
import Dockbar from './components/Dockbar';
import LoadingCloud from './components/LoadingCloud';

// Lazy Loading Pages
const Home = lazy(() => import('./pages/Home'));
const Bookings = lazy(() => import('./pages/Bookings'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const Account = lazy(() => import('./pages/Account'));
const Login = lazy(() => import('./pages/Login'));

// Protected Route Component
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Login />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <Router>
          <main className="app-main">
            <Suspense fallback={<LoadingCloud message="Clearing for takeoff..." />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/bookings" element={
                  <ProtectedRoute>
                    <Bookings />
                  </ProtectedRoute>
                } />
                <Route path="/booking/:id" element={
                  <ProtectedRoute>
                    <BookingDetail />
                  </ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                } />
              </Routes>
            </Suspense>
          </main>

          <Dockbar />
        </Router>
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;
