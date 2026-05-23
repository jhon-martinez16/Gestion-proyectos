const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export function formatShortDate(date: Date): string {
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  const thisYear = new Date().getFullYear()
  return year === thisYear ? `${day} ${month}` : `${day} ${month} ${year}`
}

export function formatRelativeDuration(start: Date, end: Date): string {
  const days = Math.max(0, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  if (days < 32) return `${days} día${days !== 1 ? "s" : ""}`
  const months = Math.round(days / 30.44)
  if (months < 24) return `${months} mes${months !== 1 ? "es" : ""}`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem === 0
    ? `${years} año${years !== 1 ? "s" : ""}`
    : `${years} año${years !== 1 ? "s" : ""} ${rem} mes${rem !== 1 ? "es" : ""}`
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatShortDate(start)} → ${formatShortDate(end)} · ${formatRelativeDuration(start, end)}`
}
