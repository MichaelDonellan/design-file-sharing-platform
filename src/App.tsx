import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
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
              <Route path="/login" element={<Login />} />
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
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;