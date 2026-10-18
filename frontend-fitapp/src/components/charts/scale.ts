/** Rounds a maximum up to a readable axis limit (1, 2, 2.5, 5 × 10^n). */
export function niceMax(value: number): number {
  if (value <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(value))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= value) ?? 10
  return step * exp
}

export function compactNumber(n: number): string {
  return n >= 1000 ? `${Number((n / 1000).toFixed(n % 1000 === 0 ? 0 : 1))}k` : String(Math.round(n))
}
