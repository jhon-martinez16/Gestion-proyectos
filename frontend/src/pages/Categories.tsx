  import { useEffect, useState } from "react"
  import { api } from "../services/api"
  import CategoryModal from "../components/categories/CategoryModal"

  interface Category {
    id: number
    nombre: string
    color: string
    activa: boolean
  }

  export default function Categories() {
    const [categories, setCategories] = useState<Category[]>([])
    const [showModal, setShowModal] = useState(false)

    const loadData = async () => {
      const res = await api.get("/categorias")
      setCategories(res.data)
    }

    useEffect(() => {
      loadData()
    }, [])

    return (
      <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

        {/* HEADER CON CINTA */}
        <div className="flex justify-between items-center bg-[#DDF7E6] px-6 py-4 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-[#14532D]">
              Categorías
            </h1>
            <p className="text-sm text-green-900/70 mt-1">
              Gestiona las categorías del sistema
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white px-5 py-2.5 rounded-xl font-medium transition shadow-sm"
          >
            + Nueva Categoría
          </button>
        </div>

        {/* LISTADO */}
        <div className="grid gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-green-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: c.color }}
                />
                <p className="font-semibold text-gray-800">
                  {c.nombre}
                </p>
              </div>

              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  c.activa
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {c.activa ? "Activa" : "Inactiva"}
              </span>
            </div>
          ))}
        </div>

        {showModal && (
          <CategoryModal
            onClose={() => {
              setShowModal(false)
              loadData()
            }}
          />
        )}
      </div>
    )
  }