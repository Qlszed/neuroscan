import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsService } from '../services/api'
import StressGauge from '../components/StressGauge'
import { BarChart3, Users, Loader2 } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function CuratorPanel() {
  const { user, canViewGroupSummary } = useAuth()
  const navigate = useNavigate()
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !canViewGroupSummary) { navigate('/dashboard'); return }
    loadData()
  }, [user, canViewGroupSummary, navigate])

  const loadData = async () => {
    try {
      const data = await reportsService.getGroupSummary()
      setSummaries(data)
    } catch (err) {
      console.error('Failed to load group summary:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !canViewGroupSummary) return null

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <h1 className="text-3xl font-display font-bold">
              Панель <span className="gradient-text">Куратора</span>
            </h1>
          </div>
          <p className="text-white/55 ml-13">Обзор уровня стресса по закрепленным группам</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <p className="text-white/50">Нет данных по закрепленным классам</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((s, i) => (
              <motion.div
                key={s.class_name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="glass-card p-7 flex flex-col items-center"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-lg font-semibold">Класс {s.class_name}</h3>
                </div>

                <StressGauge score={s.avg_stress} size={200} showLabel={true} />

                <div className="mt-5 w-full space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/50">Учеников:</span>
                    <span className="text-white/60 font-medium">{s.student_count}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 p-2 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10 text-center">
                      <div className="text-lg font-bold text-emerald-400">{s.low_count}</div>
                      <div className="text-xs text-white/55">Норма</div>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 text-center">
                      <div className="text-lg font-bold text-amber-400">{s.moderate_count}</div>
                      <div className="text-xs text-white/55">Внимание</div>
                    </div>
                    <div className="flex-1 p-2 rounded-lg bg-red-500/[0.06] border border-red-500/10 text-center">
                      <div className="text-lg font-bold text-red-400">{s.high_count}</div>
                      <div className="text-xs text-white/55">Риск</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
