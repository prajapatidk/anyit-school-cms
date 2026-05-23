import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'

import { useState } from 'react'

import type { FormEvent } from 'react'

import type { Section } from '../types'

import { newBuilderField, toDynamicFields, type BuilderField } from '../utils/builderField'

import { SectionFieldsEditor } from './SectionFieldsEditor'

interface Props {
  onSubmitSection: (section: Section) => Promise<void>
}

export function DynamicSectionBuilder({ onSubmitSection }: Props) {
  const [sectionName, setSectionName] = useState('user')

  const [fields, setFields] = useState<BuilderField[]>([newBuilderField()])

  const resetForm = () => {
    setSectionName('')

    setFields([newBuilderField()])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    await onSubmitSection({ name: sectionName, fields: toDynamicFields(fields) })

    resetForm()
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Create Dynamic Section
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

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button type="button" variant="outlined" color="inherit">
            Cancel
          </Button>

          <Button type="button" variant="outlined" onClick={resetForm}>
            Reset Form
          </Button>

          <Button type="submit" variant="contained">
            Submit / Update
          </Button>
        </Stack>
      </Box>
    </Paper>
  )
}
