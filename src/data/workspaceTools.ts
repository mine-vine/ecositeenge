import type { IconName } from '../components/Icon'

export type ToolStatus = 'ready' | 'soon'

export interface WorkspaceTool {
  id: string
  title: string
  description: string
  section: string
  icon: IconName
  status: ToolStatus
  /** Ссылка: внутренний маршрут или раздел сайта */
  href: string
  keywords: string[]
  /** Что будет уметь модуль (для страницы «в разработке») */
  features: string[]
}

export const workspaceSections = [
  'Данные',
  'Таблицы',
  'Статистика и эконометрика',
  'Финансовые калькуляторы',
  'Визуализация',
  'Воспроизводимость',
  'Справочник',
] as const

export const workspaceTools: WorkspaceTool[] = [
  // --- Данные ---
  {
    id: 'data-search',
    title: 'Поиск показателей',
    description: 'ВВП, инфляция, безработица и тысячи рядов из World Bank и FRED. Графики, таблица, экспорт в CSV и XLSX.',
    section: 'Данные',
    icon: 'database',
    status: 'ready',
    href: '/tools/data-search',
    keywords: ['fred', 'world bank', 'всемирный банк', 'imf', 'мвф', 'oecd', 'оэср', 'eurostat', 'api', 'ввп', 'инфляция'],
    features: [
      'Поиск по каталогам FRED и World Bank (затем IMF, OECD, Eurostat)',
      'Предпросмотр ряда: частота, единицы, источник, дата обновления',
      'Национальные источники: ЦБ РФ, Росстат, Destatis, Bundesbank',
    ],
  },
  {
    id: 'compare',
    title: 'Сравнение стран',
    description: 'Выберите страны, показатель и период — получите таблицу и график.',
    section: 'Данные',
    icon: 'globe',
    status: 'ready',
    href: '/tools/compare',
    keywords: ['страны', 'сравнение', 'панель', 'country'],
    features: ['Выбор нескольких стран и одного показателя', 'Таблица и график за выбранный период', 'Экспорт в CSV и XLSX'],
  },
  {
    id: 'transform',
    title: 'Преобразования рядов',
    description: 'Номинал → реал, смена частоты, темпы роста, индексы (база = 100).',
    section: 'Данные',
    icon: 'shuffle',
    status: 'ready',
    href: '/tools/transform',
    keywords: ['дефлирование', 'реальный', 'частота', 'квартал', 'темп роста', 'индекс', 'yoy'],
    features: [
      'Дефлирование по выбранному индексу цен',
      'Агрегация: месяц → квартал → год (среднее, сумма, конец периода)',
      'Темпы роста м/м, к/к, г/г; индексы с базой = 100',
    ],
  },
  // --- Таблицы ---
  {
    id: 'tables',
    title: 'Редактор таблиц',
    description: 'Загрузите CSV или XLSX: фильтры, сортировка, сводные таблицы, простые формулы.',
    section: 'Таблицы',
    icon: 'table',
    status: 'soon',
    href: '/tools/tables',
    keywords: ['excel', 'csv', 'xlsx', 'сводная', 'pivot', 'фильтр', 'сортировка', 'формулы'],
    features: ['Загрузка CSV/XLSX', 'Фильтры и сортировка', 'Сводная таблица', 'Вычисляемые столбцы'],
  },
  // --- Статистика ---
  {
    id: 'descriptive',
    title: 'Описательная статистика',
    description: 'Среднее, медиана, дисперсия, квантили и корреляционная матрица.',
    section: 'Статистика и эконометрика',
    icon: 'sigma',
    status: 'soon',
    href: '/tools/descriptive',
    keywords: ['среднее', 'медиана', 'дисперсия', 'корреляция', 'статистика'],
    features: ['Сводка по всем числовым столбцам', 'Корреляционная матрица с тепловой картой', 'Гистограммы распределений'],
  },
  {
    id: 'regression',
    title: 'Линейная регрессия (МНК)',
    description: 'Коэффициенты, ошибки, t-статистики, p-значения, R² и понятная интерпретация.',
    section: 'Статистика и эконометрика',
    icon: 'regression',
    status: 'soon',
    href: '/tools/regression',
    keywords: ['ols', 'мнк', 'регрессия', 'эконометрика', 'stata', 'gretl', 'p-value'],
    features: [
      'Множественная регрессия МНК',
      'Стандартные ошибки, t-статистики, p-значения, R² и скорректированный R²',
      'Текстовая интерпретация результатов для новичков',
    ],
  },
  {
    id: 'timeseries',
    title: 'Временные ряды',
    description: 'Тренд, скользящие средние, сезонная декомпозиция и простой прогноз.',
    section: 'Статистика и эконометрика',
    icon: 'activity',
    status: 'soon',
    href: '/tools/timeseries',
    keywords: ['тренд', 'скользящее среднее', 'сезонность', 'прогноз', 'декомпозиция'],
    features: ['Линейный тренд', 'Скользящие средние', 'Сезонная декомпозиция', 'Простой прогноз (экспоненциальное сглаживание)'],
  },
  // --- Финансы ---
  {
    id: 'npv-irr',
    title: 'NPV и IRR',
    description: 'Чистая приведённая стоимость, внутренняя норма доходности и срок окупаемости.',
    section: 'Финансовые калькуляторы',
    icon: 'calculator',
    status: 'ready',
    href: '/tools/npv-irr',
    keywords: ['npv', 'irr', 'чпс', 'внд', 'окупаемость', 'payback', 'инвестиции', 'дисконтирование'],
    features: ['NPV по ряду денежных потоков', 'IRR', 'Простой и дисконтированный срок окупаемости'],
  },
  {
    id: 'annuity',
    title: 'Аннуитет и кредит (PMT)',
    description: 'Ежемесячный платёж, график погашения и переплата.',
    section: 'Финансовые калькуляторы',
    icon: 'percent',
    status: 'ready',
    href: '/tools/annuity',
    keywords: ['pmt', 'аннуитет', 'кредит', 'ипотека', 'платёж'],
    features: ['Расчёт платежа PMT', 'График погашения', 'Сумма переплаты'],
  },
  {
    id: 'compound',
    title: 'Сложный процент и CAGR',
    description: 'Будущая и приведённая стоимость, среднегодовой темп роста.',
    section: 'Финансовые калькуляторы',
    icon: 'trending',
    status: 'ready',
    href: '/tools/compound',
    keywords: ['сложный процент', 'cagr', 'fv', 'pv', 'дисконтирование', 'капитализация'],
    features: ['FV и PV', 'CAGR', 'Влияние частоты капитализации'],
  },
  {
    id: 'inflation',
    title: 'Инфляция и покупательная способность',
    description: 'Накопленная инфляция за период и сколько стоят деньги «в ценах» другого года.',
    section: 'Финансовые калькуляторы',
    icon: 'coins',
    status: 'ready',
    href: '/tools/inflation',
    keywords: ['инфляция', 'покупательная способность', 'цены', 'ипц', 'cpi'],
    features: ['Накопленная инфляция по годовым ставкам', 'Пересчёт суммы в цены другого года'],
  },
  // --- Визуализация ---
  {
    id: 'charts',
    title: 'Конструктор графиков',
    description: 'Линия, столбцы, точечный, площадь — оформление «для отчёта» по умолчанию.',
    section: 'Визуализация',
    icon: 'chart',
    status: 'soon',
    href: '/tools/charts',
    keywords: ['график', 'диаграмма', 'png', 'svg', 'powerpoint', 'chart'],
    features: ['Четыре типа графиков', 'Экспорт в PNG и SVG', 'Копирование в буфер для вставки в PowerPoint'],
  },
  // --- Воспроизводимость ---
  {
    id: 'code',
    title: 'Код на Python и R',
    description: 'Любой расчёт можно открыть как код pandas/statsmodels или R и продолжить в Jupyter.',
    section: 'Воспроизводимость',
    icon: 'code',
    status: 'soon',
    href: '/tools/code',
    keywords: ['python', 'r', 'pandas', 'statsmodels', 'jupyter', 'rstudio', 'код'],
    features: ['Генерация Python-кода (pandas, statsmodels, matplotlib)', 'Генерация R-кода (tidyverse, ggplot2)', 'Скачивание .py / .R / .ipynb'],
  },
  // --- Справочник ---
  {
    id: 'catalog',
    title: 'Справочник инструментов',
    description: 'Excel, Python, Stata, Power BI, источники данных — что выбрать и с чего начать.',
    section: 'Справочник',
    icon: 'book',
    status: 'ready',
    href: '/catalog',
    keywords: ['справочник', 'каталог', 'обучение', 'stata', 'excel', 'python', 'r', 'bloomberg'],
    features: [],
  },
  {
    id: 'start',
    title: 'С чего начать',
    description: 'Пошаговый маршрут изучения инструментов для начинающего аналитика.',
    section: 'Справочник',
    icon: 'map',
    status: 'ready',
    href: '/start',
    keywords: ['обучение', 'маршрут', 'новичок', 'начать'],
    features: [],
  },
]
