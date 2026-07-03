import { PERIODS, periodIndex } from '../data/periods'
import type { ColorAssigner } from './activityColors'
import type { ActivityCategory, NewPlanItemPayload, PlanItem } from '../types/api'

export interface PlanBlock {
  id: string
  groupKey: string
  title: string
  description: string
  category: ActivityCategory
  sourceActivityId?: string
  startIndex: number
  endIndex: number
  color: string
}

export function groupKeyForItem(item: PlanItem): string {
  return item.sourceActivityId ?? item.title
}

export function buildPlanItemGroupMap(items: PlanItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const item of items) map.set(item.id, groupKeyForItem(item))
  return map
}

export function itemsToBlocks(items: PlanItem[], colorFor: ColorAssigner): PlanBlock[] {
  const byGroup = new Map<string, PlanItem[]>()
  for (const item of items) {
    const groupKey = groupKeyForItem(item)
    const list = byGroup.get(groupKey)
    if (list) list.push(item)
    else byGroup.set(groupKey, [item])
  }

  const blocks: PlanBlock[] = []

  for (const [groupKey, groupItems] of byGroup) {
    const sorted = [...groupItems].sort((a, b) => periodIndex(a.periodKey) - periodIndex(b.periodKey))
    let current: PlanBlock | null = null
    let prevIdx = Number.NaN

    for (const item of sorted) {
      const idx = periodIndex(item.periodKey)
      if (current && idx === prevIdx + 1) {
        current.endIndex = idx
      } else {
        current = {
          id: item.id,
          groupKey,
          title: item.title,
          description: item.description,
          category: item.category,
          sourceActivityId: item.sourceActivityId,
          startIndex: idx,
          endIndex: idx,
          color: colorFor(groupKey),
        }
        blocks.push(current)
      }
      prevIdx = idx
    }
  }

  return blocks.sort((a, b) => a.startIndex - b.startIndex)
}

export function cloneBlocks(blocks: PlanBlock[]): PlanBlock[] {
  return blocks.map((b) => ({ ...b, id: crypto.randomUUID() }))
}

export interface LanedPlanBlock extends PlanBlock {
  lane: number
}

export function assignLanes(blocks: PlanBlock[]): LanedPlanBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startIndex - b.startIndex)
  const laneEnds: number[] = []
  const result: LanedPlanBlock[] = []

  for (const block of sorted) {
    let lane = laneEnds.findIndex((end) => end < block.startIndex)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(block.endIndex)
    } else {
      laneEnds[lane] = block.endIndex
    }
    result.push({ ...block, lane })
  }

  return result
}

export function blocksToItemPayloads(blocks: PlanBlock[]): NewPlanItemPayload[] {
  const laned = assignLanes(blocks)
  const payloads: NewPlanItemPayload[] = []

  for (const block of laned) {
    for (let idx = block.startIndex; idx <= block.endIndex; idx += 1) {
      payloads.push({
        periodKey: PERIODS[idx].key,
        periodLabel: PERIODS[idx].label,
        title: block.title,
        description: block.description,
        category: block.category,
        sourceActivityId: block.sourceActivityId,
        orderIndex: block.lane,
      })
    }
  }

  return payloads
}

function describeBlocks(blocks: PlanBlock[]): string {
  return [...blocks]
    .sort((a, b) => a.startIndex - b.startIndex)
    .map((b) => {
      const span = b.startIndex === b.endIndex ? PERIODS[b.startIndex].label : `${PERIODS[b.startIndex].label}~${PERIODS[b.endIndex].label}`
      return `- ${span}: ${b.title}`
    })
    .join('\n')
}

export function buildComparisonMessage(aiBlocks: PlanBlock[], userBlocks: PlanBlock[]): string {
  return `다음은 AI가 추천한 원래 시간표와 제가 수정한 시간표예요.\n\n[AI 추천 시간표]\n${describeBlocks(aiBlocks)}\n\n[제가 수정한 시간표]\n${describeBlocks(userBlocks)}\n\n두 시간표를 비교해서 제 수정안의 장점과 단점을 알려주세요.`
}
