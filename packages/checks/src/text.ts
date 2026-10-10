export function normalizeText(text: string | null | undefined): string {
  return text?.replace(/\s+/g, ' ').trim() ?? ''
}
