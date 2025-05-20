import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

interface AdminEmail {
  id: number;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAdmin, signOut } = useAuth();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Add agrinolan@gmail.com as admin if not already present
    const addAgrinolan = async () => {
      try {
        const { data: existingAdmin, error: existingError } = await supabase
          .from('admin_emails')
          .select('id')
          .eq('email', 'agrinolan@gmail.com')
          .single();

        if (existingError && existingError.code === 'PGRST116') {
          // If admin doesn't exist, add them
          const { error: insertError } = await supabase
            .from('admin_emails')
            .insert([{ email: 'agrinolan@gmail.com' }]);

          if (insertError) throw insertError;
          toast.success('Added agrinolan@gmail.com as admin');
        }
      } catch (error) {
        console.error('Error adding agrinolan as admin:', error);
        toast.error('Failed to add agrinolan as admin');
      }
    };

    addAgrinolan();
    fetchAdminEmails();
  }, []);

  const fetchAdminEmails = async () => {
    try {
      setLoading(true);
      const { data: admins, error: error } = await supabase
        .from('admin_emails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAdminEmails(admins || []);
    } catch (error) {
      console.error('Error fetching admin emails:', error);
      toast.error('Failed to fetch admin emails');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('admin_emails')
        .insert([{ email: newAdminEmail }]);

      if (error) throw error;

      toast.success('Admin email added successfully');
      setNewAdminEmail('');
      fetchAdminEmails();
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
      fetchAdminEmails();
    } catch (error) {
      console.error('Error removing admin email:', error);
      toast.error('Failed to remove admin email');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div className="text-center py-8">You must be an admin to access this page</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Management</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
          <div className="flex gap-2">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="Enter admin email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleAddAdmin}
              disabled={loading || !newAdminEmail}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Active Admins</h2>
          {loading ? (
            <div className="flex justify-center py-4">
              <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {adminEmails.length === 0 ? (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Active Admins</h2>
                  <div className="space-y-4">
                    {adminEmails.map((admin) => (
                      <div
                        key={admin.id}
                        className="bg-white p-4 rounded-lg shadow"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{admin.email}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Active Admins</h2>
                  <div className="space-y-4">
                    {adminEmails.map((admin) => (
                      <div
                        key={admin.id}
                        className="bg-white p-4 rounded-lg shadow"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{admin.email}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveAdmin(admin.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
