import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a design file to Supabase Storage
 * @param {string} designId - The ID of the design
 * @param {string} filePath - Path to the local file
 * @returns {Promise<Object>} - Upload result
 */
async function uploadDesignFile(designId, filePath) {
  try {
    // Get file name from path
    const fileName = path.basename(filePath);
    
    // Define storage path in Supabase
    const storagePath = `designs/${designId}/${fileName}`;
    
    // Read file content
    const fileContent = fs.readFileSync(filePath);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('designs')
      .upload(storagePath, fileContent, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Uploaded ${fileName} to ${storagePath}`);
    return { success: true, path: storagePath, data };
  } catch (error) {
    console.error(`❌ Failed to upload ${path.basename(filePath)}:`, error.message);
    return { success: false, error };
  }
}

/**
 * Batch uploads multiple files for a design
 * @param {string} designId - The ID of the design
 * @param {Array<string>} filePaths - Array of local file paths to upload
 * @returns {Promise<Array>} - Upload results
 */
async function uploadDesignFiles(designId, filePaths) {
  const results = [];
  
  for (const filePath of filePaths) {
    const result = await uploadDesignFile(designId, filePath);
    results.push(result);
  }
  
  return results;
}

/**
 * Updates the design_files table with the storage paths
 * @param {string} designId - The ID of the design
 * @param {Array<Object>} files - Array of file objects with original_name and storage_path
 * @returns {Promise<Object>} - Update result
 */
async function updateDesignFilesTable(designId, files) {
  try {
    const promises = files.map(file => {
      return supabase
        .from('design_files')
        .upsert({
          design_id: designId,
          original_name: file.original_name,
          storage_path: file.storage_path,
          file_type: path.extname(file.original_name).substring(1),
          display_order: file.display_order || 0
        });
    });
    
    const results = await Promise.all(promises);
    console.log(`✅ Updated design_files table for design ${designId}`);
    return { success: true, results };
  } catch (error) {
    console.error(`❌ Failed to update design_files table:`, error.message);
    return { success: false, error };
  }
}

// Example usage:
async function main() {
  const designId = process.argv[2];
  const folderPath = process.argv[3];
  
  if (!designId || !folderPath) {
    console.error('Usage: node upload-design-files.js <designId> <folderPath>');
    process.exit(1);
  }
  
  try {
    // Read all files from the folder
    const files = fs.readdirSync(folderPath)
      .filter(file => !fs.statSync(path.join(folderPath, file)).isDirectory())
      .map(file => path.join(folderPath, file));
    
    console.log(`Found ${files.length} files to upload for design ${designId}`);
    
    // Upload all files
    const uploadResults = await uploadDesignFiles(designId, files);
    
    // Prepare file records for database
    const fileRecords = uploadResults
      .filter(result => result.success)
      .map((result, index) => ({
        original_name: path.basename(result.path),
        storage_path: result.path,
        display_order: index
      }));
    
    // Update database
    await updateDesignFilesTable(designId, fileRecords);
    
    console.log(`✨ All done! ${uploadResults.filter(r => r.success).length}/${files.length} files processed successfully.`);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

main().catch(console.error);
