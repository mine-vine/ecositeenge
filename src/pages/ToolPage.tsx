import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { Badge } from '../components/ui'
import { workspaceTools } from '../data/workspaceTools'
import { t } from '../i18n'
import { NotFoundPage } from './NotFoundPage'

/** Страница модуля рабочего места. Пока все модули — заглушки с планом функций. */
export function ToolPage() {
  const { id } = useParams()
  const tool = workspaceTools.find((w) => w.id === id && w.status === 'soon')
  if (!tool) return <NotFoundPage />

  return (
    <div className="max-w-3xl">
      <Link to="/" className="text-sm font-medium text-brand-700 hover:underline dark:text-blue-300">
        {t.toolPage.back}
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300">
          <Icon name={tool.icon} />
        </span>
        <div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{tool.section}</div>
          <h1 className="text-2xl font-semibold tracking-tight">{tool.title}</h1>
        </div>
      </div>
      <p className="mt-4 text-slate-700 dark:text-slate-300">{tool.description}</p>

      <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">{t.toolPage.soonTitle}</h2>
          <Badge>{t.status.soon}</Badge>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{t.toolPage.soonText}</p>
        <h3 className="mt-5 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{t.toolPage.planned}</h3>
        <ul className="mt-2 space-y-2">
          {tool.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300">
              <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
