import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signUp(email, password);
      navigate('/');
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Create Account</h1>
      
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
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <UserPlus size={20} />
          <span>{loading ? 'Creating account...' : 'Create Account'}</span>
        </button>
      </form>
    </div>
  );
}