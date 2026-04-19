import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Brain, GraduationCap, Users, BookOpen, Target, Lightbulb, Shield, Lock, Eye, UserCheck, Database, FileText, AlertTriangle, Heart, Activity, MessageSquare, Clock, MapPin, ArrowRight, Cpu, BarChart3, Mail, Send, Loader2, CheckCircle } from 'lucide-react'
import { contactService } from '../services/api'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] }
  })
}

const researchAreas = [
  { icon: GraduationCap, title: 'Академический стресс у одарённых подростков', description: 'Ученики специализированных школ, таких как НИШ, КТЛ и РФМШ, сталкиваются с уникальным давлением: высокие академические ожидания, конкурентная среда и жизнь в общежитии вдали от семьи.' },
  { icon: Brain, title: 'Цифровой след как источник данных', description: 'Изменения в цифровом поведении — частота публикаций, тональность, социальные взаимодействия — коррелируют с психологическим состоянием. Наша система автоматически обнаруживает эти паттерны.' },
  { icon: Users, title: 'Автоматизированное неинвазивное обнаружение', description: 'В отличие от опросников и самоотчётов, наша система не требует активного участия. Она анализирует общедоступные данные с полного согласия пользователя.' },
  { icon: BookOpen, title: 'Методология, обоснованная исследованиями', description: 'Основано на международных исследованиях: скандинавские модели превентивной поддержки, китайский опыт цифрового мониторинга и казахстанские исследования образовательной психологии.' },
  { icon: Target, title: 'Семикомпонентная математическая модель', description: 'Изменение активности, тональность, социальные взаимодействия, временные паттерны, геолокация, упоминания учёбы и социальная обратная связь — каждый взвешен по значимости, обоснованной доказательствами.' },
  { icon: Lightbulb, title: 'Инструмент ранней профилактики', description: 'Система помогает школьным психологам выявлять учащихся из группы риска до наступления кризиса, обеспечивая проактивную, а не реактивную поддержку.' },
]

const steps = [
  { num: '01', title: 'Ввод ссылки на профиль', desc: 'Пользователь предоставляет ссылку на профиль в соцсетях или выбирает образец данных для анализа.', icon: Database },
  { num: '02', title: 'Сбор данных', desc: 'Система автоматически собирает общедоступные данные цифрового следа из профиля.', icon: Cpu },
  { num: '03', title: 'Анализ тональности', desc: 'Модель RuBERT анализирует эмоциональную окраску всего текстового контента — посты, комментарии, подписи.', icon: MessageSquare },
  { num: '04', title: 'Оценка по 7 компонентам', desc: 'Семь математических компонентов рассчитывают индикаторы стресса по различным поведенческим измерениям.', icon: BarChart3 },
  { num: '05', title: 'Взвешенная агрегация', desc: 'Компоненты объединяются с использованием весов, обоснованных исследованиями, для получения единой оценки стресса.', icon: Activity },
  { num: '06', title: 'Визуализация', desc: 'Результаты представлены в виде интерактивных графиков — радарная диаграмма, временные ряды и разбивка по компонентам.', icon: BarChart3 },
  { num: '07', title: 'Этическая проверка', desc: 'Хранятся только анонимизированные данные. Результаты доступны только авторизованным специалистам с согласия пользователя.', icon: Shield },
]

const components = [
  { icon: Activity, name: 'Изменение активности', weight: 1.8, desc: 'Отслеживает изменения частоты публикаций — резкие спады или всплески указывают на возможный стресс.' },
  { icon: MessageSquare, name: 'Тональность', weight: 2.8, desc: 'ИИ анализирует эмоциональную окраску текста. Негативный сдвиг от личной базовой линии сигнализирует о стрессе.' },
  { icon: Users, name: 'Социальные взаимодействия', weight: 2.2, desc: 'Отслеживает паттерны вовлечённости. Социальная изоляция и снижение взаимодействий указывают на замкнутость.' },
  { icon: Clock, name: 'Временные паттерны', weight: 1.5, desc: 'Обнаруживает всплески ночной активности, коррелирующие с нарушением сна и тревожностью.' },
  { icon: MapPin, name: 'Геолокация', weight: 1.2, desc: 'Измеряет разнообразие локаций. Ограничение малым числом мест может сигнализировать об избегающем поведении.' },
  { icon: BookOpen, name: 'Упоминания учёбы', weight: 2.0, desc: 'Выявляет и оценивает негативные упоминания об учёбе — тревога перед экзаменами, фрустрация от занятий.' },
  { icon: Heart, name: 'Социальная обратная связь', weight: 1.4, desc: 'Анализирует полученные реакции. Резкое падение вовлечённости может влиять на самооценку подростков.' },
]

const principles = [
  { icon: UserCheck, title: 'Информированное согласие', desc: 'Весь анализ данных требует явного, информированного согласия пользователя. Без него анализ не проводится. Пользователь может отозвать согласие в любое время.' },
  { icon: Lock, title: 'Анонимизация данных', desc: 'Персональные данные в исходном виде никогда не хранятся. URL-адреса профилей преобразуются в анонимизированные хэши. Сохраняются только агрегированные оценки и значения компонентов.' },
  { icon: Eye, title: 'Прозрачность', desc: 'Пользователи могут в любое время просмотреть свои данные, результаты анализа и способы расчёта оценок. 7-компонентная модель и веса полностью задокументированы.' },
  { icon: Shield, title: 'Контроль доступа', desc: 'Результаты анализа видны только пользователю и авторизованным специалистам. Администрация школы не может получить доступ к индивидуальным результатам без согласия.' },
  { icon: Database, title: 'Минимальный сбор данных', desc: 'Собираются только данные, относящиеся к обнаружению стресса. Никакая лишняя персональная информация не запрашивается и не хранится.' },
  { icon: Heart, title: 'Недиагностическое назначение', desc: 'Эта система НЕ ставит медицинские или психологические диагнозы. Она служит инструментом раннего предупреждения для квалифицированных специалистов.' },
]

export function About() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible" className="section-title mb-4">
            О <span className="gradient-text">исследовании</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="section-subtitle">
            Автоматизированная система обнаружения академического стресса у одарённых подростков через анализ цифрового следа.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
          {researchAreas.map((area, i) => (
            <motion.div key={area.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="group p-7 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/15 transition-all duration-500 hover:bg-white/[0.025]">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center mb-5 group-hover:from-primary-500/25 group-hover:to-accent-500/25 transition-all">
                <area.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white/80">{area.title}</h3>
              <p className="text-sm text-white/25 leading-relaxed">{area.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10 mb-16">
          <h2 className="text-2xl font-display font-bold mb-6"><span className="gradient-text">Проблема</span></h2>
          <div className="space-y-4 text-white/30 text-sm leading-relaxed">
            <p>Одарённые подростки в специализированных школах, таких как Назарбаев Интеллектуальные Школы (НИШ), Казахстанско-Турецкие Лицеи (КТЛ) и Республиканские Физико-Математические Школы (РФМШ), находятся под постоянным академическим давлением. Учебный день начинается в 7 утра и заканчивается после самоподготовки в 10 вечера — практически без времени на отдых между уроками, дополнительными занятиями и домашними заданиями.</p>
            <p>Большинство учеников живут в общежитиях вдали от своих семей. Нет личного пространства, нет возможности отстраниться от конфликтов. Получение трёх неудовлетворительных оценок за семестр может привести к потере образовательного гранта. Трёхъязычная программа — предметы на казахском, русском и английском — добавляет когнитивную перегрузку.</p>
            <p>По данным ВОЗ, каждый шестой подросток в возрасте 13–19 лет сталкивается с проблемами психического здоровья. Однако одарённые ученики редко обращаются за помощью — признание проблем противоречит их самоидентификации как сильных и способных. Вместо этого они бессознательно оставляют следы своего состояния в соцсетях: меняется тон постов, сужается круг общения, появляются упоминания «не могу больше», «устал», «хочу всё бросить».</p>
          </div>
        </motion.div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-display font-bold mb-6">Наша <span className="gradient-text">миссия</span></h2>
          <div className="space-y-4 text-white/30 text-sm leading-relaxed">
            <p>Мы создаём инструмент, который помогает школьным психологам выявлять учащихся из группы риска до наступления кризиса — проактивно, а не реактивно. Наша система не заменяет специалистов-людей; она расширяет их возможности, отмечая учеников, которым может понадобиться поддержка, но которые за ней не обратились.</p>
            <p>Система полностью автоматизирована: психолог вводит ссылку на профиль, и ИИ автоматически собирает и анализирует необходимые данные. Никакого ручного ввода данных, никаких самоотчётов, никаких опросников. Семикомпонентная математическая модель обеспечивает комплексную оценку стресса, обоснованную доказательствами.</p>
            <p className="text-white/40 font-medium">Исследовательская команда: Енбаев Жанадил & Сулеймен Ерасыл, ученики 11 класса НИШ Караганда. Научный руководитель: Давлетгариев Глеб Фаритович.</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible" className="section-title mb-4">
            Как работает <span className="gradient-text">NeuroScan</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="section-subtitle">
            Полностью автоматизированный 7-шаговый пайплайн от ввода данных до получения показателей стресса.
          </motion.p>
        </div>

        <section className="mb-20">
          <motion.h2 custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-2xl font-display font-bold mb-10">
            Пайплайн <span className="gradient-text">анализа</span>
          </motion.h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div key={step.num} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group flex items-start gap-6 p-6 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/15 transition-all duration-300 hover:bg-white/[0.025]">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center group-hover:from-primary-500/25 group-hover:to-accent-500/25 transition-all">
                    <step.icon className="w-5 h-5 text-primary-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs text-primary-400/50 font-mono">{step.num}</span>
                    <h3 className="font-semibold text-white/80">{step.title}</h3>
                  </div>
                  <p className="text-sm text-white/30 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-12">
            <motion.h2 custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="section-title mb-4">
              7-компонентная <span className="gradient-text">модель</span>
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="section-subtitle">
              Каждый компонент измеряет отдельное поведенческое измерение, взвешенное по значимости, обоснованной исследованиями.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {components.map((comp, i) => (
              <motion.div key={comp.name} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group p-6 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/15 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center flex-shrink-0">
                    <comp.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm text-white/80">{comp.name}</h3>
                      <span className="text-xs text-primary-400/60 font-mono">w = {comp.weight}</span>
                    </div>
                    <p className="text-xs text-white/25 leading-relaxed">{comp.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="glass-card p-10 md:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/[0.03] to-accent-500/[0.03] pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Готовы <span className="gradient-text">анализировать</span>?
              </h2>
              <p className="text-white/30 mb-8 max-w-xl mx-auto">Начните свой первый анализ с нашим образцом данных и посмотрите, как 7-компонентная модель работает на практике.</p>
              <Link to="/register" className="btn-primary inline-flex items-center gap-2">Начать <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export function Ethics() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible" className="section-title mb-4">
            Этика и <span className="gradient-text">приватность</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="section-subtitle">
            Наша приверженность этичному ИИ, защите данных и ответственному использованию технологий.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {principles.map((p, i) => (
            <motion.div key={p.title} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="group p-7 rounded-2xl bg-white/[0.015] border border-white/[0.04] hover:border-primary-500/15 transition-all duration-500">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center mb-5 group-hover:from-primary-500/25 group-hover:to-accent-500/25 transition-all">
                <p.icon className="w-5 h-5 text-primary-400" />
              </div>
              <h3 className="text-base font-semibold mb-2 text-white/80">{p.title}</h3>
              <p className="text-sm text-white/25 leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10 mb-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400/70" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold mb-1 text-amber-400/80">Важное предупреждение</h2>
              <p className="text-sm text-white/25">Эта система не является диагностическим инструментом</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-white/30 leading-relaxed">
            <p>NeuroScan разработан как вспомогательный инструмент для школьных психологов и консультантов. Он НЕ ставит медицинские, психологические или психиатрические диагнозы. Оценки стресса представляют статистические индикаторы на основе паттернов цифрового поведения, а не клинические заключения.</p>
            <p>Если вы или кто-то из ваших знакомых испытывает трудности с психическим здоровьем, немедленно обратитесь к квалифицированному специалисту по психическому здоровью или на горячую линию помощи. Этот инструмент никогда не следует использовать как замену профессиональной помощи.</p>
          </div>
        </motion.div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10">
          <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary-400" />
            Принципы обработки <span className="gradient-text">данных</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Что мы собираем</h3>
                <p className="text-xs text-white/25">Только общедоступные данные цифрового следа с явного согласия пользователя: частота публикаций, текстовый контент для анализа тональности, временные метки и метрики вовлечённости.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Что мы храним</h3>
                <p className="text-xs text-white/25">Только анонимизированные, агрегированные данные: оценки стресса, значения компонентов и хэшированные идентификаторы. Исходный текст и персональная информация никогда не хранятся на постоянной основе.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Кто имеет доступ</h3>
                <p className="text-xs text-white/25">Только пользователь и его школьный психолог могут просматривать индивидуальные результаты. Третьи стороны, включая администрацию школы, не имеют доступа без явного согласия.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Ваши права</h3>
                <p className="text-xs text-white/25">Вы можете в любое время просмотреть, экспортировать или удалить свои данные. Вы можете отозвать согласие, что приостановит весь анализ. Удаление аккаунта навсегда удаляет все связанные данные.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true); setError('')
    try {
      await contactService.submit(formData)
      setSuccess(true); setFormData({ name: '', email: '', subject: '', message: '' })
    } catch { setError('Не удалось отправить сообщение. Попробуйте ещё раз.') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible" className="section-title mb-4">
            Связаться <span className="gradient-text">с нами</span>
          </motion.h1>
          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible" className="section-subtitle">
            Есть вопросы о нашем исследовании или хотите сотрудничать? Мы будем рады услышать от вас.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            {[
              { icon: Mail, title: 'Email', detail: 'neuroscan@nis.kz' },
              { icon: MapPin, title: 'Адрес', detail: 'Караганда, Казахстан' },
              { icon: Clock, title: 'Время ответа', detail: 'В течение 48 часов' },
            ].map((item) => (
              <div key={item.title} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white/70 mb-1">{item.title}</h3>
                    <p className="text-sm text-white/30">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="lg:col-span-2">
            <div className="glass-card p-8">
              {success ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white/80">Сообщение отправлено!</h3>
                  <p className="text-sm text-white/30 mb-6">Спасибо, что связались с нами. Мы ответим вам в ближайшее время.</p>
                  <button onClick={() => setSuccess(false)} className="btn-secondary text-sm">Отправить ещё</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-2">Имя</label>
                      <input type="text" name="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Ваше имя" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/50 mb-2">Email</label>
                      <input type="email" name="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-field" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">Тема</label>
                    <input type="text" name="subject" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-field" placeholder="О чём ваше сообщение?" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/50 mb-2">Сообщение</label>
                    <textarea name="message" required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="input-field resize-none" placeholder="Расскажите подробнее..." />
                  </div>
                  {error && <div className="py-3 px-4 rounded-xl bg-red-500/[0.08] border border-red-500/20"><p className="text-red-400 text-sm">{error}</p></div>}
                  <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2 text-sm">
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Отправка...</> : <><Send className="w-4 h-4" />Отправить</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
