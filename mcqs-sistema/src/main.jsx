import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor to inject JWT
const originalFetch = window.fetch;
window.fetch = async function () {
  let [resource, config] = arguments;
  
  const urlStr = typeof resource === 'string' ? resource : (resource?.url || '');
  
  if (urlStr.includes('/api/') && !urlStr.includes('/api/auth/login')) {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config) config = {};
      if (!config.headers) config.headers = {};
      
      if (typeof Headers !== 'undefined' && config.headers instanceof Headers) {
        if (!config.headers.has('Authorization')) {
          config.headers.set('Authorization', `Bearer ${token}`);
        }
      } else if (Array.isArray(config.headers)) {
        config.headers.push(['Authorization', `Bearer ${token}`]);
      } else {
        if (!config.headers['Authorization'] && !config.headers['authorization']) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    }
  }
  
  try {
    const response = await originalFetch(resource, config);
    // Auto-logout if unauthorized (token expired / invalid)
    if (response.status === 401 && !urlStr.includes('/api/auth/login')) {
      console.warn('Sesión expirada o no autorizada (401). Redirigiendo al login...');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return response;
  } catch (error) {
    throw error;
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
