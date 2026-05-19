import { useRef, useState } from "react"
import { api } from "../../services/api"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X } from "lucide-react"

interface Props {
  carpeta?: string
  currentPath?: string | null
  onUploaded: (path: string, nombre: string) => void
  disabled?: boolean
  accept?: string
  hint?: string
  label?: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUploadButton({
  carpeta = "general",
  currentPath,
  onUploaded,
  disabled,
  accept = ".pdf,.jpg,.jpeg,.png",
  hint = "PDF, JPG o PNG hasta 10 MB",
  label = "Arrastra el archivo o haz click para subir",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [nombre, setNombre] = useState<string | null>(
    currentPath ? currentPath.split("/").pop() ?? null : null
  )
  const [path, setPath] = useState<string | null>(currentPath ?? null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    setUploadProgress(0)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await api.post(`/archivos/upload?carpeta=${carpeta}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      setPath(res.data.path)
      setNombre(res.data.nombre)
      onUploaded(res.data.path, res.data.nombre)
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al subir el archivo.")
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && !disabled && !uploading) uploadFile(file)
  }

  const handleRemove = () => {
    setPath(null)
    setNombre(null)
    onUploaded("", "")
  }

  if (path && nombre) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 10,
            background: "#f0fdf4",
            border: "1.5px solid #bbf7d0",
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: "#16a34a", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <FileText size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: "#14532d",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {nombre}
            </div>
            <a
              href={`${API_URL}/${path}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans', sans-serif",
                textDecoration: "none",
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
            >
              Ver archivo →
            </a>
          </div>
          {!disabled && (
            <button
              onClick={() => inputRef.current?.click()}
              title="Cambiar archivo"
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "#16a34a", fontFamily: "'DM Sans', sans-serif",
                textDecoration: "underline", padding: 0,
              }}
            >
              Cambiar
            </button>
          )}
          {!disabled && (
            <button
              onClick={handleRemove}
              title="Quitar archivo"
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#16a34a", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={15} />
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && !uploading && inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragOver ? "var(--navy, #1e3a6e)" : "#e2e8f0"}`,
        borderRadius: 10,
        padding: "16px 20px",
        textAlign: "center",
        cursor: disabled || uploading ? "not-allowed" : "pointer",
        background: dragOver ? "#eff6ff" : "#fafafa",
        transition: "all 0.18s ease",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {uploading ? (
        <>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "#dbeafe",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              border: "2.5px solid var(--navy, #1e3a6e)",
              borderTopColor: "transparent",
              animation: "spin 0.7s linear infinite",
            }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--navy, #1e3a6e)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
              Subiendo... {uploadProgress}%
            </p>
            <div style={{
              width: 120, height: 3, background: "#e2e8f0", borderRadius: 99, marginTop: 6, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", background: "var(--navy, #1e3a6e)",
                width: `${uploadProgress}%`, borderRadius: 99,
                transition: "width 0.2s ease",
              }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: dragOver ? "#dbeafe" : "#f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.18s ease",
          }}>
            <Upload size={18} color={dragOver ? "var(--navy, #1e3a6e)" : "#94a3b8"} />
          </div>
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600, margin: 0,
              color: dragOver ? "var(--navy, #1e3a6e)" : "#374151",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {dragOver ? "Suelta el archivo aquí" : label}
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8", margin: "3px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
              {hint}
            </p>
          </div>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
    </div>
  )
}
