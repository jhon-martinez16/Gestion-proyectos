import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--canvas)", textAlign: "center", padding: "0 24px" }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}
      >
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(72px, 12vw, 120px)", fontWeight: 300, color: "var(--accent-gold)", lineHeight: 1 }}>404</p>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 300, color: "var(--text-primary)" }}>Página no encontrada</h1>
        <p style={{ color: "var(--text-muted)", maxWidth: 360, fontSize: 14, lineHeight: 1.6 }}>
          La ruta que buscas no existe o no tienes acceso a ella.
        </p>
        <button onClick={() => navigate("/")} className="btn-primary">
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  )
}
