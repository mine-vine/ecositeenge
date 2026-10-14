/** Нормализация для поиска: регистр, ё → е */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').trim()
}

/** Все слова запроса должны встречаться в тексте */
export function matches(query: string, ...fields: (string | string[])[]): boolean {
  const q = normalize(query)
  if (!q) return true
  const haystack = normalize(fields.flat().join(' '))
  return q.split(/\s+/).every((word) => haystack.includes(word))
}
