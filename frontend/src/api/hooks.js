import { useMemo } from "react"
import { createApiClient } from "./client"
import { useAuth } from "../state/auth.jsx"

export function useApi() {
  const { token, logout } = useAuth()

  const api = useMemo(() => {
    const client = createApiClient(() => token)
    client.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401) logout()
        return Promise.reject(err)
      },
    )
    return client
  }, [token, logout])

  return api
}

