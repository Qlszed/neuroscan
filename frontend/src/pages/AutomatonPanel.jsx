import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analysisService } from '../services/api'
import StressGauge from '../components/StressGauge'
import StressRadar from '../components/StressRadar'
import { Cpu, Loader2, Send, Sliders, MessageSquare, Activity, Clock, MapPin, BookOpen, Heart, Users, TrendingUp } from 'lucide-react'

const COMPONENT_DEFS = [
  { key: 'activity_change', label: 'Изменение активности', icon: Activity, weight: 1.8 },
  { key: 'sentiment', label: 'Тональность текстов', icon: TrendingUp, weight: 2.8 },
  { key: 'social_interactions', label: 'Социальные связи', icon: Users, weight: 2.2 },
  { key: 'time_patterns', label: 'Режим сна', icon: Clock, weight: 1.5 },
  { key: 'geolocation', label: 'Геолокация', icon: MapPin, weight: 1.2 },
  { key: 'academic_mentions', label: 'Академический контент', icon: BookOpen, weight: 2.0 },
  { key: 'social_feedback', label: 'Социальное признание', icon: Heart, weight: 1.4 },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function AutomatonPanel() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sentimentText, setSentimentText] = useState('')
  const [sentimentResult, setSentimentResult] = useState(null)
  const [sentimentLoading, setSentimentLoading] = useState(false)
  const [sentimentMethod, setSentimentMethod] = useState('')

  const [components, setComponents] = useState({
    activity_change: 30,
    sentiment: 30,
    social_interactions: 30,
    time_patterns: 30,
    geolocation: 30,
    academic_mentions: 30,
    social_feedback: 30,
  })

  const [stressResult, setStressResult] = useState(null)
  const [computeLoading, setComputeLoading] = useState(false)

  if (!user || user.role !== 'automaton') {
    navigate('/dashboard')
    return null
  }

  const testSentiment = async () => {
    if (!sentimentText.trim()) return
    setSentimentLoading(true)
    try {
      const result = await analysisService.sentimentTest(sentimentText)
      setSentimentResult({ positive: result.positive, neutral: result.neutral, negative: result.negative })
      setSentimentMethod(result.method)

      const negScore = Math.round(result.negative * 100)
      setComponents(prev => ({ ...prev, sentiment: negScore }))
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) alert(detail)
    } finally { setSentimentLoading(false) }
  }

  const computeStress = async () => {
    setComputeLoading(true)
    try {
      const compObj = {}
      for (const c of COMPONENT_DEFS) {
        compObj[c.key] = components[c.key] / 100
      }
      const result = await analysisService.manualCompute(compObj, null)
      setStressResult(result)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail) alert(detail)
    } finally { setComputeLoading(false) }
  }

  const updateSlider = (key, val) => {
    setComponents(prev => ({ ...prev, [key]: parseInt(val) }))
    setStressResult(null)
  }

  const radarData = stressResult?.radar_chart_data
    ? Object.entries(stressResult.radar_chart_data).map(([subject, value]) => ({ subject, value, fullMark: 100 }))
    : []

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            Панель <span className="gradient-text">автомата</span>
          </h1>
          <p className="text-white/55">Ручная настройка компонентов и анализ тональности текста</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-primary-400" />
                Анализ тональности
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/50 mb-2">Введите текст для анализа</label>
                  <textarea
                    value={sentimentText}
                    onChange={e => setSentimentText(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Например: Устал от бесконечных контрольных, не могу сосредоточиться..."
                  />
                </div>
                <button onClick={testSentiment} disabled={sentimentLoading || !sentimentText.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-2">
                  {sentimentLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Анализ...</>) : (<><Send className="w-4 h-4" />Анализировать тональность</>)}
                </button>

                {sentimentResult && (
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white/50">Метод анализа</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${sentimentMethod === 'rubert' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {sentimentMethod === 'rubert' ? 'RuBERT' : 'Ключевые слова'}
                      </span>
                    </div>
                    {[
                      { label: 'Позитивная', value: sentimentResult.positive, color: 'bg-emerald-500' },
                      { label: 'Нейтральная', value: sentimentResult.neutral, color: 'bg-slate-400' },
                      { label: 'Негативная', value: sentimentResult.negative, color: 'bg-red-500' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/50">{s.label}</span>
                          <span className="text-xs font-bold text-white/70">{(s.value * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.value * 100}%`, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-white/35 pt-1">
                      Результат тональности автоматически подставлен в слайдер «Тональность текстов»
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card p-7">
              <h2 className="text-xl font-semibold mb-5 flex items-center gap-3">
                <Sliders className="w-5 h-5 text-primary-400" />
                Настройка компонентов
              </h2>
              <div className="space-y-4">
                {COMPONENT_DEFS.map(c => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <c.icon className="w-4 h-4 text-white/40" />
                        <span className="text-xs font-medium text-white/60">{c.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary-400/60 font-mono">w={c.weight}</span>
                        <span className="text-xs font-bold text-white/70 min-w-[36px] text-right">{components[c.key]}%</span>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={components[c.key]}
                      onChange={e => updateSlider(c.key, e.target.value)}
                      className="w-full h-1.5 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-primary-500
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary-500/30
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary-500 [&::-moz-range-thumb]:border-0" />
                  </div>
                ))}
                <button onClick={computeStress} disabled={computeLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold text-sm disabled:opacity-40 hover:shadow-lg hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-2 mt-2">
                  {computeLoading ? (<><Loader2 className="w-4 h-4 animate-spin" />Расчёт...</>) : (<><Cpu className="w-4 h-4" />Рассчитать стресс</>)}
                </button>
              </div>
            </motion.div>
          </div>

          <div className="space-y-6">
            {stressResult ? (
              <>
                <div className="glass-card p-7">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Уровень стресса</h2>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      stressResult.normalized_score < 0.3 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      stressResult.normalized_score < 0.7 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                      'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {stressResult.normalized_score < 0.3 ? 'Низкий' : stressResult.normalized_score < 0.7 ? 'Умеренный' : 'Высокий'}
                    </span>
                  </div>
                  <StressGauge score={stressResult.normalized_score} size={240} />
                  <div className="mt-4 text-center">
                    <span className="text-xs text-white/35 font-mono">z = {stressResult.stress_score.toFixed(3)}</span>
                  </div>
                </div>
                <div className="glass-card p-7">
                  <h3 className="text-lg font-semibold mb-1">Радар-анализ</h3>
                  <p className="text-xs text-white/50 mb-4">Дальше от центра — сильнее признак стресса</p>
                  <StressRadar data={radarData} height={280} />
                </div>
                <div className="glass-card p-7">
                  <h3 className="text-lg font-semibold mb-3">Формула расчёта</h3>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-white/50 leading-relaxed space-y-1">
                    <p>z = bias + w1*x1 + w2*x2 + ... + w7*x7</p>
                    <p>z = (-4.0) + {COMPONENT_DEFS.map((c, i) => `${c.weight}*${(components[c.key] / 100).toFixed(2)}`).join(' + ')}</p>
                    <p>z = {stressResult.stress_score.toFixed(3)}</p>
                    <p className="pt-1 text-primary-400/70">S = 1/(1+e^(-z)) = {stressResult.normalized_score.toFixed(3)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-card p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary-500/[0.06] flex items-center justify-center mb-5">
                  <Cpu className="w-10 h-10 text-primary-400/40" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white/60">Настройте компоненты</h3>
                <p className="text-sm text-white/50 max-w-sm">Двигайте слайдеры и нажмите «Рассчитать стресс», чтобы увидеть результат. Или сначала протестируйте тональность текста.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
