import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface UserProfileData {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user) {
        // Fetch user profile details from your 'profiles' table if needed
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, avatar_url')
          .eq('id', user.id)
          .single();
        setUser(profile || { id: user.id, email: user.email });
      }
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return <div className="text-center mt-10">No user found.</div>;

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-gray-300">
        <img
          src={user.avatar_url || '/default-avatar.png'}
          alt="User Avatar"
          className="object-cover w-full h-full"
        />
      </div>
      <div className="text-2xl font-semibold mb-2">{user.full_name || 'No Name Provided'}</div>
      <div className="text-gray-600 mb-1">{user.email}</div>
      {/* Add more user details here if available */}
    </div>
  );
};

export default UserProfile;
