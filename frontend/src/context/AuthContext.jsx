import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export const ROLE_LABELS = {
  admin: 'Администратор',
  psychologist: 'Психолог',
  curator: 'Куратор',
  user: 'Ученик',
}

export const ROLE_COLORS = {
  admin: 'text-red-400 bg-red-500/10 border-red-500/20',
  psychologist: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  curator: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  user: 'text-white/50 bg-white/5 border-white/10',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authService.getMe()
        .then(data => setUser(data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    localStorage.setItem('token', data.access_token)
    const userData = await authService.getMe()
    setUser(userData)
    return userData
  }

  const register = async (email, username, password, fullName, role, assignedClasses, roleCode) => {
    const data = await authService.register(email, username, password, fullName, role, assignedClasses, roleCode)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateConsent = async (consent) => {
    await authService.updateConsent(consent)
    setUser(prev => ({ ...prev, consent_given: consent }))
  }

  const isAdmin = user?.role === 'admin'
  const isPsychologist = user?.role === 'psychologist'
  const isCurator = user?.role === 'curator'
  const canViewReports = isAdmin || isPsychologist
  const canViewGroupSummary = isAdmin || isPsychologist || isCurator

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateConsent,
      isAdmin, isPsychologist, isCurator,
      canViewReports, canViewGroupSummary,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
