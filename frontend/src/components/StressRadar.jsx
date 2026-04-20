import { useState, useEffect } from 'react'
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts'

const SHORT_LABELS = {
  'Изменение активности': 'Активность',
  'Тональность текстов': 'Тональность',
  'Социальные связи': 'Соц. связи',
  'Режим сна': 'Сон',
  'Геолокация': 'Геолокация',
  'Академический контент': 'Академика',
  'Социальное признание': 'Признание',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const { subject, value } = payload[0].payload
  return (
    <div className="bg-[rgba(3,0,20,0.95)] border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-white/50 mb-0.5">{subject}</p>
      <p className="text-white font-semibold">{Math.round(value)}%</p>
    </div>
  )
}

export default function StressRadar({ data = [], height = 280 }) {
  const [animatedData, setAnimatedData] = useState([])
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    if (!data.length) return
    const chartData = data.map(d => ({
      ...d,
      subject: SHORT_LABELS[d.subject] || d.subject,
      originalSubject: d.subject,
      ref: 50,
      value: 0,
    }))
    setAnimatedData(chartData)
    setIsAnimating(true)

    const timer = setTimeout(() => {
      setAnimatedData(prev =>
        prev.map(d => ({
          ...d,
          value: data.find(dd => dd.subject === d.originalSubject)?.value ?? d.value,
        }))
      )
      setIsAnimating(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [data])

  if (!data.length) return null

  return (
    <div style={{ height, animation: 'radarFillIn 0.6s ease-out' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={animatedData} outerRadius="72%">
          <PolarGrid
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="2 4"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Референс"
            dataKey="ref"
            stroke="rgba(255,255,255,0.06)"
            fill="rgba(255,255,255,0.02)"
            strokeWidth={0.5}
            strokeDasharray="3 6"
          />
          <Radar
            name="Стресс"
            dataKey="value"
            stroke="#818cf8"
            fill="#6366f1"
            fillOpacity={0.18}
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#818cf8', stroke: '#6366f1', strokeWidth: 1.5, fillOpacity: 0.9 }}
            activeDot={{ r: 5, fill: '#a5b4fc', stroke: '#6366f1', strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
