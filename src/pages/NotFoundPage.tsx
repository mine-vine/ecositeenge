import { Link } from 'react-router-dom'
import { t } from '../i18n'

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl font-semibold text-slate-300 dark:text-slate-700">404</p>
      <h1 className="mt-4 text-xl font-semibold">{t.notFound.title}</h1>
      <Link to="/" className="mt-4 inline-block font-medium text-brand-700 hover:underline dark:text-blue-300">
        {t.notFound.back}
      </Link>
    </div>
  )
}
