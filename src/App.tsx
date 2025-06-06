import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Home from './pages/Home';
import DesignDetail from './pages/DesignDetail';
import DemoDesignDetail from './pages/DemoDesignDetail';
import Upload from './pages/Upload';
import Login from './pages/Login';
// Register page removed - using floating panel instead
import ForgotPassword from './pages/ForgotPassword';
import UserProfile from './pages/user/profile';
import FavouritesPage from './pages/user/favourites';
import UserOrders from './pages/user/orders';
import Profile from './pages/dashboard/Profile';
import Store from './pages/dashboard/Store';
import Settings from './pages/dashboard/Settings';
import SellerDashboard from './pages/dashboard/SellerDashboard';
import EditListing from './pages/dashboard/EditListing';
import PublicStore from './pages/PublicStore';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import PaymentSuccess from './pages/PaymentSuccess';
import PlusLibrary from './pages/PlusLibrary';
import Categories from './pages/Categories';
import POD from './pages/POD';
import Bundles from './pages/Bundles';
import Fonts from './pages/Fonts';
import Images from './pages/Images';
import Crafts from './pages/Crafts';
import Photos from './pages/Photos';
import FreeDownloads from './pages/FreeDownloads';
import AdminDashboard from './pages/admin/AdminDashboard';
import { ToastContainer } from 'react-toastify';
import Files from './pages/Files';
import FileDetails from './pages/FileDetails';
import EditFile from './pages/EditFile';
import RejectFile from './pages/RejectFile';
import ApproveFile from './pages/ApproveFile';
import VerifyEmail from './pages/auth/VerifyEmail';

function App() {
  return (
    <AuthProvider>
      <div>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/demo-design" element={<DemoDesignDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/bundles" element={<Bundles />} />
                <Route path="/pod" element={<POD />} />
                <Route path="/fonts" element={<Fonts />} />
                <Route path="/images" element={<Images />} />
                <Route path="/crafts" element={<Crafts />} />
                <Route path="/photos" element={<Photos />} />
                <Route path="/free-downloads" element={<FreeDownloads />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/plus-library" element={<PlusLibrary />} />
                <Route path="/files" element={<Files />} />
                <Route path="/files/:id" element={<FileDetails />} />
                <Route path="/files/:id/edit" element={<EditFile />} />
                <Route path="/files/:id/reject" element={<RejectFile />} />
                <Route path="/files/:id/approve" element={<ApproveFile />} />
                <Route path="/design/:id" element={<DesignDetail />} />
                <Route
  path="/store"
  element={
    <PrivateRoute>
      <Store />
    </PrivateRoute>
  }
/>
<Route path="/store/:storeName" element={<PublicStore />} />
                <Route path="/auth/verify-email" element={<VerifyEmail />} />
                <Route
                  path="/upload"
                  element={
                    <PrivateRoute>
                      <Upload />
                    </PrivateRoute>
                  }
                />
                {/* Register route removed - using floating panel instead */}
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Private Routes */}
                <Route
                  path="/dashboard/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/store"
                  element={
                    <PrivateRoute>
                      <Store />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/settings"
                  element={
                    <PrivateRoute>
                      <Settings />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/seller"
                  element={
                    <PrivateRoute>
                      <SellerDashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard/edit/:id"
                  element={
                    <PrivateRoute>
                      <EditListing />
                    </PrivateRoute>
                  }
                />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/plus-library" element={<PlusLibrary />} />
                {/* User Routes */}
                <Route path="/user/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
                <Route path="/user/favourites" element={<PrivateRoute><FavouritesPage /></PrivateRoute>} />
                <Route path="/user/orders" element={<PrivateRoute><UserOrders /></PrivateRoute>} />
                {/* Admin Routes */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
        <ToastContainer position={"top-right"} />
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;