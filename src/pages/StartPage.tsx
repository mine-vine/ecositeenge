import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { catalog, learningPath } from '../data/catalog'
import { t } from '../i18n'

export function StartPage() {
  return (
    <>
      <PageHeader title={t.start.title} subtitle={t.start.subtitle} />

      <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6 sm:pl-8 dark:border-slate-800">
        {learningPath.map((step) => {
          const tools = step.ids.map((id) => catalog.find((c) => c.id === id)).filter((c) => c !== undefined)
          return (
            <li key={step.step} className="relative">
              <span className="absolute top-5 -left-[41px] grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white ring-4 ring-slate-50 sm:-left-[49px] dark:ring-slate-950">
                {step.step}
              </span>
              <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 leading-relaxed text-slate-700 dark:text-slate-300">{step.why}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-200">Результат шага: </span>
                  {step.result}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tools.map((tool) => (
                    <Link
                      key={tool.id}
                      to={`/catalog/${tool.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:hover:text-blue-300"
                    >
                      {tool.name} →
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-100/60 p-6 text-sm leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        <p>
          <span className="font-semibold">Дальше — по направлению.</span> Госсектор и наука: Stata или R для эконометрики, LaTeX для
          публикаций. Финансы: финансовое моделирование в Excel (DCF, трёхотчётная модель), терминалы Bloomberg или LSEG. Консалтинг:
          PowerPoint и Power BI или Tableau.
        </p>
        <Link to="/catalog" className="mt-3 inline-block font-medium text-brand-700 hover:underline dark:text-blue-300">
          Подобрать инструменты в справочнике →
        </Link>
      </div>
    </>
  )
}
