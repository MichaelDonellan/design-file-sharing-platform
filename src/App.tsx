import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import DesignDetail from './pages/DesignDetail';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/dashboard/Profile';
import Store from './pages/dashboard/Store';
import Settings from './pages/dashboard/Settings';
import PublicStore from './pages/PublicStore';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import PaymentSuccess from './pages/PaymentSuccess';
import PlusLibrary from './pages/PlusLibrary';
import Categories from './pages/Categories';
import AdminDashboard from './pages/admin/AdminDashboard';
import { Toaster } from 'react-hot-toast';
import RegisterPanel from './components/RegisterPanel';
import { ToastContainer } from 'react-toastify';
import Files from './pages/Files';
import FileDetails from './pages/FileDetails';
import EditFile from './pages/EditFile';
import RejectFile from './pages/RejectFile';
import ApproveFile from './pages/ApproveFile';

function App() {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  return (
    <AuthProvider>
      <div>
        <BrowserRouter>
          <Toaster position="top-right" />
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <nav className="bg-white shadow-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <h1 className="text-xl font-bold text-gray-900">Design File Sharing Platform</h1>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/files" element={<Files />} />
                <Route path="/files/:id" element={<FileDetails />} />
                <Route path="/files/:id/edit" element={<EditFile />} />
                <Route path="/files/:id/reject" element={<RejectFile />} />
                <Route path="/files/:id/approve" element={<ApproveFile />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/design/:id" element={<DesignDetail />} />
                <Route path="/store/:storeName" element={<PublicStore />} />
                <Route
                  path="/upload"
                  element={
                    <PrivateRoute>
                      <Upload />
                    </PrivateRoute>
                  }
                />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
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
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/plus-library" element={<PlusLibrary />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
        <ToastContainer position="top-right" />
        <RegisterPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      </div>
    </AuthProvider>
  );
}

export default App;
      <BrowserRouter>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-xl font-bold text-gray-900">Design File Sharing Platform</h1>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          </nav>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/admin"
                element={isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />}
              />
              <Route path="/files" element={<Files />} />
              <Route path="/files/:id" element={<FileDetails />} />
              <Route path="/files/:id/edit" element={<EditFile />} />
              <Route path="/files/:id/reject" element={<RejectFile />} />
              <Route path="/files/:id/approve" element={<ApproveFile />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/design/:id" element={<DesignDetail />} />
              <Route path="/store/:storeName" element={<PublicStore />} />
              <Route
                path="/upload"
                element={
                  <PrivateRoute>
                    <Upload />
                  </PrivateRoute>
                }
              />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
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
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/plus-library" element={<PlusLibrary />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
      <ToastContainer position="top-right" />
      <RegisterPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </AuthProvider>
  );
}

export default App;