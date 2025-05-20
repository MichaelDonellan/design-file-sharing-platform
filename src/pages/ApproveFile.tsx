import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const ApproveFile: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [file, setFile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchFile();
  }, [id]);

  const fetchFile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setFile(data);
    } catch (error) {
      console.error('Error fetching file:', error);
      toast.error('File not found');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('files')
        .update({
          status: 'approved'
        })
        .eq('id', file.id);

      if (error) throw error;
      toast.success('File approved successfully');
      window.location.href = `/files/${file.id}`;
    } catch (error) {
      console.error('Error approving file:', error);
      toast.error('Failed to approve file');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!file) {
    return <div className="text-center py-8">File not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Approve File: {file.name}</h1>
        <div className="space-y-4">
          <div>
            <p className="text-lg font-medium">Are you sure you want to approve this file?</p>
            <p className="mt-2 text-gray-600">This action cannot be undone.</p>
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => window.location.href = `/files/${file.id}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Approving...
                </>
              ) : (
                'Approve File'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApproveFile;
