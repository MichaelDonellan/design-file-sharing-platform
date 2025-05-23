// Script to upload placeholder PDFs to Supabase storage at the correct paths
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Supabase credentials from .env.example
const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
const supabaseUrl = envExample.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const supabaseAnonKey = envExample.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// File paths from SQL query results
const filePaths = [
  'designs/8830ab51-130c-4f67-a367-4a5ebe23805e/icon-set-essential.pdf',
  'designs/8b165b3c-f56d-4d63-b35d-784ef40b6ff1/modern-logo-template.pdf',
  'designs/87e76093-6c03-4a9f-a657-266bf598138b/ui-kit-pro.pdf',
  'designs/e53021be-b797-4860-8c1b-409f017afd1e/vintage-font-pack.pdf',
  'designs/0f601a42-4596-4660-bb0d-472838a65840/website-template-portfolio.pdf'
];

// Read the placeholder PDF file
const placeholderPdfPath = path.join(__dirname, '..', 'placeholder.pdf');
const placeholderPdf = fs.readFileSync(placeholderPdfPath);

// Upload placeholder PDFs to each path
async function uploadPlaceholders() {
  console.log('Starting upload of placeholder PDFs...');
  
  // First check connection to Supabase
  try {
    const { data, error } = await supabase.from('designs').select('id').limit(1);
    if (error) {
      throw new Error(`Cannot connect to Supabase: ${error.message}`);
    }
    console.log('Successfully connected to Supabase');
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
    process.exit(1);
  }
  
  // Upload each file
  for (const filePath of filePaths) {
    try {
      console.log(`Uploading to ${filePath}...`);
      const { data, error } = await supabase
        .storage
        .from('designs')
        .upload(filePath, placeholderPdf, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading to ${filePath}:`, error);
      } else {
        console.log(`Successfully uploaded to ${filePath}`);
      }
    } catch (err) {
      console.error(`Error uploading to ${filePath}:`, err);
    }
  }
  
  console.log('Upload process complete!');
}

// Run the upload function
uploadPlaceholders()
  .then(() => {
    console.log('All placeholder PDFs have been uploaded');
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
