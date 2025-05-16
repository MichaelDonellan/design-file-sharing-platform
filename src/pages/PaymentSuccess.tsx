import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<{ file_path: string; file_type: string }[]>([]);

  useEffect(() => {
    async function verifyPayment() {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        // Verify the payment with our backend
        const { data: purchase, error } = await supabase
          .from('purchases')
          .select('*, designs(*)')
          .eq('stripe_session_id', sessionId)
          .single();

        if (error || !purchase) {
          throw new Error('Purchase not found');
        }

        // Get the design files
        const { data: designFiles } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', purchase.design_id)
          .order('display_order');

        if (designFiles) {
          setFiles(designFiles);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        toast.error('Failed to verify payment');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [searchParams, navigate]);

  const handleDownload = async (filePath: string) => {
    try {
      const { data: fileData } = await supabase.storage
        .from('designs')
        .download(filePath);

      if (fileData) {
        const url = URL.createObjectURL(fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'design';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Verifying payment...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">
          Thank you for your purchase. You can now download your files below.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Files</h2>
        <div className="space-y-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {file.file_path.split('/').pop()}
                </p>
                <p className="text-sm text-gray-500">
                  {file.file_type.toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => handleDownload(file.file_path)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
} 