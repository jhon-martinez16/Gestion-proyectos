import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <p className="text-8xl font-black text-[#F58220]">404</p>
        <h1 className="text-3xl font-bold text-[#0B355A]">Página no encontrada</h1>
        <p className="text-gray-500 max-w-sm">
          La ruta que buscas no existe o no tienes acceso a ella.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-[#F58220] hover:bg-[#d96f18] text-white font-semibold rounded-xl transition shadow-md"
        >
          Volver al Dashboard
        </button>
      </motion.div>
    </div>
  )
}
