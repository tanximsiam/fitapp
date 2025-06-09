// src/lib/axios.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URI + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ Automatically attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api


