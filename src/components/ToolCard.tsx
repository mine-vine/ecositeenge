import { Link } from 'react-router-dom'
import type { WorkspaceTool } from '../data/workspaceTools'
import { t } from '../i18n'
import { Icon } from './Icon'
import { Badge } from './ui'

export function ToolCard({ tool }: { tool: WorkspaceTool }) {
  return (
    <Link
      to={tool.href}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-brand-500 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700 dark:bg-blue-950 dark:text-blue-300">
          <Icon name={tool.icon} />
        </span>
        <Badge tone={tool.status === 'ready' ? 'green' : 'neutral'}>{t.status[tool.status]}</Badge>
      </div>
      <h3 className="mt-4 font-semibold group-hover:text-brand-700 dark:group-hover:text-blue-300">{tool.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{tool.description}</p>
    </Link>
  )
}
