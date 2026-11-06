export const BLOG_PAGE_SIZE = 12
export function blogPage(value: unknown): number | undefined {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return undefined
  const page = Number(value)
  return Number.isSafeInteger(page) ? page : undefined
}
