import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Grid,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { fetchSectionData } from '../features/sectionDataSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import type { DynamicField, Section } from '../types'
import {
  buildRelationOptions,
  formatRelationCellValue,
  normalizeRelationValue,
} from '../utils/relationField'
import { RelationFieldSelect } from './RelationFieldSelect'

interface SectionDataViewerProps {
  section: Section
  data?: Record<string, unknown>[]
  action: 'view' | 'create'
  onSaveData: (data: Record<string, unknown>) => Promise<void>
  onDeleteData?: (id: string) => Promise<void>
  loading?: boolean
}

interface FormData {
  [key: string]: unknown
}

export function SectionDataViewer({
  section,
  data = [],
  action,
  onSaveData,
  onDeleteData,
  loading = false,
}: SectionDataViewerProps) {
  const dispatch = useAppDispatch()
  const sections = useAppSelector((state) => state.sections.items)
  const entriesBySectionId = useAppSelector((state) => state.sectionData.entries)

  const [formData, setFormData] = useState<FormData>({})
  const [openDialog, setOpenDialog] = useState(action === 'create')
  const [editingId, setEditingId] = useState<string | null>(null)

  const relationTargets = useMemo(
    () => [
      ...new Set(
        section.fields
          .filter((f) => f.type === 'relation' && f.targetSection)
          .map((f) => f.targetSection as string),
      ),
    ],
    [section.fields],
  )

  useEffect(() => {
    relationTargets.forEach((targetName) => {
      const targetSection = sections.find((s) => s.name === targetName)
      if (targetSection?._id && !entriesBySectionId[targetSection._id]) {
        void dispatch(fetchSectionData(targetSection._id))
      }
    })
  }, [relationTargets, sections, entriesBySectionId, dispatch])

  const getTargetEntries = (targetSectionName: string): Record<string, unknown>[] => {
    const targetSection = sections.find((s) => s.name === targetSectionName)
    if (!targetSection?._id) return []
    return (entriesBySectionId[targetSection._id] ?? []) as unknown as Record<string, unknown>[]
  }

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...formData }
      section.fields
        .filter((f) => f.type === 'relation')
        .forEach((f) => {
          payload[f.id] = normalizeRelationValue(payload[f.id], f.multiple ?? false)
        })
      await onSaveData(payload)
      setFormData({})
      setOpenDialog(false)
      setEditingId(null)
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  const handleEdit = (rowData: Record<string, unknown>) => {
    const normalized: FormData = { ...rowData }
    section.fields
      .filter((f) => f.type === 'relation')
      .forEach((f) => {
        normalized[f.id] = normalizeRelationValue(rowData[f.id], f.multiple ?? false)
      })
    setFormData(normalized)
    setEditingId(rowData._id as string)
    setOpenDialog(true)
  }

  const renderField = (field: DynamicField) => {
    const value = formData[field.id] ?? ''

    switch (field.type) {
      case 'relation': {
        const targetEntries = field.targetSection ? getTargetEntries(field.targetSection) : []
        const options = buildRelationOptions(targetEntries, field)
        return (
          <RelationFieldSelect
            key={field.id}
            field={field}
            value={value}
            options={options}
            onChange={(next) => handleInputChange(field.id, next)}
          />
        )
      }
      case 'textarea':
        return (
          <TextField
            key={field.id}
            fullWidth
            multiline
            rows={4}
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            size="small"
          />
        )
      case 'number':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="number"
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            slotProps={{
              htmlInput: {
                min: field.min ? String(field.min) : undefined,
                max: field.max ? String(field.max) : undefined,
              },
            }}
            required={field.required}
            size="small"
          />
        )
      case 'datepicker':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="date"
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            required={field.required}
            size="small"
          />
        )
      case 'profile_upload':
        return (
          <TextField
            key={field.id}
            fullWidth
            type="file"
            label={field.label}
            onChange={(e) => handleInputChange(field.id, (e.target as HTMLInputElement).files?.[0])}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            required={field.required}
            size="small"
          />
        )
      case 'select':
        return (
          <TextField
            key={field.id}
            fullWidth
            select
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            size="small"
          >
            {field.options?.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        )
      case 'input':
      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            label={field.label}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            size="small"
          />
        )
    }
  }

  const formatCell = (row: Record<string, unknown>, field: DynamicField) => {
    if (field.type !== 'relation' || !field.targetSection) {
      return String(row[field.id] ?? '-')
    }
    const targetEntries = getTargetEntries(field.targetSection)
    const options = buildRelationOptions(targetEntries, field)
    return formatRelationCellValue(row[field.id], field, options)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {action === 'view' ? `View: ${section.name}` : `Create ${section.name}`}
        </Typography>
        {action === 'view' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setFormData({})
              setEditingId(null)
              setOpenDialog(true)
            }}
          >
            Add New Entry
          </Button>
        )}
      </Box>

      {action === 'view' ? (
        <>
          {data.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No entries yet. Create one to get started!
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    {section.fields.map((field) => (
                      <TableCell key={field.id}>
                        <strong>{field.label}</strong>
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={row._id as string}>
                      {section.fields.map((field) => (
                        <TableCell key={field.id}>{formatCell(row, field)}</TableCell>
                      ))}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button size="small" startIcon={<Edit />} onClick={() => handleEdit(row)}>
                            Edit
                          </Button>
                          {onDeleteData && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => onDeleteData(row._id as string)}
                            >
                              Delete
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {section.fields.map((field) => (
                <Grid key={field.id} size={{ xs: 12, md: field.grid }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
            <Button variant="contained" type="submit" disabled={loading} sx={{ mt: 3 }}>
              Create Entry
            </Button>
          </Box>
        </Paper>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? `Edit ${section.name}` : `Create New ${section.name}`}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {section.fields.map((field) => (
                <Grid key={field.id} size={{ xs: 12, md: field.grid }}>
                  {renderField(field)}
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
