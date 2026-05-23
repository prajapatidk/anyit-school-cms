export type FieldType =
  | 'input'
  | 'textarea'
  | 'number'
  | 'datepicker'
  | 'profile_upload'
  | 'select'
  | 'relation'

export interface DynamicField {
  id: string
  label: string
  grid: number
  type: FieldType
  required: boolean
  min?: number
  max?: number
  minDate?: string
  maxDate?: string
  options?: string[]
  targetSection?: string
  displayFields?: string[]
  valueField?: string
  multiple?: boolean
}

export interface Section {
  _id?: string
  name: string
  fields: DynamicField[]
  order?: number
  entryCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface SectionEntry {
  _id?: string
  sectionId: string
  data: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface User {
  id: string
  name: string
  email: string
}
