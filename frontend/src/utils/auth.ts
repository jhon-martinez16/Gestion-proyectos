function decodeToken(): Record<string, any> | null {
  const token = localStorage.getItem("token")
  if (!token) return null
  try {
    return JSON.parse(atob(token.split(".")[1]))
  } catch {
    return null
  }
}

export function getUserIdFromToken(): string | null {
  return decodeToken()?.sub ?? null
}

export function getRolFromToken(): "ADMIN" | "SOCIO" | "ADMINISTRATIVO" | null {
  return decodeToken()?.rol ?? null
}

export function getNameFromToken(): string | null {
  return decodeToken()?.nombre ?? null
}
