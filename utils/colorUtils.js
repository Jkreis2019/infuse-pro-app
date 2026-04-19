function getLuminance(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Returns black or white depending on which is more readable on the given background
export function getContrastText(bgHex) {
  if (!bgHex) return '#FFFFFF'
  return getLuminance(bgHex) > 0.4 ? '#1A2E2E' : '#FFFFFF'
}

// Returns the primary color adjusted to be readable on a dark background
export function getPrimaryOnDark(primaryHex) {
  if (!primaryHex) return '#0ABAB5'
  return getLuminance(primaryHex) > 0.4 ? '#1A2E2E' : primaryHex
}

export function getTextColor(bgHex) {
  return getContrastText(bgHex)
}

export function isLightColor(hex) {
  if (!hex) return false
  return getLuminance(hex) > 0.4
}
