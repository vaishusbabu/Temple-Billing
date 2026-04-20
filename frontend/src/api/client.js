import axios from "axios"

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000"

export function createApiClient(getToken) {
  const api = axios.create({
    baseURL: API_BASE_URL,
  })

  api.interceptors.request.use((config) => {
    const token = getToken?.()
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return api
}

