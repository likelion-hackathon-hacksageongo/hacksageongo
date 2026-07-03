import { useRef, useState } from 'react'
import type { LanedPlanBlock } from '../lib/planBlocks'
import { PERIODS } from '../data/periods'

interface Props {
  block: LanedPlanBlock
  columnWidth: number
  rowHeight: number
  editable: boolean
  onUpdate: (startIndex: number, endIndex: number) => void
  selected?: boolean
  onSelect?: (groupKey: string) => void
}

type DragMode = 'move' | 'resize-left' | 'resize-right'

interface DragState {
  mode: DragMode
  startClientX: number
  originStart: number
  originEnd: number
}

function clampIndex(i: number) {
  return Math.min(Math.max(i, 0), PERIODS.length - 1)
}

export default function TimetableCard({ block, columnWidth, rowHeight, editable, onUpdate, selected, onSelect }: Props) {
  const [preview, setPreview] = useState<{ start: number; end: number } | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const previewRef = useRef<{ start: number; end: number } | null>(null)

  function setPreviewValue(next: { start: number; end: number } | null) {
    previewRef.current = next
    setPreview(next)
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current
    if (!drag || columnWidth === 0) return
    const deltaCols = Math.round((e.clientX - drag.startClientX) / columnWidth)

    if (drag.mode === 'move') {
      const span = drag.originEnd - drag.originStart
      let newStart = clampIndex(drag.originStart + deltaCols)
      if (newStart + span > PERIODS.length - 1) newStart = PERIODS.length - 1 - span
      setPreviewValue({ start: newStart, end: newStart + span })
    } else if (drag.mode === 'resize-left') {
      const newStart = Math.min(clampIndex(drag.originStart + deltaCols), drag.originEnd)
      setPreviewValue({ start: newStart, end: drag.originEnd })
    } else {
      const newEnd = Math.max(clampIndex(drag.originEnd + deltaCols), drag.originStart)
      setPreviewValue({ start: drag.originStart, end: newEnd })
    }
  }

  function handlePointerUp() {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    document.body.style.userSelect = ''
    dragRef.current = null
    const finalPreview = previewRef.current
    setPreviewValue(null)
    if (finalPreview) onUpdate(finalPreview.start, finalPreview.end)
  }

  function handlePointerDown(e: React.PointerEvent, mode: DragMode) {
    if (!editable) return
    e.stopPropagation()
    dragRef.current = { mode, startClientX: e.clientX, originStart: block.startIndex, originEnd: block.endIndex }
    document.body.style.userSelect = 'none'
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const start = preview?.start ?? block.startIndex
  const end = preview?.end ?? block.endIndex
  const left = start * columnWidth + 2
  const width = (end - start + 1) * columnWidth - 4
  const top = block.lane * (rowHeight + 8)

  return (
    <div
      className={`absolute rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition-shadow hover:shadow-md hover:scale-[1.02] ${block.color} ${
        editable ? 'cursor-grab touch-none' : onSelect ? 'cursor-pointer' : ''
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left,
        width,
        top,
        height: rowHeight,
        transition: preview ? 'none' : 'left 200ms ease, width 200ms ease, top 200ms ease, box-shadow 150ms ease, transform 150ms ease',
      }}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onClick={() => onSelect?.(block.groupKey)}
    >
      <span className="block truncate leading-[1.6]">{block.title}</span>

      {editable && (
        <>
          <div
            className="absolute left-0 top-0 h-full w-2 cursor-ew-resize touch-none"
            onPointerDown={(e) => handlePointerDown(e, 'resize-left')}
          />
          <div
            className="absolute right-0 top-0 h-full w-2 cursor-ew-resize touch-none"
            onPointerDown={(e) => handlePointerDown(e, 'resize-right')}
          />
        </>
      )}
    </div>
  )
}
