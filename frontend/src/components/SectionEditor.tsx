import { Box, Button, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'

import { useState } from 'react'

import type { FormEvent } from 'react'

import type { DynamicField, Section } from '../types'

import { fromDynamicFields, toDynamicFields, type BuilderField } from '../utils/builderField'

import { SectionFieldsEditor } from './SectionFieldsEditor'

interface Props {
  section: Section

  entryCount?: number

  onUpdateSection: (sectionId: string, name: string, fields: DynamicField[]) => Promise<void>

  onDeleteSection?: (section: Section) => void

  onCancel: () => void
}

export function SectionEditor({
  section,

  entryCount = 0,

  onUpdateSection,

  onDeleteSection,

  onCancel,
}: Props) {
  const [sectionName, setSectionName] = useState(section.name)

  const [fields, setFields] = useState<BuilderField[]>(() => fromDynamicFields(section.fields))

  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    setLoading(true)

    try {
      await onUpdateSection(section._id || '', sectionName, toDynamicFields(fields))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Edit Section: {section.name}
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Section Name"
          value={sectionName}
          onChange={(event) => setSectionName(event.target.value)}
          required
          sx={{ mb: 2 }}
        />

        <SectionFieldsEditor fields={fields} setFields={setFields} sectionName={sectionName} />

        <Stack direction="row" spacing={2} sx={{ mt: 3, flexWrap: 'wrap' }}>
          <Button type="button" variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" disabled={loading}>
            Update Section
          </Button>

          {onDeleteSection && (
            <Tooltip
              title={
                entryCount > 0
                  ? `Cannot delete: ${entryCount} record(s) in View Data. Delete all entries first.`
                  : 'Delete this section'
              }
            >
              <span>
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  disabled={loading || entryCount > 0}
                  onClick={() => onDeleteSection(section)}
                >
                  Delete Section
                </Button>
              </span>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Paper>
  )
}
