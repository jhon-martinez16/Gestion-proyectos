import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { api } from "../services/api"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError("")

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email.trim() || !password.trim()) {
      setError("Todos los campos son obligatorios")
      return
    }

    if (!emailRegex.test(email.trim())) {
      setError("Ingrese un correo electrónico válido")
      return
    }

    try {
      setLoading(true)

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      })

      const token = response.data.access_token
      localStorage.setItem("token", token)

      setTimeout(() => {
        navigate("/")
      }, 600)

    } catch (err: any) {
      if (err.response?.status === 401) {
        const msg: string = err.response?.data?.message ?? ""
        if (msg.toLowerCase().includes("inactivo")) {
          setError("Usuario inactivo. Contacte al administrador.")
        } else {
          setError("Correo o contraseña incorrectos.")
        }
      } else if (err.response?.status === 400) {
        setError("Datos inválidos. Revise los campos.")
      } else if (!err.response) {
        setError("No se pudo conectar al servidor. Verifique su conexión.")
      } else {
        setError("Error del servidor. Intente nuevamente.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#312e81] relative overflow-hidden px-6">

      {/* Glow decorativo */}
      <div className="absolute w-[700px] h-[700px] bg-blue-500/20 rounded-full blur-3xl top-[-200px] left-[-200px] animate-pulse" />
      <div className="absolute w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl bottom-[-200px] right-[-200px] animate-pulse" />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center">

        {/* Lado izquierdo */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="text-white flex flex-col justify-center space-y-10"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full" />
            <img
              src="/logo-logique.png"
              alt="Logique"
              className="relative w-72 drop-shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            />
          </div>

          <div className="space-y-5">
            <h1 className="text-5xl font-semibold leading-tight">
              Gestión de proyectos
            </h1>
            <p className="text-white/70 text-xl">
              Plataforma interna Logique
            </p>
            <div className="h-1 w-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" />
          </div>
        </motion.div>

        {/* Lado derecho */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9 }}
          className="flex justify-center"
        >
          <div className="w-full max-w-md bg-white/15 backdrop-blur-xl border border-white/20 p-10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

            <div className="mb-8">
              <h2 className="text-white text-2xl font-semibold">
                Bienvenido
              </h2>
              <p className="text-white/60 text-sm mt-2">
                Ingrese sus credenciales para continuar
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={e => { e.preventDefault(); handleLogin(); }}
              noValidate
            >

              <div>
                <input
                  type="text"
                  placeholder="Correo corporativo"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError("") }}
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError("") }}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
                />
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 active:scale-[0.97] shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Validando...
                    </div>
                  ) : (
                    "Ingresar"
                  )}
                </button>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/25 border border-red-400/50 text-red-100 text-sm px-4 py-3 rounded-xl">
                    <span className="shrink-0 text-base">⚠</span>
                    <span>{error}</span>
                  </div>
                )}
              </div>

            </form>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
