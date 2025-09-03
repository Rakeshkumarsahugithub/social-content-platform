// Image utility functions
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

/**
 * Get the full URL for an uploaded image
 * @param {string} imagePath - The relative path from the server
 * @returns {string} - Full URL or null if no image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath === '') {
    return null;
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Clean the path and construct proper URL
  let cleanPath = imagePath;
  
  // Handle Windows paths
  if (cleanPath.includes('\\')) {
    const parts = cleanPath.split('\\');
    cleanPath = parts[parts.length - 1];
  }
  
  // If path starts with /uploads/, just prepend BASE_URL
  if (cleanPath.startsWith('/uploads/')) {
    return `${BASE_URL}${cleanPath}`;
  }
  
  // Handle profile picture paths
  if (cleanPath.includes('profile-') || cleanPath.includes('uploads/profiles/')) {
    // Remove any leading slashes or uploads/ prefix
    cleanPath = cleanPath.replace(/^[\\/]*(uploads[\\/]profiles[\\/])?/, '');
    return `${BASE_URL}/uploads/profiles/${cleanPath}`;
  }
  
  // Handle post media paths
  if (cleanPath.includes('post-') || cleanPath.includes('uploads/posts/')) {
    // Remove any leading slashes or uploads/ prefix
    cleanPath = cleanPath.replace(/^[\\/]*(uploads[\\/]posts[\\/])?/, '');
    return `${BASE_URL}/uploads/posts/${cleanPath}`;
  }
  
  // Handle other uploads
  if (!cleanPath.startsWith('http')) {
    // Remove any leading slashes or uploads/ prefix
    cleanPath = cleanPath.replace(/^[\\/]*(uploads[\\/])?/, '');
    return `${BASE_URL}/uploads/${cleanPath}`;
  }
  
  return cleanPath;
};

/**
 * Handle image loading errors by setting a fallback image
 * @param {Event} e - The error event
 */
export const handleImageError = (e) => {
  // Add error class for styling
  e.target.classList.add('image-error');
  
  // Set fallback image - now using our own placeholder endpoint
  e.target.src = `${BASE_URL}/api/placeholder/400/300`;
  e.target.onerror = null; // Prevent infinite loop
  
  // Add a class to indicate the image has been processed
  e.target.classList.add('image-error-handled');
};

export default { getImageUrl, handleImageError };