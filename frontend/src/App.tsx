import { Routes, Route, useLocation } from "react-router-dom"
import { AnimatePresence } from "framer-motion"
import DashboardLayout from "./layouts/DashboardLayout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectDetail from "./pages/ProjectDetail"
import Users from "./pages/Users"
import Categories from "./pages/Categories"
import Settings from "./pages/Settings"
import Facturacion from "./pages/Facturacion"
import Proveedores from "./pages/Proveedores"
import Reportes from "./pages/Reportes"
import Cronograma from "./pages/Cronograma"
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import ScrollToTop from "./components/ScrollToTop"

export default function App() {
  const location = useLocation()

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/"           element={<Dashboard />} />
            <Route path="/projects"   element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/users"      element={<Users />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/reportes"   element={<Reportes />} />
            <Route path="/cronograma" element={<Cronograma />} />
            <Route path="/settings"   element={<Settings />} />
            <Route path="*"           element={<NotFound />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
