import { Autocomplete, TextField } from '@mui/material'
import type { DynamicField } from '../types'
import { relationValueToOptions, type RelationOption } from '../utils/relationField'

interface RelationFieldSelectProps {
  field: DynamicField
  value: unknown
  options: RelationOption[]
  onChange: (value: string | string[]) => void
}

export function RelationFieldSelect({ field, value, options, onChange }: RelationFieldSelectProps) {
  const multiple = field.multiple ?? false
  const selected = relationValueToOptions(value, options, multiple)

  return (
    <Autocomplete
      multiple={multiple}
      options={options}
      value={multiple ? selected : (selected[0] ?? null)}
      onChange={(_, newValue) => {
        if (multiple) {
          const picked = (newValue as RelationOption[]) ?? []
          onChange(picked.map((o) => o.value))
          return
        }
        const picked = newValue as RelationOption | null
        onChange(picked?.value ?? '')
      }}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      filterSelectedOptions={multiple}
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label}
          required={field.required}
          size="small"
          placeholder={options.length === 0 ? 'No entries in linked section yet' : 'Search…'}
        />
      )}
    />
  )
}
