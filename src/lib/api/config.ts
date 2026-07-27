// Base URL for the custom Icaro backend API.
// Set VITE_API_BASE_URL in your .env file to override for other
// environments (staging, prod, a different LAN address, etc).
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL || 'http://192.168.18.242:3001';
