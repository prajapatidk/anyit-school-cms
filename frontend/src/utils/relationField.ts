import type { DynamicField, FieldType } from '../types'

export interface RelationOption {
  value: string
  label: string
}

export const RELATION_ENTRY_ID = '_id'

const DISPLAY_FIELD_TYPES: FieldType[] = ['input', 'textarea', 'select', 'number', 'datepicker']

const VALUE_FIELD_TYPES: FieldType[] = ['input', 'textarea', 'select', 'number']

export interface RelationFieldChoice {
  id: string
  label: string
  type: FieldType
}

export function getRelationDisplayFieldChoices(fields: DynamicField[]): RelationFieldChoice[] {
  return fields
    .filter((f) => DISPLAY_FIELD_TYPES.includes(f.type))
    .map((f) => ({ id: f.id, label: f.label || f.id, type: f.type }))
}

export function getRelationValueFieldChoices(fields: DynamicField[]): RelationFieldChoice[] {
  return fields
    .filter((f) => VALUE_FIELD_TYPES.includes(f.type))
    .map((f) => ({ id: f.id, label: f.label || f.id, type: f.type }))
}

/** Sensible defaults from the linked section's field definitions. */
export function suggestRelationDefaults(fields: DynamicField[]): {
  displayFields: string[]
  valueField: string
} {
  const displayChoices = getRelationDisplayFieldChoices(fields)
  const valueChoices = getRelationValueFieldChoices(fields)

  const displayFields = displayChoices
    .filter((f) => f.type === 'input' || f.type === 'textarea' || f.type === 'select')
    .slice(0, 2)
    .map((f) => f.id)

  const namedValue =
    valueChoices.find((f) => /code|number|name|email|username|title/i.test(`${f.id} ${f.label}`)) ??
    valueChoices[0]

  return {
    displayFields:
      displayFields.length > 0 ? displayFields : displayChoices.slice(0, 1).map((f) => f.id),
    valueField: namedValue?.id ?? RELATION_ENTRY_ID,
  }
}

export function formatFieldChoiceLabel(choice: RelationFieldChoice): string {
  return choice.label === choice.id ? choice.label : `${choice.label} (${choice.id})`
}

export function formatEntryLabel(
  entry: Record<string, unknown>,
  displayFields: string[],
  valueField: string,
): string {
  const parts = displayFields
    .map((key) => entry[key])
    .filter((v) => v != null && v !== '')
    .map(String)
  if (parts.length > 0) return parts.join(' ')
  const fallback = entry[valueField]
  if (fallback != null && fallback !== '') return String(fallback)
  return entry._id != null ? String(entry._id) : ''
}

export function buildRelationOptions(
  entries: Record<string, unknown>[],
  field: DynamicField,
): RelationOption[] {
  const valueField = field.valueField ?? '_id'
  const displayFields = field.displayFields ?? []
  return entries.map((entry) => ({
    value: String(entry[valueField] ?? entry._id ?? ''),
    label: formatEntryLabel(entry, displayFields, valueField),
  }))
}

export function normalizeRelationValue(value: unknown, multiple: boolean): string | string[] {
  if (multiple) {
    if (Array.isArray(value)) return value.map(String)
    if (value == null || value === '') return []
    return [String(value)]
  }
  if (Array.isArray(value)) return value[0] != null ? String(value[0]) : ''
  return value != null ? String(value) : ''
}

export function relationValueToOptions(
  value: unknown,
  options: RelationOption[],
  multiple: boolean,
): RelationOption[] {
  const normalized = normalizeRelationValue(value, multiple)
  const values = multiple ? (normalized as string[]) : normalized ? [normalized as string] : []
  return values
    .map((v) => options.find((o) => o.value === v))
    .filter((o): o is RelationOption => o != null)
}

export function formatRelationCellValue(
  value: unknown,
  field: DynamicField,
  options: RelationOption[],
): string {
  const selected = relationValueToOptions(value, options, field.multiple ?? false)
  if (selected.length === 0) {
    const raw = normalizeRelationValue(value, field.multiple ?? false)
    if (Array.isArray(raw)) return raw.length ? raw.join(', ') : '-'
    return raw ? String(raw) : '-'
  }
  return selected.map((o) => o.label).join(', ')
}
