import {
  Autocomplete,
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import { useEffect, useMemo } from 'react'
import { fetchSectionData } from '../features/sectionDataSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import type { DynamicField } from '../types'
import {
  buildRelationOptions,
  formatFieldChoiceLabel,
  getRelationDisplayFieldChoices,
  getRelationValueFieldChoices,
  RELATION_ENTRY_ID,
  suggestRelationDefaults,
  type RelationFieldChoice,
} from '../utils/relationField'

interface RelationFieldSettingsProps {
  field: DynamicField
  currentSectionName?: string
  onChange: (patch: Partial<DynamicField>) => void
}

export function RelationFieldSettings({
  field,
  currentSectionName,
  onChange,
}: RelationFieldSettingsProps) {
  const dispatch = useAppDispatch()
  const sections = useAppSelector((state) => state.sections.items)
  const entriesBySectionId = useAppSelector((state) => state.sectionData.entries)

  const linkableSections = sections.filter((s) => s.name !== currentSectionName)
  const targetSection = sections.find((s) => s.name === field.targetSection)

  const displayChoices = useMemo(
    () => (targetSection ? getRelationDisplayFieldChoices(targetSection.fields) : []),
    [targetSection],
  )

  const valueChoices = useMemo(
    () => (targetSection ? getRelationValueFieldChoices(targetSection.fields) : []),
    [targetSection],
  )

  const selectedDisplayChoices = useMemo(
    () =>
      (field.displayFields ?? [])
        .map((id) => displayChoices.find((c) => c.id === id))
        .filter((c): c is RelationFieldChoice => c != null),
    [field.displayFields, displayChoices],
  )

  useEffect(() => {
    if (!targetSection?._id) return
    if (!entriesBySectionId[targetSection._id]) {
      void dispatch(fetchSectionData(targetSection._id))
    }
  }, [targetSection, entriesBySectionId, dispatch])

  const sampleEntries = useMemo(() => {
    if (!targetSection?._id) return []
    return (entriesBySectionId[targetSection._id] ?? []) as unknown as Record<string, unknown>[]
  }, [targetSection, entriesBySectionId])

  const previewLabel = useMemo(() => {
    if (!field.targetSection || sampleEntries.length === 0) return null
    const options = buildRelationOptions(sampleEntries, field)
    return options[0]?.label || null
  }, [field, sampleEntries])

  const applyTargetDefaults = (targetSectionName: string) => {
    const section = sections.find((s) => s.name === targetSectionName)
    const defaults = section
      ? suggestRelationDefaults(section.fields)
      : { displayFields: [], valueField: RELATION_ENTRY_ID }
    onChange({
      targetSection: targetSectionName,
      ...defaults,
    })
  }

  const valueFieldOptions: { id: string; label: string }[] = [
    { id: RELATION_ENTRY_ID, label: 'Entry ID (unique, recommended if unsure)' },
    ...valueChoices.map((c) => ({ id: c.id, label: formatFieldChoiceLabel(c) })),
  ]

  return (
    <Grid size={{ xs: 12 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Link to another section. Pick which fields from that section appear in the dropdown and
        which value is saved on this entry.
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth required>
            <InputLabel>Link to section</InputLabel>
            <Select
              label="Link to section"
              value={field.targetSection ?? ''}
              onChange={(e) => applyTargetDefaults(e.target.value)}
            >
              {linkableSections.map((s) => (
                <MenuItem key={s._id ?? s.name} value={s.name}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            multiple
            disabled={!field.targetSection || displayChoices.length === 0}
            options={displayChoices}
            value={selectedDisplayChoices}
            onChange={(_, picked) => onChange({ displayFields: picked.map((c) => c.id) })}
            getOptionLabel={formatFieldChoiceLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                label="Dropdown label fields"
                placeholder={
                  !field.targetSection
                    ? 'Select a section first'
                    : displayChoices.length === 0
                      ? 'No text fields in linked section'
                      : 'Pick one or more fields'
                }
                helperText="Shown together in the dropdown (e.g. first + last name)"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <FormControl fullWidth disabled={!field.targetSection}>
            <InputLabel>Stored value</InputLabel>
            <Select
              label="Stored value"
              value={field.valueField ?? RELATION_ENTRY_ID}
              onChange={(e) => onChange({ valueField: e.target.value })}
            >
              {valueFieldOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Saved on this entry when an option is chosen
            </Typography>
          </FormControl>
        </Grid>

        {field.targetSection && previewLabel && (
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Preview (first linked entry): <strong>{previewLabel}</strong>
              </Typography>
            </Box>
          </Grid>
        )}

        {field.targetSection && displayChoices.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="warning.main">
              The &quot;{field.targetSection}&quot; section has no label fields yet. Add input or
              select fields there first.
            </Typography>
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={field.multiple ?? false}
                onChange={(e) => onChange({ multiple: e.target.checked })}
              />
            }
            label="Allow multiple selections"
          />
        </Grid>
      </Grid>
    </Grid>
  )
}
