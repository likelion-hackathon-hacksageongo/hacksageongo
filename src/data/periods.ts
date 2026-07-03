import type { PeriodKey } from '../types/api'

export interface PeriodMeta {
  key: PeriodKey
  label: string
}

export const PERIODS: PeriodMeta[] = [
  { key: '3-1', label: '3-1' },
  { key: 'summer', label: '3학년 여름방학' },
  { key: '3-2', label: '3-2' },
  { key: 'winter', label: '3학년 겨울방학' },
  { key: '4-1', label: '4-1' },
  { key: 'final_summer', label: '4학년 여름방학' },
  { key: '4-2', label: '4-2' },
]

export function periodIndex(key: PeriodKey): number {
  return PERIODS.findIndex((p) => p.key === key)
}
