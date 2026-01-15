/**
 * Convert file to base64 string
 * @param {File} file - The file to convert
 * @param {Function} callback - Callback function to receive base64 string
 */
export const convertToBase64 = (file, callback) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => callback(reader.result);
  reader.onerror = (error) => console.error("Base64 conversion error:", error);
};

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {boolean} - True if valid image
 */
export const isValidImage = (file) => {
  if (!file) return false;
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    console.error('Invalid file type. Please upload an image.');
    return false;
  }
  
  if (file.size > maxSize) {
    console.error('File too large. Maximum size is 5MB.');
    return false;
  }
  
  return true;
};