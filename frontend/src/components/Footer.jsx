import { Link } from 'react-router-dom'
import { Brain, Github, Twitter, Mail, Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    'Платформа': [
      { label: 'Как работает', path: '/how-it-works' },
      { label: 'Панель', path: '/dashboard' },
      { label: 'Исследование', path: '/about' },
    ],
    'Ресурсы': [
      { label: 'О нас', path: '/about' },
      { label: 'Этика и приватность', path: '/ethics' },
      { label: 'Контакты', path: '/contact' },
    ],
    'Правовая информация': [
      { label: 'Политика конфиденциальности', path: '/ethics' },
      { label: 'Условия использования', path: '/ethics' },
      { label: 'Использование данных', path: '/ethics' },
    ],
  }

  return (
    <footer className="relative border-t border-white/[0.04]">
      <div className="absolute inset-0 bg-gradient-to-t from-dark-100/50 to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight">
                Neuro<span className="gradient-text">Scan</span>
              </span>
            </Link>
            <p className="text-white/30 text-sm leading-relaxed max-w-sm mb-6">
              Система анализа цифрового следа для выявления академического стресса у одарённых подростков. Исследовательский проект НИШ Караганда.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Github, label: 'GitHub' },
                { icon: Mail, label: 'Email' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white/70 font-semibold text-sm mb-4 tracking-wide uppercase">{title}</h3>
              <ul className="space-y-3">
                {links.map(({ label, path }) => (
                  <li key={label}>
                    <Link
                      to={path}
                      className="text-white/25 text-sm hover:text-white/60 transition-colors duration-300"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-sm flex items-center gap-1">
            &copy; {currentYear} NeuroScan. Исследовательский проект в образовательных целях.
          </p>
          <p className="text-white/20 text-sm flex items-center gap-1">
            Сделано с <Heart className="w-3 h-3 text-accent-400" /> для благополучия учеников
          </p>
        </div>
      </div>
    </footer>
  )
}
