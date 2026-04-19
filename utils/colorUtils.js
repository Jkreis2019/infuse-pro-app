// Returns true if a hex color is "light" (luminance > 0.4)
export function isLightColor(hex) {
  if (!hex) return false
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.4
}

// Returns a readable text color based on background
export function getTextColor(bgHex) {
  return isLightColor(bgHex) ? '#1A2E2E' : '#FFFFFF'
}

// Returns a readable accent color - if primaryColor is too light for dark bg, darken it
export function getAccentColor(primaryHex, onDarkBg = true) {
  if (!primaryHex) return '#0ABAB5'
  if (onDarkBg && isLightColor(primaryHex)) {
    // Primary is too light for dark background - use a darker readable version
    return darkenColor(primaryHex, 0.4)
  }
  return primaryHex
}

// Darkens a hex color by a factor (0-1)
export function darkenColor(hex, factor) {
  if (!hex) return '#0ABAB5'
  const h = hex.replace('#', '')
  const r = Math.floor(parseInt(h.substring(0, 2), 16) * (1 - factor))
  const g = Math.floor(parseInt(h.substring(2, 4), 16) * (1 - factor))
  const b = Math.floor(parseInt(h.substring(4, 6), 16) * (1 - factor))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Returns readable primary for use on dark backgrounds
export function getPrimaryOnDark(primaryHex) {
  if (!primaryHex) return '#0ABAB5'
  return isLightColor(primaryHex) ? darkenColor(primaryHex, 0.5) : primaryHex
}

// Returns readable primary for use on light backgrounds  
export function getPrimaryOnLight(primaryHex) {
  if (!primaryHex) return '#0ABAB5'
  return isLightColor(primaryHex) ? darkenColor(primaryHex, 0.3) : primaryHex
}
