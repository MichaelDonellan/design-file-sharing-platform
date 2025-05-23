import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';
import type { Design } from '../../../shared/types/design';

interface UseDesignsResult {
  designs: Record<string, Design[]>;
  designMockups: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDesigns(): UseDesignsResult {
  const [designs, setDesigns] = useState<Record<string, Design[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designMockups, setDesignMockups] = useState<Record<string, string>>({});

  const fetchDesigns = async () => {
    let isMounted = true;
    try {
      setLoading(true);
      setError(null);

      const { data: designsData, error: supabaseError } = await supabase
        .from('designs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isMounted) return;

      if (supabaseError) {
        throw supabaseError;
      }

      if (designsData) {
        const designsByCategory = designsData.reduce((acc, design) => {
          const category = design.is_freebie ? 'Freebies' : design.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(design);
          return acc;
        }, {} as Record<string, Design[]>);

        // Ensure all categories exist in the structure
        const CATEGORIES = { // Will be imported from types later
          'UI Kits': 'UI Kits',
          'Icons': 'Icons',
          'Illustrations': 'Illustrations',
          'Mockups': 'Mockups', 
          'Templates': 'Templates',
          'Freebies': 'Freebies'
        };
        
        Object.keys(CATEGORIES).forEach(category => {
          if (!designsByCategory[category]) {
            designsByCategory[category] = [];
          }
        });

        setDesigns(designsByCategory);

        const { data: mockupsData, error: mockupsError } = await supabase
          .from('design_mockups')
          .select('design_id, mockup_path')
          .in('design_id', designsData.map(d => d.id))
          .order('display_order');

        if (!isMounted) return;

        if (mockupsError) {
          console.error('Error fetching mockups:', mockupsError);
        } else if (mockupsData) {
          // Create a map of design_id to first mockup path with proper Supabase Storage URL
          const mockupMap = mockupsData.reduce((acc, mockup) => {
            if (!acc[mockup.design_id]) {
              // Generate a proper Supabase Storage URL
              const { data } = supabase.storage
                .from('designs')
                .getPublicUrl(mockup.mockup_path);
              
              // Store the public URL instead of just the path
              acc[mockup.design_id] = data.publicUrl;
            }
            return acc;
          }, {} as Record<string, string>);
          
          setDesignMockups(mockupMap);
        }
      }
    } catch (err) {
      console.error('Error fetching designs:', err);
      if (isMounted) {
        setError('Failed to load designs. Please try again later.');
        setDesigns({});
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  return {
    designs,
    designMockups,
    loading,
    error,
    refetch: fetchDesigns
  };
}
