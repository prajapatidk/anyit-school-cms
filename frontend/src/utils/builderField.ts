import type { DynamicField } from '../types'

export type BuilderField = DynamicField & { clientId: string }

export function newBuilderField(): BuilderField {
  return {
    clientId: crypto.randomUUID(),
    id: '',
    label: '',
    grid: 12,
    type: 'input',
    required: false,
    options: [],
  }
}

export function fromDynamicFields(fields: DynamicField[]): BuilderField[] {
  return fields.map((field) => ({ ...field, clientId: crypto.randomUUID() }))
}

export function toDynamicFields(fields: BuilderField[]): DynamicField[] {
  return fields.map(({ clientId: _clientId, ...field }) => field)
}

export function reorderBuilderFields(
  fields: BuilderField[],
  activeClientId: string,
  overClientId: string,
): BuilderField[] {
  const oldIndex = fields.findIndex((field) => field.clientId === activeClientId)
  const newIndex = fields.findIndex((field) => field.clientId === overClientId)
  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return fields

  const next = [...fields]
  const [moved] = next.splice(oldIndex, 1)
  next.splice(newIndex, 0, moved)
  return next
}
