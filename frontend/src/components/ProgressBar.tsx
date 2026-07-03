interface Props {
  value: number
  total: number
  colorClass?: string
}

export default function ProgressBar({ value, total, colorClass = 'bg-gray-900' }: Props) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
