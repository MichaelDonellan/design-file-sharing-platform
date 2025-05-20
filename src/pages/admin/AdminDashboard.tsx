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

  const handleAdminAction = (id: number, action: 'promote' | 'demote') => {
    // Implement admin management logic here
    console.log(`Handling ${action} for admin ${id}`);
  };

  if (!isAdmin) {
    navigate('/');
    return null;
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
