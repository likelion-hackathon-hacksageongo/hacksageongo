import { api, ApiError } from '../lib/apiClient'
import type { Profile } from '../types/api'

export async function getMyProfile(): Promise<Profile | null> {
  try {
    return await api.get<Profile>('/profiles/me')
  } catch (err) {
    if (err instanceof ApiError) return null
    throw err
  }
}

export function createProfile(profile: Profile): Promise<Profile> {
  return api.post<Profile>('/profiles', profile)
}

export function updateMyProfile(patch: Partial<Profile>): Promise<Profile> {
  return api.patch<Profile>('/profiles/me', patch)
}
