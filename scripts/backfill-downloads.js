// @ts-check
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillDownloads() {
  console.log('Starting to backfill downloads to purchases table...');

  try {
    // First, get all users who have downloaded designs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id');

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      console.log('No users found');
      return;
    }

    console.log(`Found ${users.length} users to process`);

    for (const user of users) {
      console.log(`\nProcessing user ${user.id}...`);
      
      // Get all designs this user has downloaded (from downloads table if it exists)
      let downloadedDesigns = [];
      
      try {
        // Try to get from design_files_downloads table if it exists
        const { data: downloadsData, error: downloadsError } = await supabase
          .from('design_files_downloads')
          .select('design_files(design_id), created_at')
          .eq('user_id', user.id);
          
        if (!downloadsError && downloadsData && downloadsData.length > 0) {
          // Get unique design IDs from downloads
          const designIds = [...new Set(downloadsData.map(d => d.design_files?.design_id).filter(Boolean))];
          
          if (designIds.length > 0) {
            // Fetch the actual design details
            const { data: designsData, error: designsError } = await supabase
              .from('designs')
              .select('*')
              .in('id', designIds);
              
            if (!designsError && designsData) {
              // Merge with download timestamps
              downloadedDesigns = designsData.map(design => ({
                ...design,
                created_at: downloadsData.find(d => d.design_files?.design_id === design.id)?.created_at || design.created_at
              }));
            }
          }
        } else {
          // Fallback to designs table if no downloads table or no downloads
          const { data: designsData, error: designsError } = await supabase
            .from('designs')
            .select('*')
            .gt('downloads', 0)
            .eq('user_id', user.id);
            
          if (!designsError) {
            downloadedDesigns = designsData || [];
          }
        }
      } catch (err) {
        console.warn(`Error processing user ${user.id}:`, err);
        continue;
      }

      if (downloadedDesigns.length === 0) {
        console.log(`No downloads found for user ${user.id}`);
        continue;
      }

      console.log(`Found ${downloadedDesigns.length} downloaded designs for user ${user.id}`);

      // Get existing purchases to avoid duplicates
      const { data: existingPurchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('design_id')
        .eq('user_id', user.id);

      if (purchasesError) {
        console.error(`Error fetching purchases for user ${user.id}:`, purchasesError);
        continue;
      }

      const existingDesignIds = new Set(existingPurchases?.map(p => p.design_id) || []);
      const newDownloads = downloadedDesigns.filter(d => !existingDesignIds.has(d.id));

      if (newDownloads.length === 0) {
        console.log(`No new downloads to backfill for user ${user.id}`);
        continue;
      }

      console.log(`Adding ${newDownloads.length} new purchase records for user ${user.id}`);

      // Create purchase records for new downloads
      const purchasesToInsert = newDownloads.map(download => ({
        design_id: download.id,
        user_id: user.id,
        amount: 0,
        currency: download.currency || 'USD',
        status: 'completed',
        created_at: download.created_at || new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('purchases')
        .insert(purchasesToInsert);

      if (insertError) {
        console.error(`Error inserting purchases for user ${user.id}:`, insertError);
      } else {
        console.log(`Successfully added ${purchasesToInsert.length} purchase records for user ${user.id}`);
      }
    }

    console.log('\nBackfill completed!');
  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillDownloads();
