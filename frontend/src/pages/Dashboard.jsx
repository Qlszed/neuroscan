import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ROLE_LABELS } from '../context/AuthContext'
import { analysisService, reportsService } from '../services/api'
import StressGauge from '../components/StressGauge'
import StressRadar from '../components/StressRadar'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { Brain, Activity, Clock, MapPin, BookOpen, MessageCircle, Users, AlertTriangle, CheckCircle, XCircle, Loader2, TrendingUp, Calendar, Shield, Eye, BarChart3 } from 'lucide-react'

const BASELINE_POSTS = [
  'Отличный день! 🌞', 'Получил пятёрку по математике! 🎉',
  'Хорошо погулял с друзьями 😊', 'Классная тема по физике!',
  'Наконец-то разобрался с задачей 💡', 'Каникулы — лучшее время! 🏖️',
  'Рад, что сдал зачёт!', 'Друзья поддерживают, спасибо им ❤️',
  'Получил стипендию! 🏆', 'Подготовка к экзаменам идёт полным ходом! 📚',
  'Готовлюсь к экзамену, всё получается! 💪', 'Наконец-то сессия закончилась 😅',
]

const STRESS_POSTS = [
  'Стресс зашкаливает', 'Школа выжимает все силы',
  'Боюсь не сдать ЕГЭ', 'Не могу уснуть, думаю об экзамене',
  'Устал от бесконечных контрольных... 😩', 'Не могу сосредоточиться, слишком устал',
  'Сессия выжала все соки', 'Опять дедлайн завтра, а я ничего не сделал',
  'Снова ночую за учебниками', 'Учителя требуют слишком много',
  'Голова болит от нагрузки', 'Не хочу никуда идти сегодня',
  'Новая тема по математике, не могу понять 😫', 'Учёба достала... 🙄',
  'Завтра два экзамена, паника', 'Провалю всё...',
]

const NEUTRAL_POSTS = [
  'Подготовка к экзаменам идёт, нервничаю... 🧠', 'Хочу поступить в лучший вуз!',
  'Олимпиада на следующей неделе', 'Всё хорошо, просто устал немного',
  'Контрольная была легче, чем ожидал', 'Преподаватель помог разобраться, спасибо',
  'Мечтаю об отдыхе 🏖️', 'Закончил проект раньше срока! 💪',
]

const CITIES = ['Караганда', 'Астана', 'Алматы', 'Шымкент', 'Актобе']

function generateSampleData() {
  const stressLevel = Math.random()
  const totalPosts = 8 + Math.floor(Math.random() * 5)
  const baselineCount = Math.floor(totalPosts / 2)
  const recentCount = totalPosts - baselineCount
  const posts = []

  for (let i = 0; i < baselineCount; i++) {
    const day = new Date(2024, 0, 28 - i)
    day.setHours(9 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
    posts.push({
      text: BASELINE_POSTS[Math.floor(Math.random() * BASELINE_POSTS.length)],
      likes: 80 + Math.floor(Math.random() * 120),
      comments: 10 + Math.floor(Math.random() * 30),
      shares: 2 + Math.floor(Math.random() * 8),
      timestamp: day.toISOString(),
    })
  }

  const stressedText = stressLevel > 0.33
  const stressedNight = stressLevel > 0.5
  const stressedEngagement = stressLevel > 0.4

  for (let i = 0; i < recentCount; i++) {
    const day = new Date(2024, 1, 5 + i)
    let hour = 9 + Math.floor(Math.random() * 10)
    if (stressedNight && Math.random() < 0.45) hour = 23 + Math.floor(Math.random() * 4)

    const text = stressedText && Math.random() < 0.6
      ? STRESS_POSTS[Math.floor(Math.random() * STRESS_POSTS.length)]
      : NEUTRAL_POSTS[Math.floor(Math.random() * NEUTRAL_POSTS.length)]

    const engMul = stressedEngagement ? 0.2 + Math.random() * 0.4 : 0.6 + Math.random() * 0.6
    day.setHours(hour % 24, Math.floor(Math.random() * 60))

    posts.push({
      text,
      likes: Math.floor((80 + Math.random() * 120) * engMul),
      comments: Math.floor((10 + Math.random() * 30) * engMul),
      shares: Math.floor((2 + Math.random() * 8) * engMul),
      timestamp: day.toISOString(),
    })
  }

  const nLoc = stressLevel > 0.6 ? 1 : stressLevel > 0.3 ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 4)

  return {
    posts,
    followers: 600 + Math.floor(Math.random() * 1400),
    locations: Array.from({ length: nLoc }, () => CITIES[Math.floor(Math.random() * CITIES.length)]),
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function Dashboard() {
  const { user, updateConsent, isAdmin, isPsychologist, isCurator } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('analyze')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [history, setHistory] = useState([])
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [groupSummary, setGroupSummary] = useState([])
  const [assignedStudents, setAssignedStudents] = useState([])

  const canAnalyze = user?.role === 'user'

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    if (canAnalyze) loadHistory()
    else loadRoleData()
  }, [user, navigate])

  const loadHistory = async () => {
    try {
      const data = await analysisService.getHistory()
      setHistory(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const loadRoleData = async () => {
    try {
      if (isPsychologist || isAdmin) {
        const data = await reportsService.getAssignedStudents()
        setAssignedStudents(data)
      }
      if (isCurator || isPsychologist || isAdmin) {
        const data = await reportsService.getGroupSummary()
        setGroupSummary(data)
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const runAnalysis = async () => {
    if (!consentConfirmed) return
    if (!user.consent_given) {
      try { await updateConsent(true) } catch { return }
    }
    setIsAnalyzing(true)
    try {
      const result = await analysisService.analyze({
        sample_data: generateSampleData(),
        consent_confirmed: true,
      })
      setAnalysisResult(result)
      loadHistory()
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) alert(detail)
    } finally { setIsAnalyzing(false) }
  }

  const getStressLevel = (score) => {
    if (score < 0.3) return { label: 'Низкий', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    if (score < 0.7) return { label: 'Умеренный', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
    return { label: 'Высокий', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' }
  }

  const radarData = analysisResult?.radar_chart_data
    ? Object.entries(analysisResult.radar_chart_data).map(([subject, value]) => ({ subject, value, fullMark: 100 }))
    : []

  const timeSeriesData = analysisResult?.time_series_data || []
  if (!user) return null

  const rolePanelLink = isAdmin ? '/admin' : isPsychologist ? '/psychologist' : isCurator ? '/curator' : null
  const rolePanelIcon = isAdmin ? Shield : isPsychologist ? Eye : isCurator ? BarChart3 : null
  const rolePanelLabel = isAdmin ? 'Панель администратора' : isPsychologist ? 'Панель психолога' : isCurator ? 'Панель куратора' : ''

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Добро пожаловать, <span className="gradient-text">{user.username}</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-white/35">
              {canAnalyze ? 'Анализ цифрового следа для определения уровня стресса' : 'Просмотр данных и статистики'}
            </p>
            <span className="px-2 py-0.5 rounded-lg text-xs font-medium border bg-primary-500/10 border-primary-500/20 text-primary-400">
              {ROLE_LABELS[user.role]}
            </span>
            {rolePanelLink && (
              <Link to={rolePanelLink} className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white transition-all">
                {rolePanelIcon && <rolePanelIcon className="w-3 h-3" />}
                {rolePanelLabel}
              </Link>
            )}
          </div>
        </motion.div>

        {canAnalyze && (
          <div className="flex gap-1 mb-8 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.04] w-fit">
            {[{ id: 'analyze', label: 'Анализ' }, { id: 'history', label: 'История' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeTab === tab.id ? 'bg-white/[0.06] text-white shadow-sm' : 'text-white/30 hover:text-white/60'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {!canAnalyze && (
          <div className="mb-8">
            <div className="p-4 rounded-xl bg-primary-500/[0.04] border border-primary-500/10">
              <p className="text-sm text-white/40">
                Анализ профиля доступен только ученикам. Ваша роль предназначена для просмотра статистики и данных.
              </p>
            </div>
          </div>
        )}

        {!canAnalyze && groupSummary.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Сводка по классам</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupSummary.map(s => (
                <div key={s.class_name} className="glass-card p-6">
                  <h3 className="text-base font-semibold mb-3">Класс {s.class_name}</h3>
                  <StressGauge score={s.avg_stress} size={160} showLabel={true} />
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 p-2 rounded-lg bg-emerald-500/[0.06] text-center">
                      <div className="text-lg font-bold text-emerald-400">{s.low_count}</div>
                      <div className="text-[10px] text-white/20">Норма</div>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-amber-500/[0.06] text-center">
                      <div className="text-lg font-bold text-amber-400">{s.moderate_count}</div>
                      <div className="text-[10px] text-white/20">Внимание</div>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-red-500/[0.06] text-center">
                      <div className="text-lg font-bold text-red-400">{s.high_count}</div>
                      <div className="text-[10px] text-white/20">Риск</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!canAnalyze && assignedStudents.length > 0 && (
          <div className="glass-card p-7">
            <h2 className="text-lg font-semibold mb-4">Ученики</h2>
            <div className="space-y-2">
              {assignedStudents.map(s => (
                <div key={s.user_id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                  <div>
                    <div className="text-sm font-medium text-white/70">{s.username}</div>
                    <div className="text-xs text-white/25">{s.full_name || ''}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStressLevel(s.normalized_score).bg} ${getStressLevel(s.normalized_score).color}`}>
                    {Math.round(s.normalized_score * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {canAnalyze && activeTab === 'analyze' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
                <h2 className="text-xl font-semibold mb-5 flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary-400" />
                  Запуск анализа
                </h2>
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400/60 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-amber-400/80 text-sm mb-1">Важное предупреждение</h3>
                        <p className="text-xs text-white/30 leading-relaxed">
                          Данный инструмент предназначен только для исследовательских целей. Он НЕ ставит медицинский диагноз. При проблемах со стрессом обратитесь к специалисту.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white/50 mb-3">Источник данных</h3>
                    <button className="w-full p-4 rounded-xl bg-primary-500/[0.06] border border-primary-500/15 text-left hover:bg-primary-500/[0.1] transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-primary-400" />
                        <span className="text-sm font-medium">Пробный датасет</span>
                      </div>
                      <p className="text-xs text-white/25">Случайные данные для демонстрации</p>
                    </button>
                  </div>
                  <label className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] cursor-pointer hover:bg-white/[0.04] transition-all">
                    <input type="checkbox" checked={consentConfirmed} onChange={e => setConsentConfirmed(e.target.checked)} className="mt-1 w-4 h-4 rounded accent-primary-500" />
                    <div>
                      <span className="text-sm font-medium">Подтверждаю согласие</span>
                      <p className="text-xs text-white/25 mt-1">Данные будут анонимизированы и использованы только в исследовательских целях.</p>
                    </div>
                  </label>
                  <button onClick={runAnalysis} disabled={isAnalyzing || !consentConfirmed}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-2">
                    {isAnalyzing ? (<><Loader2 className="w-4 h-4 animate-spin" />Анализ...</>) : (<><Brain className="w-4 h-4" />Запустить анализ стресса</>)}
                  </button>
                </div>
              </motion.div>

              {analysisResult && (
                <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
                  <h3 className="text-lg font-semibold mb-1">Детализация компонентов</h3>
                  <p className="text-xs text-white/25 mb-5">Выше % — сильнее признак стресса по данному фактору</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Изменение активности', value: analysisResult.component_scores.activity_change, icon: Activity },
                      { label: 'Тональность текстов', value: analysisResult.component_scores.sentiment, icon: TrendingUp },
                      { label: 'Социальные связи', value: analysisResult.component_scores.social_interactions, icon: Users },
                      { label: 'Режим сна', value: analysisResult.component_scores.time_patterns, icon: Clock },
                      { label: 'Геолокация', value: analysisResult.component_scores.geolocation || 0, icon: MapPin },
                      { label: 'Академический контент', value: analysisResult.component_scores.academic_mentions, icon: BookOpen },
                      { label: 'Социальное признание', value: analysisResult.component_scores.social_feedback, icon: MessageCircle },
                    ].map(item => {
                      const norm = Math.max(0, Math.min(1, item.value || 0))
                      const color = norm > 0.6 ? 'from-red-500 to-rose-500' : norm > 0.3 ? 'from-amber-500 to-orange-500' : 'from-emerald-500 to-teal-500'
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-white/30" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-white/60">{item.label}</span>
                              <span className="text-xs text-white/40">{(norm * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${norm * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${color}`} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              {analysisResult ? (
                <>
                  <div className="glass-card p-7">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">Уровень стресса</h2>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStressLevel(analysisResult.normalized_score).bg} ${getStressLevel(analysisResult.normalized_score).color}`}>
                        {getStressLevel(analysisResult.normalized_score).label}
                      </span>
                    </div>
                    <StressGauge score={analysisResult.normalized_score} size={240} />
                  </div>
                  <div className="glass-card p-7">
                    <h3 className="text-lg font-semibold mb-1">Радар-анализ</h3>
                    <p className="text-xs text-white/25 mb-4">Дальше от центра — сильнее признак стресса</p>
                    <StressRadar data={radarData} height={280} />
                  </div>
                  <div className="glass-card p-7">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-400" />История сканирований
                    </h3>
                    {timeSeriesData.length > 1 ? (
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={timeSeriesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                            <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} domain={[0, 1]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: 'rgba(3,0,20,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '12px' }}
                              formatter={(val) => [`${Math.round(val * 100)}%`, 'Уровень стресса']}
                            />
                            <Line type="monotone" dataKey="stress" stroke="url(#trendGrad)" strokeWidth={2.5}
                              dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                            <defs>
                              <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" />
                              </linearGradient>
                            </defs>
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-sm text-white/25">График появится после нескольких сканирований</p>
                        <p className="text-xs text-white/15 mt-1">Каждая точка — результат очередного анализа</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary-500/[0.06] flex items-center justify-center mb-5">
                    <Brain className="w-10 h-10 text-primary-400/40" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white/60">Анализ ещё не проводился</h3>
                  <p className="text-sm text-white/25 max-w-sm">Запустите первый анализ стресса, чтобы увидеть детальную визуализацию и разбивку по компонентам.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {canAnalyze && activeTab === 'history' && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
            <h2 className="text-xl font-semibold mb-5">История анализов</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-primary-400 animate-spin" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4"><Calendar className="w-8 h-8 text-white/15" /></div>
                <p className="text-white/25 text-sm">Анализов пока нет. Запустите первый анализ.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.015] border border-white/[0.03]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"><Activity className="w-5 h-5 text-primary-400/60" /></div>
                      <div>
                        <div className="text-sm font-medium text-white/70">{item.platform}</div>
                        <div className="text-xs text-white/25">{new Date(item.processed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStressLevel(item.normalized_score).bg} ${getStressLevel(item.normalized_score).color}`}>
                      {Math.round(item.normalized_score * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
