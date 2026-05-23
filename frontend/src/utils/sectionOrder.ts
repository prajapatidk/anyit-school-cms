import type { Section } from '../types'

export function sortSectionsByOrder(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0)
    if (orderDiff !== 0) return orderDiff
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0
    return aTime - bTime
  })
}

export function reorderSectionList(
  sections: Section[],
  activeId: string,
  overId: string,
): Section[] {
  const sorted = sortSectionsByOrder(sections)
  const oldIndex = sorted.findIndex((s) => s._id === activeId)
  const newIndex = sorted.findIndex((s) => s._id === overId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return sorted

  const next = [...sorted]
  const [moved] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, moved)
  return next.map((section, index) => ({ ...section, order: index }))
}
