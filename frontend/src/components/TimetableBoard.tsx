import { useEffect, useRef, useState } from 'react'
import { PERIODS } from '../data/periods'
import { assignLanes, type PlanBlock } from '../lib/planBlocks'
import TimetableCard from './TimetableCard'

interface Props {
  title: string
  blocks: PlanBlock[]
  editable: boolean
  onChange?: (updater: (prev: PlanBlock[]) => PlanBlock[]) => void
  selectedGroupKey?: string | null
  onSelectBlock?: (groupKey: string) => void
}

const ROW_HEIGHT = 56
const ROW_GAP = 8

export default function TimetableBoard({ title, blocks, editable, onChange, selectedGroupKey, onSelectBlock }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columnWidth, setColumnWidth] = useState(0)

  useEffect(() => {
    function measure() {
      if (containerRef.current) setColumnWidth(containerRef.current.clientWidth / PERIODS.length)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const laned = assignLanes(blocks)
  const laneCount = Math.max(1, ...laned.map((b) => b.lane + 1))

  function handleUpdate(blockId: string, startIndex: number, endIndex: number) {
    onChange?.((prev) => prev.map((b) => (b.id === blockId ? { ...b, startIndex, endIndex } : b)))
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="px-4 pt-3 pb-1 text-sm font-semibold text-gray-900">{title}</h2>
      <div className="flex-1 overflow-auto px-4 pb-4">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${PERIODS.length}, 1fr)` }}>
          {PERIODS.map((p) => (
            <div
              key={p.key}
              className="text-center text-[11px] font-medium text-gray-400 pb-2 border-b border-gray-200"
            >
              {p.label}
            </div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="relative mt-3"
          style={{ height: laneCount * ROW_HEIGHT + (laneCount - 1) * ROW_GAP }}
        >
          {laned.map((block) => (
            <TimetableCard
              key={block.id}
              block={block}
              columnWidth={columnWidth}
              rowHeight={ROW_HEIGHT}
              editable={editable}
              onUpdate={(startIndex, endIndex) => handleUpdate(block.id, startIndex, endIndex)}
              selected={selectedGroupKey != null && selectedGroupKey === block.groupKey}
              onSelect={onSelectBlock}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
