import { createContext, useContext, useEffect, useState } from 'react'
import {
  type User,
  loginShopAdmin,
  fetchShopAdminProfile,
} from './api'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'shop_admin_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(typeof window !== 'undefined')

  useEffect(() => {
    async function initSession() {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const savedToken = localStorage.getItem(TOKEN_KEY)
      if (!savedToken) {
        setIsLoading(false)
        return
      }

      try {
        setToken(savedToken)
        const profile = await fetchShopAdminProfile(savedToken)
        if (profile.type !== 'shop') {
          throw new Error('Only shop accounts are permitted to access the dashboard')
        }
        setUser(profile)
      } catch (err) {
        console.warn('Dashboard session invalid or expired:', err)
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await loginShopAdmin({ email, password })
      if (res.user.type !== 'shop') {
        throw new Error('Access denied: Only shop accounts are permitted to access the dashboard')
      }
      setToken(res.token)
      setUser(res.user)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, res.token)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }
    setToken(null)
    setUser(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user && user.type === 'shop'),
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
