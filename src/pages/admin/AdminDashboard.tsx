import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Plus, Trash2 } from 'lucide-react';

interface AdminEmail {
  id: number;
  email: string;
  created_at: string;
}

interface PendingUpload {
  id: string;
  name: string;
  description: string | null;
  file_type: 'image' | 'font' | 'template';
  category: 'Templates' | 'Fonts' | 'Logos' | 'Icons' | 'UI Kits';
  user_id: string;
  created_at: string;
  files: {
    id: string;
    file_path: string;
    file_type: 'image' | 'font' | 'template';
  }[];
  mockups: {
    id: string;
    mockup_path: string;
  }[];
}

export default function AdminDashboard() {
  const { isAdmin, signOut } = useAuth();
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingUploads = async () => {
    try {
      setLoading(true);
      const { data: designs, error: designError } = await supabase
        .from('designs')
        .select('*')
        .eq('store_id', null)
        .order('created_at', { ascending: false });

      if (designError) throw designError;

      const pendingUploads: PendingUpload[] = [];

      for (const design of designs || []) {
        const { data: files, error: fileError } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', design.id);

        if (fileError) throw fileError;

        const { data: mockups, error: mockupError } = await supabase
          .from('design_mockups')
          .select('*')
          .eq('design_id', design.id);

        if (mockupError) throw mockupError;

        pendingUploads.push({
          ...design,
          files: files || [],
          mockups: mockups || [],
        });
      }

      setPendingUploads(pendingUploads);
    } catch (error) {
      console.error('Error fetching pending uploads:', error);
      toast.error('Failed to fetch pending uploads');
    } finally {
      setLoading(false);
    }
  };

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

  const handleApproveUpload = async (id: string) => {
    try {
      setLoading(true);
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (storeError) throw storeError;

      const { error: updateError } = await supabase
        .from('designs')
        .update({ store_id: store.id })
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Upload approved successfully');
      fetchPendingUploads();
    } catch (error) {
      console.error('Error approving upload:', error);
      toast.error('Failed to approve upload');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUpload = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this upload?')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Upload rejected successfully');
      fetchPendingUploads();
    } catch (error) {
      console.error('Error rejecting upload:', error);
      toast.error('Failed to reject upload');
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

  useEffect(() => {
    // Add agrinolan@gmail.com as admin if not already present
    (async () => {
      try {
        const { data: existingAdmin, error: existingError } = await supabase
          .from('admin_emails')
          .select('id')
          .eq('email', 'agrinolan@gmail.com')
          .single();

        if (existingError && existingError.code === 'PGRST116') {
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
    })();

    fetchAdminEmails();
    fetchPendingUploads();
  }, [fetchAdminEmails, fetchPendingUploads]);

  if (!isAdmin) {
    return <div className="text-center py-8">You must be an admin to access this page</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">