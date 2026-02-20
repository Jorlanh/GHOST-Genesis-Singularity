import axios from 'axios';

// Define a URL base do Cérebro (Backend)
// Se você mudar a porta no application.yaml, mude APENAS aqui.
const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1/ghost',
  timeout: 30000, // 30 segundos de tolerância para o LLM pensar
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;