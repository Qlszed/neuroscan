import { motion } from 'framer-motion'
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
    title: 'Анализ на основе ИИ',
    description: 'Модель RuBERT автоматически анализирует эмоциональную тональность публикаций и сообщений.',
    color: 'from-primary-500 to-primary-600',
    glow: 'group-hover:shadow-primary-500/20'
  },
  {
    icon: Shield,
    title: 'Приватность прежде всего',
    description: 'Данные анонимизируются и шифруются. Персональная информация не сохраняется.',
    color: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/20'
  },
  {
    icon: Zap,
    title: 'Обработка в реальном времени',
    description: 'Получите комплексные индикаторы стресса за секунды благодаря оптимизированному ML-конвейеру.',
    color: 'from-amber-400 to-orange-500',
    glow: 'group-hover:shadow-amber-500/20'
  },
  {
    icon: Users,
    title: 'Научное обоснование',
    description: 'Основано на рецензируемых исследованиях психологии и стресса одарённых подростков.',
    color: 'from-violet-500 to-purple-500',
    glow: 'group-hover:shadow-violet-500/20'
  },
  {
    icon: BarChart3,
    title: 'Визуальные данные',
    description: 'Интерактивные дашборды с радарными диаграммами и визуализацией стресса по временным рядам.',
    color: 'from-cyan-400 to-blue-500',
    glow: 'group-hover:shadow-cyan-500/20'
  },
  {
    icon: Sparkles,
    title: '7-компонентная модель',
    description: 'Комплексный анализ по активности, тональности, временным паттернам и ещё четырём измерениям.',
    color: 'from-pink-500 to-rose-500',
    glow: 'group-hover:shadow-pink-500/20'
  },
]

const components = [
  { icon: Activity, name: 'Изменение активности', weight: '15%' },
  { icon: MessageSquare, name: 'Тональность', weight: '20%' },
  { icon: Users, name: 'Социальные связи', weight: '12%' },
  { icon: Clock, name: 'Временные паттерны', weight: '18%' },
  { icon: MapPin, name: 'Геолокация', weight: '5%' },
  { icon: BookOpen, name: 'Академич. упоминания', weight: '15%' },
  { icon: Heart, name: 'Обратная связь', weight: '15%' },
]

const stats = [
  { value: '7', label: 'Компоненты анализа' },
  { value: '78-86%', label: 'Точность модели' },
  { value: '<2с', label: 'Время обработки' },
  { value: '100%', label: 'Приватность' },
]

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-accent-500/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px]" />
      </div>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-white/50">На базе RuBERT анализа тональности</span>
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.05] mb-6 tracking-tight"
            >
              Определение академического
              <br />
              стресса с помощью{' '}
              <span className="gradient-text">ИИ</span>
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-lg md:text-xl text-white/35 mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Продвинутая система анализа цифрового следа для выявления паттернов стресса у одарённых подростков с помощью машинного обучения.
            </motion.p>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
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
              Основано на передовых исследованиях с акцентом на приватность, точность и благополучие студентов.
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
              Наша математическая модель анализирует семь измеримых индикаторов цифрового поведения для вычисления комплексной оценки стресса.
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
                Готовы анализировать <span className="gradient-text">цифровой след</span>?
              </h2>
              <p className="text-lg text-white/30 mb-10 max-w-2xl mx-auto">
                Присоединяйтесь к нашей исследовательской платформе и получите данные о паттернах академического стресса с полным контролем приватности.
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
