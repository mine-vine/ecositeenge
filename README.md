# Эконометр — рабочее место экономиста

Веб-платформа для экономистов и аналитиков: данные, расчёты, статистика, графики и справочник профессиональных инструментов в браузере. Регистрация для базовых функций не нужна, расчёты выполняются на клиенте.

## Стек

React + TypeScript, Vite, Tailwind CSS v4, React Router. Графики — Recharts, XLSX — ExcelJS (загружается лениво). Для следующих этапов: simple-statistics / jStat или Pyodide (статистика).

## Запуск

```bash
npm install
npm run dev      # режим разработки
npm run build    # продакшен-сборка в dist/
npm run lint     # oxlint
npm test         # юнит-тесты расчётов (vitest)
```

## Структура

```
src/
  i18n/            строки интерфейса (ru.ts; en.ts — позже, с тем же типом Dict)
  data/
    catalog.ts         карточки справочника, фильтры, маршрут «С чего начать»
    workspaceTools.ts  модули рабочего места и их статус (готово / скоро)
  components/      Layout (шапка, меню, тема), карточки, поиск, фильтры, иконки
  hooks/useTheme   светлая/тёмная тема с сохранением в localStorage
  lib/search.ts    нормализованный поиск (регистр, ё/е)
  lib/finance.ts   финансовые функции: NPV, IRR, PMT, FV/PV, CAGR, окупаемость, инфляция (+ тесты)
  lib/format.ts    разбор ввода («1 234,5») и форматирование чисел по-русски
  components/calc  каркас калькулятора: поля, метрики, таблицы, блок «формула и интерпретация»
  components/charts  график рядов, палитра (проверена на различимость для дальтоников), экспорт PNG/SVG
  components/data  выбор стран и показателей, панель «Мой набор данных»
  lib/data/        клиенты World Bank и FRED, преобразования рядов, таблица/CSV/XLSX (+ тесты)
  state/           рабочий набор рядов (React context + localStorage)
server/
  fredProxy.ts     прокси FRED на стандартном Fetch API (+ тесты)
  worker.ts        пример развёртывания прокси как Cloudflare Worker
  pages/
    HomePage         /               сетка инструментов с поиском
    CatalogPage      /catalog        справочник с фильтрами (состояние в URL)
    CatalogItemPage  /catalog/:id    карточка инструмента
    StartPage        /start          рекомендуемый порядок изучения
    data/            /tools/data-search(?source=fred), /tools/compare, /tools/transform
    calculators/     /tools/npv-irr, /tools/annuity, /tools/compound(?mode=pv|cagr), /tools/inflation
    ToolPage         /tools/:id      страница ещё не готового модуля (план функций)
```

Как добавить инструмент в справочник: новая запись в `src/data/catalog.ts`. Как добавить модуль рабочего места: запись в `src/data/workspaceTools.ts` и маршрут/страница в `src/App.tsx`.

## Дорожная карта MVP

1. ✅ Каркас сайта, главная, навигация, справочник инструментов
2. ✅ Финансовые калькуляторы: NPV, IRR, PMT, сложный процент, CAGR, окупаемость, инфляция
3. ✅ Загрузка данных из FRED и World Bank, графики, экспорт CSV/XLSX/PNG/SVG, преобразования рядов
4. Загрузка своих таблиц, описательная статистика, регрессия МНК
5. Генерация Python/R-кода для каждого анализа

## Источники данных

**World Bank** вызывается прямо из браузера: ключ не нужен, CORS разрешён.

**FRED** не отдаёт CORS-заголовки и требует API-ключ, поэтому запросы идут через прокси `/api/fred/*` (`server/fredProxy.ts`):

- локально (`npm run dev` / `npm run preview`) прокси встроен в Vite; положите ключ в `.env` (см. `.env.example`): `FRED_API_KEY=...`;
- в продакшене разверните `server/worker.ts` (Cloudflare Workers) или подключите `handleFred` в любой серверной функции с Fetch API, и укажите `VITE_FRED_PROXY` при сборке, если прокси на другом домене;
- без серверного ключа пользователь может ввести свой ключ в интерфейсе — он хранится только в его браузере и передаётся прокси с запросом.

Прокси пропускает только методы `series`, `series/search`, `series/observations`.

## Развёртывание

При деплое на статический хостинг настройте отдачу `index.html` для всех путей (SPA-роутинг).
