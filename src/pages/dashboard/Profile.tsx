import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Store, Upload, User, X } from 'lucide-react';
import type { Store as StoreType } from '../../types';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      // Fetch store data
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStore(storeData);

      // Fetch user profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profileData?.avatar_url) {
        setProfileImage(profileData.avatar_url);
      }
    }

    fetchData();
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!user || !profileImageFile) return;

    try {
      setLoading(true);

      // Upload image to Supabase Storage
      const fileExt = profileImageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, profileImageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error('Failed to update profile image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>
              {profileImageFile && (
                <button
                  onClick={() => {
                    setProfileImageFile(null);
                    setProfileImage(null);
                  }}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <label className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md cursor-pointer hover:bg-blue-600">
                <Upload className="w-5 h-5 mr-2" />
                <span>Upload Profile Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {profileImageFile && (
                <button
                  onClick={handleImageUpload}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Save Image'}
                </button>
              )}
              <p className="text-sm text-gray-500">
                Max file size: 5MB. Supported formats: JPG, PNG, GIF
              </p>
            </div>
          </div>

          {/* Email Section */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user?.email}</div>
          </div>

          {/* Store Section */}
          {store && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-2">Your Store</h2>
              <Link
                to={`/store/${store.name}`}
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Store size={20} />
                <span>{store.name}</span>
              </Link>
            </div>
          )}

          {!store && (
            <div className="border-t pt-6">
              <Link
                to="/dashboard/store"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Store size={20} className="mr-2" />
                Create Store
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}