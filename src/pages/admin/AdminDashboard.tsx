import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { UserMinus, LogOut } from 'lucide-react';

interface AdminEmail {
  id: number;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAdmin, signOut } = useAuth();
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing database connection...');
        const { data, error } = await supabase
          .from('admin_emails')
          .select('*')
          .limit(1);

        console.log('Test connection result:', { error, data });
        
        if (error) {
          console.error('Database connection error:', error);
          toast.error('Database connection failed. Please check the table exists.');
        } else {
          console.log('Database connection successful!');
        }
      } catch (error) {
        console.error('Error testing connection:', error);
        toast.error('Failed to connect to database');
      }
    };

    testConnection();
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      console.log('Attempting to add admin:', { email: newAdminEmail.toLowerCase() });
      const { error, data } = await supabase
        .from('admin_emails')
        .insert({
          email: newAdminEmail.toLowerCase(),
          created_at: new Date().toISOString()
        });

      console.log('Database response:', { error, data });
      
      if (error) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to add admin email');
        return;
      }

      toast.success('Admin email added successfully');
      setNewAdminEmail('');
      
      // Refresh admin emails
      const { data: refreshData, error: refreshError } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Refresh response:', { refreshError, refreshData });
      
      if (refreshError) {
        console.error('Refresh error:', refreshError);
        toast.error('Failed to refresh admin emails');
        return;
      }

      setAdminEmails(refreshData || []);
    } catch (error) {
      console.error('Error adding admin email:', error);
      toast.error('Failed to add admin email');
    }
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this admin email?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_emails')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Admin email removed successfully');
      
      // Refresh admin emails
      const { data, error: refreshError } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (refreshError) throw refreshError;
      setAdminEmails(data || []);
    } catch (error) {
      console.error('Error removing admin email:', error);
      toast.error('Failed to remove admin email');
    }
  };

  if (!isAdmin) {
    window.location.href = '/';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <button
              onClick={signOut}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <LogOut className="h-4 w-4 inline-block mr-2" />
              Sign Out
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Admin Management</h2>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <div className="flex items-center mb-4">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="Enter admin email..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddAdmin}
                      className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Add Admin
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[400px]">
                    {adminEmails.map((emailObj) => (
                      <div
                        key={emailObj.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-2"
                      >
                        <div>
                          <p className="font-medium">{emailObj.email}</p>
                          <p className="text-xs text-gray-400">
                            Added {new Date(emailObj.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveAdmin(emailObj.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
