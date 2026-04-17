// ============================================
// uiX - Text Normalization Utilities
// ============================================

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizedIncludes(text: string, search: string): boolean {
  return normalizeText(text).includes(normalizeText(search));
}

export function normalizedStartsWith(text: string, search: string): boolean {
  return normalizeText(text).startsWith(normalizeText(search));
}
