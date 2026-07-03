import type { ActivityCategory } from '../types/api'

export interface CategoryMeta {
  value: ActivityCategory
  label: string
  dot: string
  badge: string
  ring: string
}

export const ACTIVITY_CATEGORIES: CategoryMeta[] = [
  { value: 'career_required', label: '진로필수', dot: 'bg-rose-500', badge: 'bg-rose-50 border-rose-300 text-rose-700', ring: 'ring-rose-300' },
  { value: 'career_elective', label: '진로선택', dot: 'bg-amber-500', badge: 'bg-amber-50 border-amber-300 text-amber-700', ring: 'ring-amber-300' },
  { value: 'life_required', label: '필수교양', dot: 'bg-emerald-500', badge: 'bg-emerald-50 border-emerald-300 text-emerald-700', ring: 'ring-emerald-300' },
  { value: 'life_elective', label: '선택교양', dot: 'bg-blue-500', badge: 'bg-blue-50 border-blue-300 text-blue-700', ring: 'ring-blue-300' },
]

export function getCategoryMeta(category: ActivityCategory): CategoryMeta {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category)!
}
