import axios from 'axios';

// O GHOST agora consome dinamicamente o ambiente via VITE_
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1/ghost',
  timeout: 10000, // Reduzido para 10s para melhorar a responsividade
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;