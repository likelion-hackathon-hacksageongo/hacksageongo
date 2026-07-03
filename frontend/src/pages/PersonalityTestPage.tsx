import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentSurvey, submitSurveyResponses } from '../services/surveyApi'
import type { SurveyCurrent, SurveyResult } from '../types/api'

const SCALE = [1, 2, 3, 4, 5]

export default function PersonalityTestPage() {
  const navigate = useNavigate()
  const [survey, setSurvey] = useState<SurveyCurrent | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SurveyResult | null>(null)

  useEffect(() => {
    getCurrentSurvey()
      .then(setSurvey)
      .catch(() => setErrorMessage('설문을 불러오지 못했어요.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (errorMessage || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-red-500">{errorMessage || '설문을 불러오지 못했어요.'}</p>
      </div>
    )
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5 text-center">
          <h1 className="text-lg font-semibold text-gray-900">성향검사 결과</h1>
          <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {result.topTypes.map((type) => (
              <span key={type} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                {type}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/chatbot')}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            다음
          </button>
        </div>
      </div>
    )
  }

  const question = survey.questions[index]
  const isLast = index === survey.questions.length - 1
  const selected = answers[question.id]

  async function handleSelect(value: number) {
    const nextAnswers = { ...answers, [question.id]: value }
    setAnswers(nextAnswers)

    if (!isLast) {
      setTimeout(() => setIndex((i) => i + 1), 200)
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    try {
      const payload = survey!.questions.map((q) => ({ questionId: q.id, value: nextAnswers[q.id] }))
      const surveyResult = await submitSurveyResponses(survey!.surveyId, payload)
      setResult(surveyResult)
    } catch {
      setErrorMessage('결과 제출에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleBack() {
    if (index === 0) return
    setIndex((i) => i - 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={index === 0}
            className="text-gray-400 disabled:opacity-0 text-sm"
            aria-label="이전 질문"
          >
            ←
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((index + 1) / survey.questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums">
            {index + 1} / {survey.questions.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <p className="text-lg font-medium text-gray-900 text-center leading-relaxed whitespace-pre-line">
            {question.text}
          </p>

          <div className="mt-8">
            <div className="flex justify-between gap-2">
              {SCALE.map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSelect(value)}
                  className={`flex-1 aspect-square rounded-xl border text-sm font-semibold transition-all hover:shadow-sm disabled:opacity-40 ${
                    selected === value
                      ? 'border-blue-300 bg-blue-50 text-blue-700 scale-105'
                      : 'border-gray-300 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-400">
              <span>{question.minLabel}</span>
              <span>{question.maxLabel}</span>
            </div>
          </div>

          {errorMessage && <p className="mt-4 text-sm text-red-500 text-center">{errorMessage}</p>}
        </div>
      </div>
    </div>
  )
}
