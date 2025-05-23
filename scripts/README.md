# Design File Storage Management

This folder contains utilities for managing design files in Supabase Storage.

## Files

1. `update-storage-paths.sql` - SQL script to update database records with proper storage paths
2. `upload-design-files.js` - Node.js script to upload design files to Supabase Storage

## How to Use

### Step 1: Update Database Records

1. Go to the Supabase dashboard (https://app.supabase.com)
2. Open your project
3. Click on "SQL Editor" in the left sidebar
4. Copy the contents of `update-storage-paths.sql` and paste it into the editor
5. Run the script
6. Verify the results in the output

### Step 2: Upload Files to Supabase Storage

1. Prepare your design files in folders named by design ID
2. Install dependencies:
   ```bash
   cd scripts
   npm install
   ```
3. Run the upload script:
   ```bash
   npm run upload -- <designId> <folderPath>
   ```
   
   Example:
   ```bash
   npm run upload -- 12345 ../design-files/logo-design
   ```

### Step 3: Verify Uploads

1. Go to the Supabase dashboard
2. Click on "Storage" in the left sidebar
3. Select the "designs" bucket
4. Browse through the folders to make sure your files are uploaded correctly

## Storage Structure

The recommended storage structure is:

```
designs/
  ├── [design_id_1]/
  │   ├── file1.psd
  │   ├── file2.ai
  │   └── preview.jpg
  ├── [design_id_2]/
  │   ├── main.sketch
  │   └── export.png
  └── ...
```

Each design gets its own folder named after its ID, containing all related files.
