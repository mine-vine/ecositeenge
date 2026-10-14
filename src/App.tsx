import type { ComponentType } from 'react'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CatalogItemPage } from './pages/CatalogItemPage'
import { CatalogPage } from './pages/CatalogPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StartPage } from './pages/StartPage'
import { ToolPage } from './pages/ToolPage'
import { DatasetProvider } from './state/DatasetProvider'

// Инструменты грузятся по требованию: главная и справочник не тянут библиотеку графиков
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const NpvIrrPage = page(() => import('./pages/calculators/NpvIrrPage'), 'NpvIrrPage')
const AnnuityPage = page(() => import('./pages/calculators/AnnuityPage'), 'AnnuityPage')
const CompoundPage = page(() => import('./pages/calculators/CompoundPage'), 'CompoundPage')
const InflationPage = page(() => import('./pages/calculators/InflationPage'), 'InflationPage')
const DataSearchPage = page(() => import('./pages/data/DataSearchPage'), 'DataSearchPage')
const ComparePage = page(() => import('./pages/data/ComparePage'), 'ComparePage')
const TransformPage = page(() => import('./pages/data/TransformPage'), 'TransformPage')

function Loading() {
  return <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">Загрузка…</p>
}

export default function App() {
  return (
    <DatasetProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="catalog" element={<CatalogPage />} />
              <Route path="catalog/:id" element={<CatalogItemPage />} />
              <Route path="start" element={<StartPage />} />
              <Route path="tools/data-search" element={<DataSearchPage />} />
              <Route path="tools/compare" element={<ComparePage />} />
              <Route path="tools/transform" element={<TransformPage />} />
              <Route path="tools/npv-irr" element={<NpvIrrPage />} />
              <Route path="tools/annuity" element={<AnnuityPage />} />
              <Route path="tools/compound" element={<CompoundPage />} />
              <Route path="tools/inflation" element={<InflationPage />} />
              <Route path="tools/:id" element={<ToolPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DatasetProvider>
  )
}
