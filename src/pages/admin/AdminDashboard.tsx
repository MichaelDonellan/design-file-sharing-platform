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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_emails')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAdminEmails(data || []);
      } catch (error) {
        console.error('Error fetching admin emails:', error);
        toast.error('Failed to load admin emails');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminEmails();
  }, []);





  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('admin_emails')
        .insert({
          email: newAdminEmail.toLowerCase(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Admin email added successfully');
      setNewAdminEmail('');
      
      // Refresh admin emails
      const { data, error: refreshError } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (refreshError) throw refreshError;
      setAdminEmails(data || []);
    } catch (error) {
      console.error('Error adding admin email:', error);
      toast.error('Failed to add admin email');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this admin email?')) {
      return;
    }

    try {
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    window.location.href = '/';
    return null;
  }

  // Rejection modal
  if (rejectModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Reject Listing</h3>
            <button
              onClick={() => setRejectModalOpen(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide a reason for rejecting this listing..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setRejectModalOpen(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleApproval(rejectModalOpen.id, 'reject')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Reject Listing
            </button>
          </div>
        </div>
      </div>
    );
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
  </div>
);
