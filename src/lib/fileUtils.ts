/**
 * Utility functions for file handling
 */

/**
 * Slugify a filename - convert to lowercase, replace spaces with hyphens,
 * remove non-alphanumeric characters, and ensure it has the correct extension
 * 
 * @param name The original name to slugify
 * @param extension Optional extension to ensure the file has (e.g., 'pdf')
 * @returns A slugified filename
 */
export function slugifyFilename(name: string, extension?: string): string {
  // Remove file extension if present
  const baseName = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
  
  // Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric characters
  const slugified = baseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Add extension if specified, otherwise keep original extension
  if (extension) {
    return `${slugified}.${extension}`;
  }
  
  const originalExt = name.includes('.') ? name.substring(name.lastIndexOf('.') + 1) : '';
  return originalExt ? `${slugified}.${originalExt}` : slugified;
}

/**
 * Generate a consistent storage path for design files
 * 
 * @param designId The UUID of the design
 * @param filename The original filename
 * @param extension Optional extension to ensure the file has
 * @returns A standardized storage path in the format: designs/<design_id>/<slugified_name>.<ext>
 */
export function generateStoragePath(designId: string, filename: string, extension?: string): string {
  const slugifiedName = slugifyFilename(filename, extension);
  return `designs/${designId}/${slugifiedName}`;
}
