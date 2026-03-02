export default function Settings() {
  return (
    <div className="space-y-8 bg-[#F3FBF6] p-6 rounded-3xl">

      {/* HEADER CON CINTA */}
      <div className="bg-[#DDF7E6] px-6 py-5 rounded-2xl shadow-sm">
        <h1 className="text-3xl font-bold text-[#14532D]">
          Configuración
        </h1>
        <p className="text-green-900/70 mt-2">
          Administra los parámetros generales del sistema.
        </p>
      </div>

      {/* CONTENIDO */}
      <div className="bg-white border border-green-100 rounded-2xl p-6 shadow-sm">

        <p className="text-gray-600 mb-6">
          Desde aquí puedes gestionar los siguientes módulos:
        </p>

        <div className="grid md:grid-cols-3 gap-4">

          {/* ITEM */}
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:shadow-md transition">
            <div className="w-3 h-3 bg-[#16A34A] rounded-full" />
            <span className="font-medium text-gray-800">
              Usuarios
            </span>
          </div>

          {/* ITEM */}
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:shadow-md transition">
            <div className="w-3 h-3 bg-[#16A34A] rounded-full" />
            <span className="font-medium text-gray-800">
              Categorías
            </span>
          </div>

          {/* ITEM */}
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:shadow-md transition">
            <div className="w-3 h-3 bg-[#16A34A] rounded-full" />
            <span className="font-medium text-gray-800">
              Reglas futuras
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}