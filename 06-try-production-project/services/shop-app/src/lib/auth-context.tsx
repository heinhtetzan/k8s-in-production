import { createContext, useContext, useEffect, useState } from 'react'
import {
  type AuthUser,
  fetchCurrentUser,
  loginUser,
  loginWithGoogle,
  registerUser,
} from './api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (
    email: string,
    password: string,
    name: string,
    type?: 'shop' | 'customer'
  ) => Promise<void>
  signInWithGoogle: (payload?: {
    email?: string
    name?: string
    idToken?: string
    googleId?: string
    avatarUrl?: string
  }) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_STORAGE_KEY = 'shop_app_jwt_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(typeof window !== 'undefined')
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Initialize session on mount
  useEffect(() => {
    async function initSession() {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      if (!savedToken) {
        setIsLoading(false)
        return
      }

      try {
        setToken(savedToken)
        const currentUser = await fetchCurrentUser(savedToken)
        setUser(currentUser)
      } catch (err) {
        console.warn('Session expired or invalid token:', err)
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const openAuthModal = () => setIsAuthModalOpen(true)
  const closeAuthModal = () => setIsAuthModalOpen(false)

  const signInWithEmail = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const res = await loginUser({ email, password })
      setToken(res.token)
      setUser(res.user)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token)
      }
      closeAuthModal()
    } finally {
      setIsLoading(false)
    }
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string,
    type: 'shop' | 'customer' = 'customer'
  ) => {
    setIsLoading(true)
    try {
      const res = await registerUser({ email, password, name, type })
      setToken(res.token)
      setUser(res.user)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token)
      }
      closeAuthModal()
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (payload?: {
    email?: string
    name?: string
    idToken?: string
    googleId?: string
    avatarUrl?: string
  }) => {
    setIsLoading(true)
    try {
      const email = payload?.email?.trim() || 'alex.morgan@gmail.com'
      const name = payload?.name?.trim() || email.split('@')[0]
      const avatarUrl =
        payload?.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true`

      const googlePayload = {
        email,
        name,
        avatarUrl,
        googleId: payload?.googleId || `g_${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        idToken: payload?.idToken,
      }

      const res = await loginWithGoogle(googlePayload)
      setToken(res.token)
      setUser(res.user)
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_STORAGE_KEY, res.token)
      }
      closeAuthModal()
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
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
