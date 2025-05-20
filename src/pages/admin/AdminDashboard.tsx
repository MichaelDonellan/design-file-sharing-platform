import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  UserCog,
  UserPlus,
  UserCheck,
  UserMinus,
  ListChecks,
  Settings,
  LogOut,
} from 'lucide-react';

export default function AdminDashboard() {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [pendingListings, setPendingListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchPendingListings = async () => {
      try {
        const { data, error } = await supabase
          .from('designs')
          .select('*, stores(name), users(email)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPendingListings(data || []);
      } catch (error) {
        console.error('Error fetching pending listings:', error);
        toast.error('Failed to load pending listings');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingListings();
  }, []);

  // Mock data - replace with actual API calls
  const pendingApprovals = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      status: 'pending',
      date: '2025-05-20',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'pending',
      date: '2025-05-19',
    },
  ];

  const adminUsers = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      status: 'active',
    },
  ];

  const handleApproval = (id: number, action: 'approve' | 'reject') => {
    // Implement approval logic here
    console.log(`Handling ${action} for user ${id}`);
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
    navigate('/');
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Approvals */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
                <ListChecks className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-4">
                {pendingApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{approval.name}</p>
                      <p className="text-sm text-gray-500">{approval.email}</p>
                      <p className="text-xs text-gray-400">{approval.date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproval(approval.id, 'approve')}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleApproval(approval.id, 'reject')}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Management */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Admin Management</h2>
                <button
                  onClick={() => navigate('/register')}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Admin
                </button>
              </div>
              <div className="space-y-4">
                {adminUsers.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{admin.name}</p>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                      <p className="text-xs text-gray-400">{admin.role}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAdminAction(admin.id, 'demote')}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAdminAction(admin.id, 'promote')}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
