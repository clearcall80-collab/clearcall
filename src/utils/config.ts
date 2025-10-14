export const config = {
  API_BASE_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-backend-url.onrender.com' // Replace with actual deployed URL
    : 'http://localhost:4000',
  SOCKET_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-backend-url.onrender.com' // Replace with actual deployed URL
    : 'http://localhost:4000',
  FRONTEND_URL: process.env.NODE_ENV === 'production'
    ? 'https://your-frontend-url.com' // Replace with actual deployed frontend URL
    : 'http://localhost:3002'
};
