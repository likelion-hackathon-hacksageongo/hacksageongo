import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createProfile, getMyProfile } from '../services/profileApi'
import type { Gender, Profile } from '../types/api'
import logo from '../assets/block_logo.png'

const YEAR_OPTIONS = ['1', '2', '3', '4', '5', '6']
const SEMESTER_OPTIONS: { value: '1' | '2'; label: string }[] = [
  { value: '1', label: '1학기' },
  { value: '2', label: '2학기' },
]
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'female', label: '여성' },
  { value: 'male', label: '남성' },
  { value: 'prefer_not_to_say', label: '알리고 싶지 않음' },
]

interface FormState {
  nickname: string
  birthYear: string
  school: string
  department: string
  gpa: string
  gender: Gender | ''
  currentYear: string
  currentSemester: '1' | '2' | ''
  expectedGradYear: string
  expectedGradSemester: '1' | '2' | ''
}

const emptyForm: FormState = {
  nickname: '',
  birthYear: '',
  school: '',
  department: '',
  gpa: '',
  gender: '',
  currentYear: '',
  currentSemester: '',
  expectedGradYear: '',
  expectedGradSemester: '',
}

function toExpectedGraduation(year: string, semester: '1' | '2'): string {
  const y = Number(year)
  // 1학기(전기) 종료 -> 그 해 8월 졸업, 2학기(후기) 종료 -> 다음 해 2월 졸업
  return semester === '1' ? `${y}-08` : `${y + 1}-02`
}

export default function PersonalInfoPage() {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    getMyProfile().then((profile) => {
      if (cancelled) return
      if (profile) {
        navigate('/personality-test', { replace: true })
        return
      }
      setCheckingProfile(false)
    })
    return () => {
      cancelled = true
    }
  }, [navigate])

  const isValid =
    form.nickname.trim() !== '' &&
    form.birthYear.trim() !== '' &&
    form.department.trim() !== '' &&
    form.gender !== '' &&
    form.currentYear !== '' &&
    form.currentSemester !== '' &&
    form.expectedGradYear.trim() !== '' &&
    form.expectedGradSemester !== ''

  function handleChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!isValid || submitting) return

    const completedSemesters = (Number(form.currentYear) - 1) * 2 + Number(form.currentSemester)

    const payload: Profile = {
      nickname: form.nickname.trim(),
      birthYear: Number(form.birthYear),
      gender: form.gender as Gender,
      completedSemesters,
      expectedGraduation: toExpectedGraduation(form.expectedGradYear, form.expectedGradSemester as '1' | '2'),
      ...(form.school.trim() && { school: form.school.trim() }),
      ...(form.department.trim() && { department: form.department.trim() }),
      ...(form.gpa.trim() && { gpa: Number(form.gpa) }),
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      await createProfile(payload)
      navigate('/personality-test')
    } catch {
      setErrorMessage('프로필 저장에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6"
      >
        <div className="flex flex-col items-center text-center">
          <img src={logo} alt="학사견고" className="h-20 w-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">신상정보 입력</h1>
          <p className="mt-1 text-sm text-gray-500">
            먼저 당신에 대해 알려주세요.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            뭐라고 부를까요?
          </label>
          <input
            type="text"
            value={form.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
            placeholder="닉네임 또는 이름"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">출생연도</label>
            <input
              type="number"
              value={form.birthYear}
              onChange={(e) => handleChange('birthYear', e.target.value)}
              placeholder="예: 2002"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">학점 (선택)</label>
            <input
              type="number"
              step="0.01"
              value={form.gpa}
              onChange={(e) => handleChange('gpa', e.target.value)}
              placeholder="예: 3.8"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">학과</label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => handleChange('department', e.target.value)}
            placeholder="예: 컴퓨터공학부"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-gray-700">성별</span>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleChange('gender', option.value)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  form.gender === option.value
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-gray-700">등록 학기</span>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.currentYear}
              onChange={(e) => handleChange('currentYear', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="" disabled>학년</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}학년</option>
              ))}
            </select>
            <select
              value={form.currentSemester}
              onChange={(e) => handleChange('currentSemester', e.target.value as '1' | '2')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="" disabled>학기</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-gray-700">예상 졸업 시점</span>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={2026}
              value={form.expectedGradYear}
              onChange={(e) => handleChange('expectedGradYear', e.target.value)}
              placeholder="예: 2027"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
            <select
              value={form.expectedGradSemester}
              onChange={(e) => handleChange('expectedGradSemester', e.target.value as '1' | '2')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            >
              <option value="" disabled>학기</option>
              {SEMESTER_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {submitting ? '저장 중...' : '다음'}
        </button>
      </form>
    </div>
  )
}
