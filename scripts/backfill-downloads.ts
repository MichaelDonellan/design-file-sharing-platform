import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function backfillDownloads() {
  console.log('Starting to backfill downloads to purchases table...');

  try {
    // Get all designs with downloads > 0
    const { data: designs, error: designsError } = await supabase
      .from('designs')
      .select('id, user_id, downloads, price, created_at')
      .gt('downloads', 0);

    if (designsError) throw designsError;
    if (!designs || designs.length === 0) {
      console.log('No designs with downloads found');
      return;
    }

    console.log(`Found ${designs.length} designs with downloads`);

    let createdCount = 0;
    let skippedCount = 0;

    // Process each design
    for (const design of designs) {
      // Skip if price is not 0 or null (only backfill free downloads)
      if (design.price !== null && design.price > 0) {
        console.log(`Skipping paid design ${design.id} (price: ${design.price})`);
        skippedCount++;
        continue;
      }

      // Check if purchase already exists
      const { data: existingPurchase, error: checkError } = await supabase
        .from('purchases')
        .select('id')
        .eq('design_id', design.id)
        .eq('user_id', design.user_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingPurchase) {
        console.log(`Purchase already exists for design ${design.id} and user ${design.user_id}`);
        skippedCount++;
        continue;
      }

      // Create purchase record
      const { error: insertError } = await supabase
        .from('purchases')
        .insert([
          {
            design_id: design.id,
            user_id: design.user_id,
            amount: 0,
            currency: 'USD',
            status: 'completed',
            created_at: design.created_at || new Date().toISOString(),
          },
        ]);

      if (insertError) {
        console.error(`Error creating purchase for design ${design.id}:`, insertError);
        continue;
      }

      console.log(`Created purchase record for design ${design.id} (user: ${design.user_id})`);
      createdCount++;
    }

    console.log('\nBackfill completed!');
    console.log(`- Created ${createdCount} new purchase records`);
    console.log(`- Skipped ${skippedCount} existing or paid downloads`);

  } catch (error) {
    console.error('Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillDownloads();
