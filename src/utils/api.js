const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';

export const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) 
  ? _defaultLocal 
  : (_envApi || _defaultLocal);

// Interceptor Global de Fetch
// Isso evita ter que sobrescrever o window.fetch no App.jsx globalmente (o que é uma má prática)
export const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  
  // Lógica de suspensão da assinatura que antes poluía o fetch nativo no App.jsx
  if (response.status === 402) {
    window.dispatchEvent(new Event('assinatura_suspensa'));
  }
  
  return response;
};
