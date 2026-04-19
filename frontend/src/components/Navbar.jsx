import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Brain, LogOut, LayoutDashboard, Shield, Eye, BarChart3 } from 'lucide-react'
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../context/AuthContext'

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, logout, isAdmin, isPsychologist, isCurator } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { path: '/', label: 'Главная' },
    { path: '/how-it-works', label: 'Как работает' },
    { path: '/about', label: 'О проекте' },
    { path: '/ethics', label: 'Этика' },
    { path: '/contact', label: 'Контакты' },
  ]

  const roleLink = isAdmin
    ? { path: '/admin', label: 'Админ', icon: Shield }
    : isPsychologist
    ? { path: '/psychologist', label: 'Психолог', icon: Eye }
    : isCurator
    ? { path: '/curator', label: 'Куратор', icon: BarChart3 }
    : null

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'py-3 bg-dark-300/90 backdrop-blur-2xl border-b border-white/[0.04]'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            Neuro<span className="gradient-text">Scan</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                location.pathname === link.path
                  ? 'text-white bg-white/[0.06] shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {roleLink && (
                <Link
                  to={roleLink.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:-translate-y-0.5 ${
                    location.pathname === roleLink.path
                      ? ROLE_COLORS[user.role].replace('/10', '/20').replace('/20', '/30')
                      : ROLE_COLORS[user.role]
                  }`}
                >
                  <roleLink.icon className="w-3.5 h-3.5" />
                  {roleLink.label}
                </Link>
              )}
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Панель
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-xs font-bold text-white">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 max-w-[80px] truncate leading-tight">{user.username}</span>
                  <span className="text-[10px] text-white/25">{ROLE_LABELS[user.role]}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-xl text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                Войти
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                Начать
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.04] transition-all"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark-200/95 backdrop-blur-xl border-t border-white/[0.04]"
          >
            <div className="px-6 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'text-white bg-white/[0.06]'
                      : 'text-white/40 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/[0.04] space-y-2">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center"
                    >
                      Панель
                    </Link>
                    {roleLink && (
                      <Link
                        to={roleLink.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-xl text-sm font-medium text-center border ${ROLE_COLORS[user.role]}`}
                      >
                        {roleLink.label}
                      </Link>
                    )}
                    <button
                      onClick={() => { logout(); setIsMobileMenuOpen(false) }}
                      className="w-full px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/[0.04] text-left"
                    >
                      Выйти
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white text-center"
                    >
                      Войти
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center"
                    >
                      Начать
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}
