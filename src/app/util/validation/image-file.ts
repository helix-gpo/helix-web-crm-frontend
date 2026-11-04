// mirrors ImageUploadValidator in the backend
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// returns an error message, or null if the file is fine
export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Die Datei ist zu groß - maximal 5 MB erlaubt.';
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Nur JPEG-, PNG- oder WebP-Bilder sind erlaubt.';
  }
  return null;
}
