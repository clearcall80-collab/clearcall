export const config = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  SOCKET_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-url.com' // Replace with actual deployed frontend URL
    : 'http://localhost:3002'
};
