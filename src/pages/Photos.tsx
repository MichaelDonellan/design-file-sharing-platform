import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design } from '../types';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Photos() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [mockups, setMockups] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDesigns() {
      setLoading(true);
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('category', 'Photos')
        .order('created_at', { ascending: false });
      if (!isMounted) return;
      if (error) return setDesigns([]);
      setDesigns(data || []);
      if (data && data.length > 0) {
        const { data: mockupsData } = await supabase
          .from('design_mockups')
          .select('design_id, mockup_path')
          .in('design_id', data.map(d => d.id));
        if (mockupsData) {
          const mockupMap: Record<string, string> = {};
          mockupsData.forEach(mockup => {
            const { data: pub } = supabase.storage.from('designs').getPublicUrl(mockup.mockup_path);
            mockupMap[mockup.design_id] = pub.publicUrl;
          });
          setMockups(mockupMap);
        }
      }
      setLoading(false);
    }
    fetchDesigns();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">Photos</h2>
        </div>
        {designs.length === 0 ? (
          <div className="text-center text-gray-500 py-12 text-lg">No results</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map(design => (
              <Link
                key={design.id}
                to={`/design/${design.id}`}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={mockups[design.id] || '/placeholder.png'}
                    alt={design.name}
                    className="w-full h-48 object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {format(new Date(design.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Download size={16} className="mr-1" />
                      {design.downloads}
                    </div>
                  </div>
                  {design.price && design.price > 0 ? (
                    <div className="mt-2 text-sm font-medium text-green-600">
                      ${design.price.toFixed(2)}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm font-medium text-blue-600">Free</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
