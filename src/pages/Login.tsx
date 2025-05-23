import React, { useState } from 'react';
import AuthPanel from '../components/AuthPanel';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      // Auto-detect currency after login
      fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
          const countryToCurrency: Record<string, string> = {
            US: 'USD',
            GB: 'GBP',
            AU: 'AUD',
            CA: 'CAD',
            EU: 'EUR',
            FR: 'EUR',
            DE: 'EUR',
            IT: 'EUR',
            ES: 'EUR',
            NL: 'EUR',
            BE: 'EUR',
            AT: 'EUR',
            IE: 'EUR',
            PT: 'EUR',
            FI: 'EUR',
            GR: 'EUR',
            // Add more as needed
          };
          if (data.country && countryToCurrency[data.country]) {
            localStorage.setItem('preferredCurrency', countryToCurrency[data.country]);
          }
        })
        .catch(() => {});
      navigate('/');
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Login</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-600">
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <LogIn size={20} />
          <span>{loading ? 'Signing in...' : 'Sign In'}</span>
        </button>

        <div className="mt-4 text-center text-gray-600">
          Don't have an account yet?{' '}
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Register
          </button>
        </div>
      </form>
      {/* Floating Register Panel */}
      <AuthPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} mode="register" />
    </div>
  );
}