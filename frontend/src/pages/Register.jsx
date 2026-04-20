import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, User, Loader2, CheckCircle, Brain, Shield, Eye as EyeIcon, BarChart3, Key } from 'lucide-react'
import { useAuth, ROLE_LABELS } from '../context/AuthContext'

const roleIcons = { user: User, psychologist: EyeIcon, curator: BarChart3, admin: Shield }
const roleDescriptions = {
  user: 'Анализ своего профиля и просмотр результатов',
  psychologist: 'Детальные отчёты по ученикам закреплённых классов',
  curator: 'Обзор уровня стресса в группе без персональных данных',
  admin: 'Полный доступ к системе и логам',
}

export default function Register() {
  const [formData, setFormData] = useState({
    email: '', username: '', fullName: '', password: '', confirmPassword: '',
  })
  const [selectedRole, setSelectedRole] = useState('user')
  const [roleCode, setRoleCode] = useState('')
  const [assignedClasses, setAssignedClasses] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const validatePassword = () => {
    if (formData.password.length < 8) return 'Пароль должен содержать минимум 8 символов'
    if (formData.password !== formData.confirmPassword) return 'Пароли не совпадают'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validatePassword()
    if (validationError) { setError(validationError); return }

    if (selectedRole !== 'user' && !roleCode.trim()) {
      setError('Для этой роли необходимо ввести код доступа')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const classes = (selectedRole === 'psychologist' || selectedRole === 'curator') && assignedClasses
        ? assignedClasses.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
      await register(formData.email, formData.username, formData.password, formData.fullName, selectedRole, classes, roleCode)
      setSuccess('Аккаунт создан! Перенаправление на вход...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Email already registered') setError('Этот email уже зарегистрирован')
      else if (detail === 'Username already taken') setError('Это имя пользователя уже занято')
      else if (detail === 'Invalid role code') setError('Неверный код доступа для выбранной роли')
      else if (detail === 'Role code is required for this role') setError('Для этой роли необходим код доступа')
      else setError(detail || 'Ошибка регистрации. Попробуйте снова.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-500/8 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-accent-500/8 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary-500/20">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">
            Регистрация в <span className="gradient-text">NeuroScan</span>
          </h1>
          <p className="text-white/55">Создайте аккаунт для доступа к системе</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="input-field pl-11" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Имя пользователя</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input type="text" name="username" required minLength={3} value={formData.username} onChange={handleChange}
                  className="input-field pl-11" placeholder="Придумайте логин" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">ФИО <span className="text-white/35">(необязательно)</span></label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                  className="input-field pl-11" placeholder="Иванов Иван Иванович" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input type={showPassword ? 'text' : 'password'} name="password" required minLength={8}
                  value={formData.password} onChange={handleChange}
                  className="input-field pl-11 pr-11" placeholder="Минимум 8 символов" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white/50 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-2">Подтвердите пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" required
                  value={formData.confirmPassword} onChange={handleChange}
                  className="input-field pl-11" placeholder="Повторите пароль" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/50 mb-3">Роль</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROLE_LABELS).map(([key, label]) => {
                  const Icon = roleIcons[key]
                  return (
                    <button key={key} type="button" onClick={() => setSelectedRole(key)}
                      className={`p-3 rounded-xl text-left transition-all border ${
                        selectedRole === key
                          ? 'bg-primary-500/10 border-primary-500/25 text-white'
                          : 'bg-white/[0.015] border-white/[0.04] text-white/40 hover:bg-white/[0.03]'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                      <p className="text-[10px] text-white/35 leading-tight">{roleDescriptions[key]}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedRole !== 'user' && (
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Код доступа для роли</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
                  <input type="text" value={roleCode} onChange={e => setRoleCode(e.target.value)}
                    className="input-field pl-11" placeholder="Введите код доступа" />
                </div>
                <p className="text-xs text-amber-400/40 mt-1.5">Для роли «{ROLE_LABELS[selectedRole]}» требуется специальный код. Получите его у администратора.</p>
              </div>
            )}

            {(selectedRole === 'psychologist' || selectedRole === 'curator') && (
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Закреплённые классы</label>
                <input type="text" value={assignedClasses} onChange={e => setAssignedClasses(e.target.value)}
                  className="input-field" placeholder="10А, 10Б, 11В" />
                <p className="text-xs text-white/35 mt-1">Введите через запятую</p>
              </div>
            )}

            {error && (
              <div className="py-3 px-4 rounded-xl bg-red-500/[0.08] border border-red-500/20">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="py-3 px-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20">
                <p className="text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />{success}
                </p>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-base disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300 flex items-center justify-center gap-2">
              {isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" />Создание аккаунта...</>) : 'Создать аккаунт'}
            </button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-primary-500/[0.04] border border-primary-500/10">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/50 leading-relaxed">
                Ваши данные будут анонимизированы и использованы только в исследовательских целях. Вы можете удалить аккаунт в любое время.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Войти</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
