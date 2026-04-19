import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { reportsService } from '../services/api'
import StressGauge from '../components/StressGauge'
import StressRadar from '../components/StressRadar'
import { Eye, Users, Loader2, Activity, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function PsychologistPanel() {
  const { user, canViewReports } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetail, setStudentDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !canViewReports) { navigate('/dashboard'); return }
    loadData()
  }, [user, canViewReports, navigate])

  const loadData = async () => {
    try {
      const data = await reportsService.getAssignedStudents()
      setStudents(data)
      const uid = searchParams.get('uid')
      if (uid) {
        const student = data.find(s => s.user_id === Number(uid))
        if (student) {
          await viewStudent(student.user_id)
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err)
    } finally {
      setLoading(false)
    }
  }

  const viewStudent = async (studentId) => {
    try {
      const data = await reportsService.getStudentLatest(studentId)
      setStudentDetail(data)
      setSelectedStudent(studentId)
    } catch (err) {
      console.error('Failed to load student detail:', err)
    }
  }

  if (!user || !canViewReports) return null

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-violet-400" />
            </div>
            <h1 className="text-3xl font-display font-bold">
              Панель <span className="gradient-text">Психолога</span>
            </h1>
          </div>
          <p className="text-white/35 ml-13">Детальные отчеты по закрепленным классам</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Ученики ({students.length})
              </h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {students.map(s => (
                  <button
                    key={s.user_id}
                    onClick={() => viewStudent(s.user_id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                      selectedStudent === s.user_id
                        ? 'bg-violet-500/10 border border-violet-500/20'
                        : 'bg-white/[0.015] border border-white/[0.03] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium text-white/70">{s.username}</div>
                      <div className="text-xs text-white/25">{s.full_name || ''}</div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      s.normalized_score < 0.3 ? 'text-emerald-400 bg-emerald-500/10' :
                      s.normalized_score < 0.7 ? 'text-amber-400 bg-amber-500/10' :
                      'text-red-400 bg-red-500/10'
                    }`}>
                      {Math.round(s.normalized_score * 100)}%
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2 space-y-6">
              {studentDetail ? (
                <>
                  <div className="glass-card p-7 flex flex-col items-center">
                    <h2 className="text-lg font-semibold mb-4">Уровень стресса</h2>
                    <StressGauge score={studentDetail.normalized_score} size={260} />
                  </div>
                  {studentDetail.radar_chart_data && (
                    <div className="glass-card p-7">
                      <h3 className="text-lg font-semibold mb-4">Радар-анализ</h3>
                      <StressRadar
                        data={Object.entries(studentDetail.radar_chart_data).map(([subject, value]) => ({ subject, value }))}
                        height={260}
                      />
                    </div>
                  )}
                  <div className="glass-card p-7">
                    <h3 className="text-lg font-semibold mb-4">Компоненты</h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Изменение активности', value: studentDetail.component_scores?.activity_change },
                        { label: 'Тональность', value: studentDetail.component_scores?.sentiment },
                        { label: 'Социальные связи', value: studentDetail.component_scores?.social_interactions },
                        { label: 'Временные паттерны', value: studentDetail.component_scores?.time_patterns },
                        { label: 'Геолокация', value: studentDetail.component_scores?.geolocation },
                        { label: 'Академические упоминания', value: studentDetail.component_scores?.academic_mentions },
                        { label: 'Социальная обратная связь', value: studentDetail.component_scores?.social_feedback },
                      ].map(item => {
                        const norm = Math.max(0, Math.min(1, item.value != null ? item.value : 0))
                        return (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs text-white/40 w-48 flex-shrink-0">{item.label}</span>
                            <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${norm * 100}%` }}
                                transition={{ duration: 0.6 }}
                                className={`h-full rounded-full ${
                                  norm > 0.6 ? 'bg-red-500' : norm > 0.35 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              />
                            </div>
                            <span className="text-xs text-white/30 w-10 text-right">{(norm * 100).toFixed(0)}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card p-16 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/[0.06] flex items-center justify-center mb-5">
                    <Activity className="w-8 h-8 text-violet-400/40" />
                  </div>
                  <h3 className="text-lg font-semibold text-white/50 mb-2">Выберите ученика</h3>
                  <p className="text-sm text-white/25">Нажмите на ученика из списка слева для просмотра детального отчёта</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
