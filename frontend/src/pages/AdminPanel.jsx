import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth, ROLE_LABELS, ROLE_COLORS } from '../context/AuthContext'
import { authService, reportsService } from '../services/api'
import StressGauge from '../components/StressGauge'
import { Shield, Users, FileText, Activity, Loader2, Edit3, Check, X, FlaskConical, Play, ExternalLink, UserCircle } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const SCENARIO_META = {
  low_stress: { label: 'Низкий стресс', desc: 'Уровень ~0.20, компоненты низкие, тренд идёт вниз', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  medium_stress: { label: 'Средний стресс', desc: 'Уровень ~0.50, компоненты средние, тренд с флуктуациями', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  high_stress: { label: 'Высокий стресс', desc: 'Уровень ~0.85, компоненты высокие, резкий скачок на графике', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
}

export default function AdminPanel() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [results, setResults] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editClasses, setEditClasses] = useState('')
  const [scenarioUser, setScenarioUser] = useState('')
  const [scenarioMsg, setScenarioMsg] = useState('')
  const [scenarioLastUser, setScenarioLastUser] = useState(null)

  useEffect(() => {
    if (!user || !isAdmin) { navigate('/dashboard'); return }
    loadData()
  }, [user, isAdmin, navigate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usersData, resultsData, logsData] = await Promise.all([
        authService.listUsers(), reportsService.getAllResultsAdmin(), reportsService.getAuditLogs(),
      ])
      setUsers(usersData); setResults(resultsData); setLogs(logsData)
      if (usersData.length > 0 && !scenarioUser) setScenarioUser(String(usersData[0].id))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleRoleUpdate = async (userId) => {
    try {
      const classes = editClasses ? editClasses.split(',').map(s => s.trim()).filter(Boolean) : null
      await authService.updateUserRole(userId, editRole, classes)
      setEditingUser(null); loadData()
    } catch (err) { console.error(err) }
  }

  const handleScenario = async (key) => {
    if (!scenarioUser) return
    setScenarioMsg('')
    try {
      const res = await reportsService.createScenario(Number(scenarioUser), key)
      const u = users.find(u => u.id === Number(scenarioUser))
      setScenarioLastUser(u || null)
      setScenarioMsg(`✓ ${res.message}`)
      loadData()
    } catch (err) {
      setScenarioLastUser(null)
      setScenarioMsg(`Ошибка: ${err.response?.data?.detail || 'не удалось создать сценарий'}`)
    }
  }

  if (!user || !isAdmin) return null

  const tabs = [
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'scenarios', label: 'Сценарии', icon: FlaskConical },
    { id: 'results', label: 'Результаты', icon: Activity },
    { id: 'logs', label: 'Логи', icon: FileText },
  ]

  const getStressColor = (s) =>
    s < 0.3 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    s < 0.7 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-red-400 bg-red-500/10 border-red-500/20'

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <h1 className="text-3xl font-display font-bold">Панель <span className="gradient-text">Администратора</span></h1>
          </div>
          <p className="text-white/55">Управление ролями, сценарии, мониторинг системы</p>
        </motion.div>

        <div className="flex gap-1 mb-6 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.04] w-fit flex-wrap">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-white/[0.06] text-white' : 'text-white/50 hover:text-white/60'
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
        ) : (
          <>
            {activeTab === 'users' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
                <h2 className="text-lg font-semibold mb-5">Все пользователи ({users.length})</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06]">
                        <th className="text-left py-3 px-4 text-white/40 font-medium">Пользователь</th>
                        <th className="text-left py-3 px-4 text-white/40 font-medium">Email</th>
                        <th className="text-left py-3 px-4 text-white/40 font-medium">Роль</th>
                        <th className="text-left py-3 px-4 text-white/40 font-medium">Классы</th>
                        <th className="text-left py-3 px-4 text-white/40 font-medium">Статус</th>
                        <th className="text-right py-3 px-4 text-white/40 font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.015]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center text-xs font-bold text-white/60">
                                {u.username[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-white/70">{u.username}</div>
                                <div className="text-xs text-white/45">{u.full_name || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-white/40">{u.email}</td>
                          <td className="py-3 px-4">
                            {editingUser === u.id ? (
                              <select value={editRole} onChange={e => setEditRole(e.target.value)}
                                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white">
                                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                  <option key={key} value={key}>{label}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${ROLE_COLORS[u.role]}`}>
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-white/50 text-xs">
                            {editingUser === u.id ? (
                              <input value={editClasses} onChange={e => setEditClasses(e.target.value)}
                                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white w-32" placeholder="10А, 10Б" />
                            ) : (u.assigned_classes?.join(', ') || '—')}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`w-2 h-2 rounded-full inline-block ${u.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          </td>
                          <td className="py-3 px-4 text-right">
                            {editingUser === u.id ? (
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => handleRoleUpdate(u.id)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><Check className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setEditingUser(null)} className="p-1.5 rounded-lg bg-white/5 text-white/40 hover:bg-white/10"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingUser(u.id); setEditRole(u.role); setEditClasses(u.assigned_classes?.join(', ') || '') }}
                                className="p-1.5 rounded-lg text-white/35 hover:text-white/50 hover:bg-white/[0.04] transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'scenarios' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
                <div className="glass-card p-7">
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-primary-400" />
                    Демо-сценарии
                  </h2>
                  <p className="text-sm text-white/50 mb-6">Создайте готовый набор данных для демонстрации работы системы. Сценарий добавит 4–7 результатов анализа с реалистичным графиком.</p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-white/50 mb-2">Пользователь</label>
                    <div className="flex items-center gap-3">
                      <select value={scenarioUser} onChange={e => { setScenarioUser(e.target.value); setScenarioMsg(''); setScenarioLastUser(null) }}
                        className="input-field max-w-xs">
                        <option value="" disabled>Выберите ученика</option>
                        {users.filter(u => u.role === 'user').map(u => (
                          <option key={u.id} value={u.id}>{u.username} — {u.email}</option>
                        ))}
                      </select>
                      {scenarioUser && (
                        <button
                          onClick={() => navigate(`/psychologist?uid=${scenarioUser}`)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-all"
                          title="Перейти к профилю ученика">
                          <UserCircle className="w-4 h-4" />
                          Профиль
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(SCENARIO_META).map(([key, meta]) => (
                      <div key={key} className={`p-5 rounded-2xl border ${meta.bg}`}>
                        <h3 className={`text-base font-semibold mb-1 ${meta.color}`}>{meta.label}</h3>
                        <p className="text-xs text-white/50 mb-4 leading-relaxed">{meta.desc}</p>
                        <div className="flex justify-center mb-4">
                          <StressGauge
                            score={key === 'low_stress' ? 0.20 : key === 'medium_stress' ? 0.50 : 0.85}
                            size={140} showLabel={false}
                          />
                        </div>
                        <button onClick={() => handleScenario(key)}
                          className="w-full py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-white/60 hover:bg-white/[0.1] hover:text-white transition-all flex items-center justify-center gap-2">
                          <Play className="w-3.5 h-3.5" />Применить
                        </button>
                      </div>
                    ))}
                  </div>

                  {scenarioMsg && (
                    <div className={`py-3 px-4 rounded-xl text-sm flex items-center justify-between ${
                      scenarioMsg.startsWith('✓') ? 'bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-400' : 'bg-red-500/[0.08] border border-red-500/20 text-red-400'
                    }`}>
                      <span>{scenarioMsg}</span>
                      {scenarioMsg.startsWith('✓') && scenarioLastUser && (
                        <button
                          onClick={() => navigate(`/psychologist?uid=${scenarioLastUser.id}`)}
                          className="flex items-center gap-1.5 ml-3 px-3 py-1 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all">
                          <ExternalLink className="w-3 h-3" />
                          Открыть профиль {scenarioLastUser.username}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'results' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
                <h2 className="text-lg font-semibold mb-5">Все результаты анализа ({results.length})</h2>
                <div className="space-y-2">
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center"><Activity className="w-4 h-4 text-primary-400/60" /></div>
                        <div>
                          <div className="text-sm font-medium text-white/70">{r.username}</div>
                          <div className="text-xs text-white/45">{r.full_name || ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/40">{new Date(r.processed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStressColor(r.normalized_score)}`}>{Math.round(r.normalized_score * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
                <h2 className="text-lg font-semibold mb-5">Аудит логи ({logs.length})</h2>
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center"><FileText className="w-4 h-4 text-white/35" /></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-primary-400/50">{log.action}</span>
                          <span className="text-xs text-white/35">→</span>
                          <span className="text-xs text-white/50">{log.resource}</span>
                        </div>
                        <div className="text-xs text-white/15 mt-0.5">User #{log.user_id} • {log.created_at ? new Date(log.created_at).toLocaleString('ru-RU') : '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
