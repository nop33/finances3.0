export const generateId = (prefix: string, raw: string): string => {
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i)
    hash |= 0
  }
  return `${prefix}-${Math.abs(hash).toString(36)}`
}
