import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import { t } from '../i18n'
import { Icon } from './Icon'

const navItems = [
  { to: '/', label: t.nav.home, end: true },
  { to: '/catalog', label: t.nav.catalog, end: false },
  { to: '/start', label: t.nav.start, end: false },
]

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
  }`

export function Layout() {
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Прокручиваем вверх при смене страницы
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand-700 text-white">
              <Icon name="trending" className="h-4 w-4" />
            </span>
            <span>{t.brand}</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={toggle}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label={theme === 'dark' ? t.theme.light : t.theme.dark}
              title={theme === 'dark' ? t.theme.light : t.theme.dark}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label={t.menu}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-slate-200 px-4 py-2 md:hidden dark:border-slate-800" aria-label="Мобильная навигация">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={(s) => `block ${navClass(s)}`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 sm:px-6 dark:text-slate-400">
          {t.footer}
        </div>
      </footer>
    </div>
  )
}
