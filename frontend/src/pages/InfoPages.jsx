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
  { icon: GraduationCap, title: 'Эффект большого рыбного пруда', description: 'Ученик, который был лучшим в обычной школе, попадает в НИШ или ФМЛ №239 и вдруг становится «средним». Исследования Marsh и Craven показывают: самооценка падает не от реальных способностей, а от сравнения с окружением.' },
  { icon: Brain, title: 'Синдром самозванца и перфекционизм', description: 'Одарённые подростки часто сомневаются в собственных способностях: «Мне просто повезло». Плюс перфекционизм: ошибка воспринимается как катастрофа. Вместе это молчаливый механизм, который не даёт попросить о помощи.' },
  { icon: Users, title: 'Теневой бан и барьер обращения за помощью', description: 'В конкурентной среде ученики боятся показаться слабыми. Обращение к психологу стигматизируется: «Если ты ходишь к психологу, значит, с тобой что-то не так». Мы заметили, что стресс чаще проявляется в цифровом следе, чем в разговоре.' },
  { icon: BookOpen, title: 'Интернатный режим', description: 'Учебный день с 7 утра до 10 вечера, жизнь в общежитии вдали от семьи. Нет личного пространства, нет возможности отстраниться от конфликтов. Три неудовлетворительные оценки за семестр, и грант потерян.' },
  { icon: Target, title: 'Цифровой след как зеркало состояния', description: 'Мы задумались: а что если подросток не говорит о стрессе словами, но показывает поведением? Меняется тон постов, сужается круг общения, появляются ночные сессии. Это не случайность, это паттерн.' },
  { icon: Lightbulb, title: 'Kundelik и PSS-10', description: 'Мы планируем интеграцию с Kundelik, казахстанским электронным журналом, для объективных академических данных. Валидация модели проводится через шкалу PSS-10 (Perceived Stress Scale), стандартный инструмент в мировой практике.' },
]

const steps = [
  { num: '01', title: 'Данные из профиля', desc: 'Пользовательские данные уже хранятся в профиле NeuroScan: посты, комментарии, реакции. Отдельно загружать ничего не нужно.', icon: Database },
  { num: '02', title: 'Подтверждение согласия', desc: 'Перед анализом пользователь подтверждает согласие на обработку данных. Без согласия анализ не запускается.', icon: UserCheck },
  { num: '03', title: 'Анализ тональности', desc: 'Ключевые маркеры эмоциональной окраски текста выделяются автоматически. В продакшене планируется RuBERT для более точного анализа.', icon: MessageSquare },
  { num: '04', title: 'Расчёт по 7 компонентам', desc: 'Каждый из семи компонентов рассчитывает свой индикатор: от активности до социального признания.', icon: BarChart3 },
  { num: '05', title: 'Взвешенная агрегация', desc: 'Компоненты объединяются с весами, которые мы обосновали литературой: тональность получает наибольший вес (2.8), так как это самый надёжный маркер стресса.', icon: Activity },
  { num: '06', title: 'Сигмоидная нормализация', desc: 'Итоговое значение z проходит через сигмоиду S = 1/(1+e^(-z)), превращая сырые баллы в оценку от 0 до 1. Это делает интерпретацию интуитивной.', icon: BarChart3 },
  { num: '07', title: 'Визуализация и этика', desc: 'Результаты отображаются на интерактивных графиках. Данные анонимизированы, доступны только авторизованным специалистам с согласия пользователя.', icon: Shield },
]

const components = [
  { icon: Activity, name: 'Изменение активности', weight: 1.8, desc: 'Сравнение частоты публикаций в базовом и текущем периодах. Резкий спад может быть признаком стресса.' },
  { icon: MessageSquare, name: 'Тональность текстов', weight: 2.8, desc: 'Анализ сдвига эмоциональной окраски текста. Переход к негативной тональности — самый значимый маркер стресса.' },
  { icon: Users, name: 'Социальные связи', weight: 2.2, desc: 'Плотность социальных взаимодействий (лайки, комментарии, репосты). Снижение указывает на изоляцию.' },
  { icon: Clock, name: 'Режим сна', weight: 1.5, desc: 'Доля ночных публикаций (00:00-06:00). Нарушение сна коррелирует с тревожностью.' },
  { icon: MapPin, name: 'Геолокация', weight: 1.2, desc: 'Разнообразие локаций и индикатор изоляции. Ограниченный географический паттерн — сигнал избегающего поведения.' },
  { icon: BookOpen, name: 'Академический контент', weight: 2.0, desc: 'Частота упоминаний учёбы и доля негативных упоминаний. Фрустрация от учёбы — прямой индикатор академического стресса.' },
  { icon: Heart, name: 'Социальное признание', weight: 1.4, desc: 'Сравнение реакций на посты в базовом и текущем периодах. Падение отклика может влиять на самооценку.' },
]

const principles = [
  { icon: UserCheck, title: 'Информированное согласие', desc: 'Весь анализ только с явного согласия пользователя. Без него ничего не запускается. Согласие можно отозвать в любой момент, и анализ прекратится.' },
  { icon: Lock, title: 'Анонимизация данных', desc: 'Персональные данные в исходном виде не хранятся. URL профилей превращаются в хэши. Сохраняются только агрегированные оценки компонентов.' },
  { icon: Eye, title: 'Прозрачность', desc: 'Каждый может посмотреть свои данные, результаты анализа и формулы расчёта. 7-компонентная модель и веса полностью открыты и задокументированы в нашем исследовании.' },
  { icon: Shield, title: 'Контроль доступа', desc: 'Результаты видны только пользователю и авторизованным специалистам. Администрация школы не может получить индивидуальные результаты без согласия.' },
  { icon: Database, title: 'Минимальный сбор данных', desc: 'Собираем только то, что относится к обнаружению стресса. Никакой лишней персональной информации не запрашивается и не хранится.' },
  { icon: Heart, title: 'Недиагностическое назначение', desc: 'Это НЕ медицинский инструмент. Мы не ставим диагнозы. Система лишь подсвечивает паттерны, а решение принимает квалифицированный специалист.' },
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
              <p className="text-sm text-white/45 leading-relaxed">{area.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10 mb-16">
          <h2 className="text-2xl font-display font-bold mb-6"><span className="gradient-text">Проблема</span></h2>
          <div className="space-y-4 text-white/50 text-sm leading-relaxed">
            <p>Мы учимся в НИШ Караганда и видим это каждый день. Учебный день начинается в 7 утра, заканчивается после самоподготовки в 10 вечера. Между уроками, допами и домашкой почти нет времени выдохнуть. Большинство живут в общежитии, вдали от семьи. Три неудовлетворительные оценки за семестр, и грант потерян. Трёхъязычная программа: предметы на казахском, русском и английском. Когнитивная перегрузка на постоянной основе.</p>
            <p>Но главная проблема не в нагрузке, а в том, что о ней молчат. Одарённые подростки редко обращаются за помощью. Признать проблему значит признать слабость, а это противоречит самоидентификации «я способный». Срабатывает эффект большого рыбного пруда: в обычной школе ты был лучшим, а в СУНЦ МГУ или ФМЛ №239 стал «одним из». Плюс перфекционизм: ошибка воспринимается как катастрофа, а не как часть обучения.</p>
            <p>В итоге стресс не исчезает, он просто уходит в цифровой след. Меняется тон постов, сужается круг общения, появляются ночные сессии с учебниками вместо сна. Мы подумали: а что если эти паттерны можно обнаружить автоматически, до того как случится кризис?</p>
          </div>
        </motion.div>

        <motion.div custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-display font-bold mb-6">Наша <span className="gradient-text">миссия</span></h2>
          <div className="space-y-4 text-white/50 text-sm leading-relaxed">
            <p>Мы создаём инструмент, который помогает школьным психологам заметить ученика из группы риска до кризиса, а не после. Не заменяя людей, а расширяя их возможности. Психолог не может следить за каждым из сотен учеников, но система может подсказать: «Обратите внимание на этого ученика, его паттерны изменились».</p>
            <p>Система полностью автоматизирована: не нужен ручной ввод данных, не нужны самоотчёты или опросники. Семикомпонентная модель с взвешенной агрегацией и сигмоидной функцией даёт комплексную оценку. Валидация через PSS-10 и планируется интеграция с Kundelik для объективных академических данных.</p>
            <p className="text-white/40 font-medium">Енбаев Жанәділ & Сулеймен Ерасыл, ученики 11 класса НИШ Караганда. Научный руководитель: Давлетгариев Глеб Фаритович.</p>
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
            Автоматизированный пайплайн от ввода данных до оценки стресса с сигмоидной нормализацией.
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
                  <p className="text-sm text-white/50 leading-relaxed">{step.desc}</p>
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
            <motion.p custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-sm text-white/50 mt-3">
              выше % = сильнее признак стресса
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
                    <p className="text-xs text-white/45 leading-relaxed">{comp.desc}</p>
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
              <p className="text-white/50 mb-8 max-w-xl mx-auto">Попробуйте анализ с образцом данных и посмотрите, как семикомпонентная модель работает на практике.</p>
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
            Этичный ИИ, защита данных и ответственное использование технологий.
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
              <p className="text-sm text-white/45 leading-relaxed">{p.desc}</p>
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
              <p className="text-sm text-white/45">Эта система не является диагностическим инструментом</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-white/50 leading-relaxed">
            <p>NeuroScan не ставит медицинские, психологические или психиатрические диагнозы. Оценки стресса отражают статистические индикаторы на основе паттернов цифрового поведения, а не клинические заключения. Это вспомогательный инструмент для школьных психологов.</p>
            <p>Если вы или кто-то из ваших знакомых испытывает трудности с психическим здоровьем, обратитесь к специалисту или на горячую линию помощи. Этот инструмент никогда не следует использовать как замену профессиональной помощи.</p>
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
                <p className="text-xs text-white/45">Только общедоступные данные с согласия пользователя: частоту публикаций, текст для анализа тональности, временные метки и метрики вовлечённости.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Что мы храним</h3>
                <p className="text-xs text-white/45">Только анонимизированные агрегированные данные: оценки стресса, значения компонентов и хэшированные идентификаторы. Исходный текст не хранится.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Кто имеет доступ</h3>
                <p className="text-xs text-white/45">Только пользователь и его школьный психолог видят индивидуальные результаты. Третьи стороны, включая администрацию, не имеют доступа без явного согласия.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-1">Ваши права</h3>
                <p className="text-xs text-white/45">Вы можете в любой момент просмотреть, экспортировать или удалить свои данные. Отзыв согласия приостанавливает анализ. Удаление аккаунта навсегда удаляет все связанные данные.</p>
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
            Есть вопросы или хотите сотрудничать? Напишите нам.
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
                    <p className="text-sm text-white/50">{item.detail}</p>
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
                  <p className="text-sm text-white/50 mb-6">Спасибо, что связались с нами. Мы ответим вам в ближайшее время.</p>
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
