// Reset Designs and Configure Storage Paths
// This script will:
// 1. Delete all existing designs and files
// 2. Create new design records with consistent storage paths
// 3. Upload placeholder PDFs

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract Supabase credentials from .env.example for ease of use
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const supabaseUrl = envExample.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseAnonKey = envExample.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to slugify a name
function slugify(name) {
  // Remove file extension if present
  const baseName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
  
  // Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric characters
  return baseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') + '.pdf';
}

// Helper function to create a placeholder PDF
function createPlaceholderPdf() {
  // This is a minimal valid PDF structure
  const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n183\n%%EOF';
  
  return Buffer.from(minimalPdf);
}

// Main function to reset designs
async function resetDesigns() {
  console.log('Starting design reset process...');
  
  try {
    // 1. First check connection to Supabase
    console.log('Testing connection to Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('designs')
      .select('id')
      .limit(1);
    
    if (testError) {
      throw new Error(`Cannot connect to Supabase: ${testError.message}`);
    }
    
    console.log('Successfully connected to Supabase');
    
    // 2. Delete design_files records first (due to foreign key constraints)
    console.log('Deleting existing design_files records...');
    const { error: deleteFilesError } = await supabase
      .from('design_files')
      .delete()
      .neq('id', ''); // This will match all records
    
    if (deleteFilesError) {
      throw new Error(`Error deleting design_files: ${deleteFilesError.message}`);
    }
    
    console.log('All design_files records deleted successfully');
    
    // 3. Delete design_mockups records if table exists
    console.log('Attempting to delete existing design_mockups records...');
    try {
      const { error: deleteMockupsError } = await supabase
        .from('design_mockups')
        .delete()
        .neq('id', ''); // This will match all records
      
      if (deleteMockupsError) {
        console.warn(`Note: Error with design_mockups table: ${deleteMockupsError.message}`);
        console.warn('Continuing with the process...');
      } else {
        console.log('All design_mockups records deleted successfully');
      }
    } catch (mockupError) {
      console.warn('Note: design_mockups table might not exist, continuing...');
    }
    
    // 4. Delete reviews records if they exist
    console.log('Attempting to delete existing reviews records...');
    try {
      const { error: deleteReviewsError } = await supabase
        .from('reviews')
        .delete()
        .neq('id', ''); // This will match all records
      
      if (deleteReviewsError) {
        console.warn(`Note: Error with reviews table: ${deleteReviewsError.message}`);
        console.warn('Continuing with the process...');
      } else {
        console.log('All reviews records deleted successfully');
      }
    } catch (reviewError) {
      console.warn('Note: reviews table might not exist, continuing...');
    }
    
    // 5. Delete design records
    console.log('Deleting existing design records...');
    const { error: deleteDesignsError } = await supabase
      .from('designs')
      .delete()
      .neq('id', ''); // This will match all records
    
    if (deleteDesignsError) {
      throw new Error(`Error deleting designs: ${deleteDesignsError.message}`);
    }
    
    console.log('All design records deleted successfully');
    
    // 6. Empty storage bucket
    console.log('Emptying storage bucket...');
    const { data: folders, error: listError } = await supabase
      .storage
      .from('designs')
      .list();
    
    if (listError) {
      throw new Error(`Error listing files: ${listError.message}`);
    }
    
    // Delete each folder in the designs bucket
    if (folders && folders.length > 0) {
      for (const folder of folders) {
        console.log(`Deleting ${folder.name}...`);
        const { error: deleteFileError } = await supabase
          .storage
          .from('designs')
          .remove([folder.name]);
        
        if (deleteFileError) {
          console.error(`Error deleting ${folder.name}: ${deleteFileError.message}`);
        }
      }
      console.log('Storage bucket emptied successfully');
    } else {
      console.log('Storage bucket is already empty');
    }
    
    // 7. Create sample design data
    const sampleDesigns = [
      { name: 'Modern Logo Template', category: 'Logos', file_type: 'template', description: 'A sleek and modern logo template for tech companies', price: 0 }, // Free
      { name: 'Vintage Font Pack', category: 'Fonts', file_type: 'font', description: 'A collection of vintage-inspired fonts', price: 19.99 }, // Paid
      { name: 'UI Kit Pro', category: 'UI Kits', file_type: 'template', description: 'Professional UI components for modern web applications', price: 49.99 }, // Paid
      { name: 'Icon Set - Essential', category: 'Icons', file_type: 'image', description: 'Essential icons for everyday app design', price: 0 }, // Free
      { name: 'Website Template - Portfolio', category: 'Templates', file_type: 'template', description: 'Clean portfolio template for designers', price: 29.99 } // Paid
    ];
    
    // Get current user ID or create a fake one for testing
    let defaultUserId;
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        defaultUserId = uuidv4();
        console.log(`No authenticated user, using generated ID: ${defaultUserId}`);
      } else {
        defaultUserId = userData.user.id;
        console.log(`Using authenticated user ID: ${defaultUserId}`);
      }
    } catch (err) {
      defaultUserId = uuidv4();
      console.log(`Error getting user, using generated ID: ${defaultUserId}`);
    }
    
    // Create placeholder PDF
    const placeholderPdf = createPlaceholderPdf();
    
    // 8. Add new designs and upload files
    for (const design of sampleDesigns) {
      try {
        // Generate a new UUID for the design
        const designId = uuidv4();
        
        // Slugify the name
        const slugifiedName = slugify(design.name);
        
        // Define the storage path in the required format: designs/<design_id>/<slugified_name>.pdf
        const storagePath = `designs/${designId}/${slugifiedName}`;
        
        // Upload the placeholder PDF
        console.log(`Uploading placeholder for: ${design.name}`);
        const { error: uploadError } = await supabase
          .storage
          .from('designs')
          .upload(storagePath, placeholderPdf, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) {
          throw new Error(`Error uploading file: ${uploadError.message}`);
        }
        
        // Insert the design record
        console.log(`Creating design record: ${design.name}`);
        const { error: insertDesignError } = await supabase
          .from('designs')
          .insert({
            id: designId,
            name: design.name,
            description: design.description,
            file_type: design.file_type,
            category: design.category,
            user_id: defaultUserId,
            downloads: 0,
            price: design.price
          });
        
        if (insertDesignError) {
          throw new Error(`Error creating design record: ${insertDesignError.message}`);
        }
        
        // Insert the design_file record
        console.log(`Creating design_file record for: ${design.name}`);
        const { error: insertFileError } = await supabase
          .from('design_files')
          .insert({
            id: uuidv4(),
            design_id: designId,
            file_path: storagePath,
            storage_path: storagePath, // Using the same format for both
            file_type: design.file_type,
            display_order: 1,
            original_name: `${design.name}.pdf`
          });
        
        if (insertFileError) {
          throw new Error(`Error creating design_file record: ${insertFileError.message}`);
        }
        
        console.log(`Successfully created design: ${design.name} with ID: ${designId}`);
      } catch (error) {
        console.error(`Error processing design ${design.name}:`, error);
      }
    }
    
    console.log('Design reset complete!');
    
  } catch (error) {
    console.error('Error in resetDesigns:', error);
    process.exit(1);
  }
}

// Execute the reset function
resetDesigns()
  .then(() => {
    console.log('Script execution completed');
    // Exit after a short delay to allow any pending console logs to be printed
    setTimeout(() => process.exit(0), 1000);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
