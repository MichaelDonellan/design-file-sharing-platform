import React from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const FileDetails: React.FC = () => {
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
        <h1 className="text-2xl font-bold mb-6">{file.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">File Details</h2>
            <div className="space-y-4">
              <div>
                <span className="font-medium">Category:</span> {file.category}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`px-2 py-1 rounded-full text-sm ${
                  file.status === 'approved' ? 'bg-green-100 text-green-800' :
                  file.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="font-medium">Uploaded:</span> {new Date(file.created_at).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Description:</span> {file.description}
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4">File Preview</h2>
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-gray-500">File preview will be shown here</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetails;
