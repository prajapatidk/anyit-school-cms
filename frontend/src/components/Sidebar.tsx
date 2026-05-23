import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, Delete, DragIndicator, ExpandMore, Edit, Visibility } from '@mui/icons-material'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Section } from '../types'

interface SidebarProps {
  sections: Section[]
  onSelectSection: (section: Section, action: 'view' | 'create' | 'edit') => void
  onReorderSections?: (activeId: string, overId: string) => void
  onDeleteSection?: (section: Section) => void
  selectedSection?: Section
  selectedAction?: 'view' | 'create' | 'edit'
}

interface SortableSectionItemProps {
  section: Section
  onSelectSection: (section: Section, action: 'view' | 'create' | 'edit') => void
  onDeleteSection?: (section: Section) => void
  selectedSection?: Section
  selectedAction?: 'view' | 'create' | 'edit'
}

function SortableSectionItem({
  section,
  onSelectSection,
  onDeleteSection,
  selectedSection,
  selectedAction,
}: SortableSectionItemProps) {
  const sectionId = section._id ?? section.name
  const entryCount = section.entryCount ?? 0
  const hasRecords = entryCount > 0
  const deleteTooltip = hasRecords
    ? `Cannot delete: ${entryCount} record(s) in View Data. Delete all entries first.`
    : 'Delete this section'

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionId,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  }

  return (
    <Box ref={setNodeRef} style={style}>
      <Accordion
        sx={{
          '&.MuiAccordion-root': {
            backgroundColor: selectedSection?._id === section._id ? 'primary.light' : 'transparent',
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 0.5,
              my: 0.5,
            },
          }}
        >
          <Tooltip title="Drag to reorder">
            <IconButton
              size="small"
              aria-label={`Reorder ${section.name}`}
              sx={{ cursor: isDragging ? 'grabbing' : 'grab', p: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              {...attributes}
              {...listeners}
            >
              <DragIndicator fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle2" sx={{ fontWeight: 500, flex: 1 }}>
            {section.name}
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 1 }}>
          <Stack spacing={0.5}>
            <Button
              fullWidth
              size="small"
              variant={
                selectedAction === 'view' && selectedSection?._id === section._id
                  ? 'contained'
                  : 'outlined'
              }
              startIcon={<Visibility fontSize="small" />}
              onClick={() => onSelectSection(section, 'view')}
              sx={{ justifyContent: 'flex-start' }}
            >
              View Data
            </Button>
            <Button
              fullWidth
              size="small"
              variant={
                selectedAction === 'create' && selectedSection?._id === section._id
                  ? 'contained'
                  : 'outlined'
              }
              startIcon={<Add fontSize="small" />}
              onClick={() => onSelectSection(section, 'create')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Create Entry
            </Button>
            <Button
              fullWidth
              size="small"
              variant={
                selectedAction === 'edit' && selectedSection?._id === section._id
                  ? 'contained'
                  : 'outlined'
              }
              startIcon={<Edit fontSize="small" />}
              onClick={() => onSelectSection(section, 'edit')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Edit Section
            </Button>
            {onDeleteSection && (
              <Tooltip title={deleteTooltip}>
                <span style={{ width: '100%' }}>
                  <Button
                    fullWidth
                    size="small"
                    color="error"
                    variant="outlined"
                    disabled={hasRecords}
                    startIcon={<Delete fontSize="small" />}
                    onClick={() => onDeleteSection(section)}
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Delete Section
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export function Sidebar({
  sections,
  onSelectSection,
  onReorderSections,
  onDeleteSection,
  selectedSection,
  selectedAction,
}: SidebarProps) {
  const sortableIds = sections.map((section) => section._id ?? section.name)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !onReorderSections) return
    onReorderSections(String(active.id), String(over.id))
  }

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 'bold' }}>
          Sections
        </Typography>
        {sections.length > 0 && onReorderSections && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Drag the handle to reorder
          </Typography>
        )}
        {sections.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No sections created yet. Create one to get started!
          </Typography>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <Stack spacing={1}>
                {sections.map((section) => (
                  <SortableSectionItem
                    key={section._id ?? section.name}
                    section={section}
                    onSelectSection={onSelectSection}
                    onDeleteSection={onDeleteSection}
                    selectedSection={selectedSection}
                    selectedAction={selectedAction}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        )}
      </Box>
    </Paper>
  )
}
