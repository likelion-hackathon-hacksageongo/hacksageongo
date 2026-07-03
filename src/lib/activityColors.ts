const PASTEL_PALETTE = [
  'bg-rose-100 border-rose-300 text-rose-800',
  'bg-amber-100 border-amber-300 text-amber-800',
  'bg-lime-100 border-lime-300 text-lime-800',
  'bg-emerald-100 border-emerald-300 text-emerald-800',
  'bg-sky-100 border-sky-300 text-sky-800',
  'bg-indigo-100 border-indigo-300 text-indigo-800',
  'bg-violet-100 border-violet-300 text-violet-800',
  'bg-pink-100 border-pink-300 text-pink-800',
]

export type ColorAssigner = (key: string) => string

export function createColorAssigner(): ColorAssigner {
  const assigned = new Map<string, string>()
  let next = 0
  return (key: string) => {
    const existing = assigned.get(key)
    if (existing) return existing
    const color = PASTEL_PALETTE[next % PASTEL_PALETTE.length]
    assigned.set(key, color)
    next += 1
    return color
  }
}
