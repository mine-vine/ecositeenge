import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CatalogItemPage } from './pages/CatalogItemPage'
import { CatalogPage } from './pages/CatalogPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { StartPage } from './pages/StartPage'
import { ToolPage } from './pages/ToolPage'
import { AnnuityPage } from './pages/calculators/AnnuityPage'
import { CompoundPage } from './pages/calculators/CompoundPage'
import { InflationPage } from './pages/calculators/InflationPage'
import { NpvIrrPage } from './pages/calculators/NpvIrrPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="catalog/:id" element={<CatalogItemPage />} />
          <Route path="start" element={<StartPage />} />
          <Route path="tools/npv-irr" element={<NpvIrrPage />} />
          <Route path="tools/annuity" element={<AnnuityPage />} />
          <Route path="tools/compound" element={<CompoundPage />} />
          <Route path="tools/inflation" element={<InflationPage />} />
          <Route path="tools/:id" element={<ToolPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
