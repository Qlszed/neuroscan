import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Brain, Shield, Zap, Users, BarChart3, Sparkles, Activity, Clock, MessageSquare, MapPin, BookOpen, Heart } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] }
  })
}

const features = [
  {
    icon: Brain,
    title: 'Анализ тональности',
    description: 'Автоматическое выявление сдвига эмоциональной окраски публикаций. Негативный тон — самый значимый маркер стресса.',
    color: 'from-primary-500 to-primary-600',
    glow: 'group-hover:shadow-primary-500/20'
  },
  {
    icon: Shield,
    title: 'Приватность',
    description: 'Данные анонимизируются, персональная информация не сохраняется. Анализ только с согласия пользователя.',
    color: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/20'
  },
  {
    icon: Zap,
    title: 'Автоматический анализ',
    description: 'Не нужны опросники и самоотчёты. Система сама собирает и анализирует данные за секунды.',
    color: 'from-amber-400 to-orange-500',
    glow: 'group-hover:shadow-amber-500/20'
  },
  {
    icon: Users,
    title: 'Для школьных психологов',
    description: 'Помогает заметить ученика из группы риска до кризиса, а не после. Расширяет возможности, не заменяя специалиста.',
    color: 'from-violet-500 to-purple-500',
    glow: 'group-hover:shadow-violet-500/20'
  },
  {
    icon: BarChart3,
    title: 'Интерактивные графики',
    description: 'Радарная диаграмма, тренд по времени, разбивка по компонентам. Визуально понятно, где именно изменились паттерны.',
    color: 'from-cyan-400 to-blue-500',
    glow: 'group-hover:shadow-cyan-500/20'
  },
  {
    icon: Sparkles,
    title: '7-компонентная модель',
    description: 'Активность, тональность, соц. связи, сон, геолокация, академический контент, признание. Каждый компонент взвешен по данным исследований.',
    color: 'from-pink-500 to-rose-500',
    glow: 'group-hover:shadow-pink-500/20'
  },
]

const components = [
  { icon: Activity, name: 'Изменение активности', weight: '15%' },
  { icon: MessageSquare, name: 'Тональность текстов', weight: '20%' },
  { icon: Users, name: 'Социальные связи', weight: '12%' },
  { icon: Clock, name: 'Режим сна', weight: '18%' },
  { icon: MapPin, name: 'Геолокация', weight: '5%' },
  { icon: BookOpen, name: 'Академический контент', weight: '15%' },
  { icon: Heart, name: 'Социальное признание', weight: '15%' },
]

const stats = [
  { value: '7', label: 'Компоненты анализа' },
  { value: '78-86%', label: 'Точность модели' },
  { value: '<2с', label: 'Время обработки' },
  { value: '100%', label: 'Приватность' },
]

const constellationLines = [
  { x1: 15, y1: 20, x2: 35, y2: 15 },
  { x1: 35, y1: 15, x2: 55, y2: 25 },
  { x1: 55, y1: 25, x2: 75, y2: 12 },
  { x1: 75, y1: 12, x2: 85, y2: 30 },
  { x1: 25, y1: 40, x2: 50, y2: 35 },
  { x1: 50, y1: 35, x2: 70, y2: 45 },
  { x1: 10, y1: 55, x2: 30, y2: 50 },
  { x1: 30, y1: 50, x2: 55, y2: 55 },
  { x1: 55, y1: 55, x2: 80, y2: 50 },
  { x1: 20, y1: 70, x2: 45, y2: 65 },
  { x1: 45, y1: 65, x2: 65, y2: 72 },
  { x1: 65, y1: 72, x2: 85, y2: 68 },
  { x1: 35, y1: 15, x2: 25, y2: 40 },
  { x1: 55, y1: 25, x2: 50, y2: 35 },
  { x1: 75, y1: 12, x2: 70, y2: 45 },
  { x1: 50, y1: 35, x2: 55, y2: 55 },
  { x1: 30, y1: 50, x2: 45, y2: 65 },
]

const constellationDots = [
  { cx: 15, cy: 20 }, { cx: 35, cy: 15 }, { cx: 55, cy: 25 }, { cx: 75, cy: 12 },
  { cx: 85, cy: 30 }, { cx: 25, cy: 40 }, { cx: 50, cy: 35 }, { cx: 70, cy: 45 },
  { cx: 10, cy: 55 }, { cx: 30, cy: 50 }, { cx: 55, cy: 55 }, { cx: 80, cy: 50 },
  { cx: 20, cy: 70 }, { cx: 45, cy: 65 }, { cx: 65, cy: 72 }, { cx: 85, cy: 68 },
]

export default function Landing() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2])

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="glow-orb glow-orb-indigo w-[400px] h-[400px] -top-20 -right-20 animate-orb-1" />
        <div className="glow-orb glow-orb-purple w-[350px] h-[350px] top-[40%] -left-20 animate-orb-2" />
        <div className="glow-orb glow-orb-cyan w-[300px] h-[300px] bottom-[10%] left-[30%] animate-orb-3" />
      </div>

      <section ref={heroRef} className="relative pt-32 pb-20 px-6">
        <motion.div style={{ y: heroY, opacity: heroOpacity }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto relative">
              <div className="absolute inset-0 -top-20 -bottom-10 pointer-events-none opacity-20">
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  {constellationLines.map((l, i) => (
                    <line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                      stroke="rgba(99,102,241,0.25)" strokeWidth="0.15" />
                  ))}
                  {constellationDots.map((d, i) => (
                    <circle key={`d${i}`} cx={d.cx} cy={d.cy} r="0.6"
                      fill="rgba(139,92,246,0.4)" />
                  ))}
                </svg>
              </div>

              <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] mb-8 relative z-10"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm text-white/50">Исследовательский проект НИШ Караганда</span>
              </motion.div>

              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] mb-6 tracking-tight relative z-10"
              >
                Определение академического
                <br />
                стресса с помощью{' '}
                <span className="gradient-text-shimmer">ИИ</span>
              </motion.h1>

              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="text-lg md:text-xl text-white/35 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10"
              >
                Автоматический анализ цифрового следа для выявления паттернов стресса у одарённых подростков. Мы видим то, о чём молчат.
              </motion.p>

              <motion.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10"
              >
                <Link
                  to="/register"
                  className="btn-primary flex items-center gap-2 text-lg"
                >
                  Начать анализ
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="btn-secondary flex items-center gap-2"
                >
                  Узнать больше
                </Link>
              </motion.div>
            </div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mt-20"
            >
              <div className="glass-card p-8 md:p-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-3xl md:text-4xl font-bold gradient-text mb-2 font-display">
                        {stat.value}
                      </div>
                      <div className="text-sm text-white/30">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="section-title mb-4"
            >
              Почему <span className="gradient-text">NeuroScan</span>?
            </motion.h2>
            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="section-subtitle"
            >
              Заметить проблему до кризиса, а не после. Приватность, точность, благополучие учеников.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group p-7 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/20 transition-all duration-500 hover:bg-white/[0.03]"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-5 transform group-hover:scale-110 transition-transform duration-300 shadow-lg ${feature.glow}`}>
                  <feature.icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white/90">{feature.title}</h3>
                <p className="text-white/30 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="section-title mb-4"
            >
              7-компонентная <span className="gradient-text">модель</span>
            </motion.h2>
            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="section-subtitle"
            >
              Семь измеримых индикаторов цифрового поведения, каждый со своим весом. Сигмоидная функция превращает их в оценку от 0 до 1.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {components.map((comp, i) => (
              <motion.div
                key={comp.name}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/20 transition-all duration-300 hover:bg-white/[0.03]"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-primary-500/30 group-hover:to-accent-500/30 transition-all">
                  <comp.icon className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/80">{comp.name}</div>
                  <div className="text-xs text-white/30">Вес: {comp.weight}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-accent-500/5 pointer-events-none" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
                Готовы анализировать <span className="gradient-text-shimmer">цифровой след</span>?
              </h2>
              <p className="text-lg text-white/30 mb-10 max-w-2xl mx-auto">
                Попробуйте анализ с образцом данных и увидьте, как семикомпонентная модель работает на практике.
              </p>
              <Link
                to="/register"
                className="btn-primary inline-flex items-center gap-2 text-lg"
              >
                Начать бесплатно
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
