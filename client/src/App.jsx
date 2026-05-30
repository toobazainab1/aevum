import { Routes, Route } from 'react-router-dom'

import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'

import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/checkout'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSales from './pages/admin/AdminSales'

/* ────────────────────────────────────────────
   PUBLIC LAYOUT
───────────────────────────────────────────── */

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

/* ────────────────────────────────────────────
   APP
───────────────────────────────────────────── */

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>

        {/* AUTO SCROLL TO TOP */}
        <ScrollToTop />

        <Routes>

          {/* ─────────────────────
              PUBLIC ROUTES
          ───────────────────── */}

          <Route
            path="/"
            element={
              <PublicLayout>
                <Home />
              </PublicLayout>
            }
          />

          <Route
            path="/products"
            element={
              <PublicLayout>
                <Products />
              </PublicLayout>
            }
          />

          <Route
            path="/products/:id"
            element={
              <PublicLayout>
                <ProductDetail />
              </PublicLayout>
            }
          />

          <Route
            path="/cart"
            element={
              <PublicLayout>
                <Cart />
              </PublicLayout>
            }
          />

          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />

          {/* ─────────────────────
              AUTH ROUTES
          ───────────────────── */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* ─────────────────────
              CHECKOUT
          ───────────────────── */}

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          {/* ─────────────────────
              ADMIN ROUTES
          ───────────────────── */}

          <Route path="/admin" element={<AdminLayout />}>

            <Route
              index
              element={<AdminDashboard />}
            />

            <Route
              path="products"
              element={<AdminProducts />}
            />

            <Route
              path="orders"
              element={<AdminOrders />}
            />

            <Route
              path="sales"
              element={<AdminSales />}
            />

            <Route
              path="users"
              element={<AdminUsers />}
            />

          </Route>

        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}