/**
 * Formats vehicle information for display
 * @param {Object|string} vehicle - The vehicle object or string to format
 * @param {string} [context='display'] - The context in which the vehicle info is being displayed
 * @returns {string} Formatted vehicle information
 */
export const formatVehicleInfo = (vehicle, context = 'display') => {
  if (!vehicle) return 'Not specified';
  
  // If it's already a string, return as is
  if (typeof vehicle === 'string') return vehicle;
  
  // Format based on available properties
  const parts = [];
  
  if (vehicle.name) parts.push(vehicle.name);
  if (vehicle.type) parts.push(vehicle.type);
  if (vehicle.number) parts.push(`(${vehicle.number})`);
  
  // If we have any parts, join them with spaces
  if (parts.length > 0) {
    return parts.join(' ');
  }
  
  // Fallback to string representation
  return vehicle.toString();
};

/**
 * Formats package information for display
 * @param {Object|string} pkg - The package object or string to format
 * @returns {string} Formatted package information
 */
export const formatPackageInfo = (pkg) => {
  if (!pkg) return 'Not specified';
  
  // If it's already a string, return as is
  if (typeof pkg === 'string') return pkg;
  
  // Format based on available properties
  const parts = [];
  
  if (pkg.name) parts.push(pkg.name);
  if (pkg.duration) parts.push(`(${pkg.duration} days)`);
  
  // If we have any parts, join them with spaces
  if (parts.length > 0) {
    return parts.join(' ');
  }
  
  // Fallback to string representation
  return pkg.toString();
};

/**
 * Formats a price value with currency symbol
 * @param {number|string} price - The price to format
 * @param {string} [currency='₹'] - The currency symbol to use
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = '₹') => {
  if (price === undefined || price === null || price === '') return 'Price not available';
  
  // Convert to number if it's a string
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) return 'Invalid price';
  
  // Format with 2 decimal places and add commas for thousands
  return `${currency}${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
