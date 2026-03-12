import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const RegisterVendor = lazy(() => import('./pages/RegisterVendor'));
const RegisterSupplier = lazy(() => import('./pages/RegisterSupplier'));
const VendorDashboard = lazy(() => import('./pages/VendorDashboard'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
      <p className="mt-4 text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

// 404 Page
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
    <div className="text-center animate-fade-in-up">
      <p className="text-8xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
        404
      </p>
      <h2 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h2>
      <p className="mt-2 text-gray-500">The page you're looking for doesn't exist or has been moved.</p>
      <a
        href="/"
        className="inline-flex items-center mt-6 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-300/50"
      >
        Go Home
      </a>
    </div>
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/prices" element={<Inventory />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register/vendor" element={<RegisterVendor />} />
            <Route path="/register/supplier" element={<RegisterSupplier />} />
            <Route path="/dashboard/vendor" element={<VendorDashboard />} />
            <Route path="/dashboard/supplier" element={<SupplierDashboard />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
