import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import ChatWidget from './components/ChatWidget';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';
import { STRIPE_PUBLISHABLE_KEY } from './config/stripeConfig';

// Initialize Stripe
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
        <Elements stripe={stripePromise}>
        <Router>
          <Toaster 
            position="top-center"
            containerStyle={{
              top: 20,
              zIndex: 9999,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: '#1f2937',
                padding: '16px 20px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                fontSize: '15px',
                fontWeight: '500',
                maxWidth: '420px',
                margin: '0 auto',
              },
              success: {
                duration: 2000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(16, 185, 129, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 10px 10px -5px rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '15px',
                  fontWeight: '500',
                  maxWidth: '420px',
                  margin: '0 auto',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(239, 68, 68, 0.95)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: '#fff',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.3), 0 10px 10px -5px rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontSize: '15px',
                  fontWeight: '500',
                  maxWidth: '420px',
                  margin: '0 auto',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrderHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatWidget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            {/* Catch-all route for 404 handling */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        </Elements>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

// Sprint 2 update
