// Centralized backend URL configuration
// - Production: empty string → Nginx proxies /api and /socket.io on same origin
// - Development: set VITE_API_URL in client/.env.local, e.g. http://localhost:5000
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';
