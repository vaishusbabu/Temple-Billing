/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import { readStoredAuth, writeStoredAuth } from "./authStorage.js"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const initial = useMemo(() => readStoredAuth(), [])
  const [token, setToken] = useState(initial.token)
  const [user, setUser] = useState(initial.user)

  useEffect(() => {
    writeStoredAuth(token, user)
  }, [token, user])

  const value = useMemo(
    () => ({
      token,
      user,
      setAuth: (nextToken, nextUser) => {
        setToken(nextToken)
        setUser(nextUser)
      },
      logout: () => {
        setToken(null)
        setUser(null)
      },
    }),
    [token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

