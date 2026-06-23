export const formatTimeLeft = (deadline) => {
  const diff = new Date(deadline) - new Date()
  if (diff <= 0) return 'OVERDUE'

  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)

  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0)  return `${h}h ${m}m`
  return `${m}m`
}

export const formatDeadline = (deadline) => {
  return new Date(deadline).toLocaleString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export const deadlineUrgency = (deadline) => {
  const diff = new Date(deadline) - new Date()
  if (diff <= 0)          return 'overdue'
  if (diff < 3600000)     return 'critical'   // < 1h
  if (diff < 6 * 3600000) return 'high'       // < 6h
  if (diff < 86400000)    return 'medium'     // < 24h
  return 'low'
}

export const toLocalDatetimeInput = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const survivalColor = (label) => {
  const map = {
    DEFINITELY: 'var(--green)',
    POSSIBLE:   'var(--blue)',
    RISKY:      'var(--orange)',
    CRITICAL:   'var(--red)',
    IMPOSSIBLE: 'var(--red)',
  }
  return map[label] || 'var(--text-1)'
}
