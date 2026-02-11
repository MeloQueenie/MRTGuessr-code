import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, checkAuth, logout as logoutApi } from '@/lib/api'
import { usePostHog } from '@posthog/react'
interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  refetchAuth: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const posthog = usePostHog()

  const fetchAuthStatus = async () => {
    try {
      const response = await checkAuth()
      setIsAuthenticated(response.authenticated)
      setUser(response.user || null)
      if (response.authenticated && response.user) {
        posthog.identify(response.user.uuid, {
          username: response.user.username,
          displayName: response.user.display_name,
        });
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthStatus()
  }, [])

  const refetchAuth = async () => {
    setIsLoading(true)
    await fetchAuthStatus()
  }

  const logout = async () => {
    try {
      await logoutApi()
      setIsAuthenticated(false)
      setUser(null)
      posthog.reset();
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, refetchAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
