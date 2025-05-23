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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to create a placeholder PDF
function createPlaceholderPdf() {
  // This is a minimal valid PDF structure
  const minimalPdf = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000053 00000 n\n0000000102 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n183\n%%EOF';
  
  return Buffer.from(minimalPdf);
}

// File paths from SQL query results
const filePaths = [
  'designs/bb183b4f-ecde-47d9-b5ad-a8c6297b62f5/icon-set-essential.pdf',
  'designs/229afc08-720c-400d-a466-e0474c6af69f/modern-logo-template.pdf',
  'designs/96fef64d-c5ec-4423-850f-70a26c8f1fe0/ui-kit-pro.pdf',
  'designs/50a86b5e-b0ee-4f6d-89a4-3ab9e28e2826/vintage-font-pack.pdf',
  'designs/7b5cc9f1-c2c9-4000-8516-92abab4cd51a/website-template-portfolio.pdf'
];

// Create placeholder PDF content
const placeholderPdf = createPlaceholderPdf();

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
