import { Box, Button, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DynamicSectionBuilder } from '../components/DynamicSectionBuilder'
import { Sidebar } from '../components/Sidebar'
import { SectionDataViewer } from '../components/SectionDataViewer'
import { SectionEditor } from '../components/SectionEditor'
import { signOut } from '../features/authSlice'
import {
  createSection,
  deleteSection,
  fetchSections,
  reorderSections,
  setSectionOrderOptimistic,
  updateSection,
} from '../features/sectionSlice'
import {
  clearSectionData,
  createSectionEntry,
  deleteSectionEntry,
  fetchSectionData,
  updateSectionEntry,
} from '../features/sectionDataSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import type { DynamicField, Section } from '../types'
import { reorderSectionList } from '../utils/sectionOrder'

export function DashboardPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const sections = useAppSelector((state) => state.sections.items)
  const sectionData = useAppSelector((state) => state.sectionData.entries)

  const sectionNameParam = searchParams.get('sectionName')
  const actionParam = searchParams.get('action') as 'view' | 'create' | 'edit' | null

  const selectedSection = sections.find((s) => s.name === sectionNameParam)
  const selectedAction = actionParam || (sectionNameParam ? 'view' : undefined)
  const showBuilder = !sectionNameParam

  useEffect(() => {
    void dispatch(fetchSections())
  }, [dispatch])

  useEffect(() => {
    if (selectedSection?._id && selectedAction === 'view') {
      void dispatch(fetchSectionData(selectedSection._id))
    }
  }, [selectedSection?._id, selectedAction, dispatch])

  const handleSignOut = () => {
    dispatch(signOut())
    navigate('/signin')
  }

  const handleSubmitSection = async (section: Section) => {
    await dispatch(createSection(section))
    setSearchParams({})
  }

  const handleSelectSection = (section: Section, action: 'view' | 'create' | 'edit') => {
    setSearchParams({ sectionName: section.name, action })
  }

  const handleUpdateSection = async (sectionId: string, name: string, fields: DynamicField[]) => {
    await dispatch(updateSection({ sectionId, name, fields }))
    setSearchParams({ sectionName: name, action: 'view' })
  }

  const getSectionEntryCount = (section: Section) => {
    if (section.entryCount != null) return section.entryCount
    if (section._id && sectionData[section._id]) return sectionData[section._id].length
    return 0
  }

  const handleReorderSections = async (activeId: string, overId: string) => {
    const orderedIds = reorderSectionList(sections, activeId, overId)
      .map((section) => section._id)
      .filter(Boolean) as string[]

    dispatch(setSectionOrderOptimistic({ activeId, overId }))

    const result = await dispatch(reorderSections(orderedIds))
    if (reorderSections.rejected.match(result)) {
      void dispatch(fetchSections())
      window.alert(result.payload ?? 'Failed to save section order')
    }
  }

  const handleDeleteSection = async (section: Section) => {
    if (!section._id) return

    const entryCount = getSectionEntryCount(section)
    if (entryCount > 0) {
      window.alert(
        `Cannot delete "${section.name}" because it has ${entryCount} record(s). Open View Data and delete all entries first.`,
      )
      return
    }

    if (!window.confirm(`Delete section "${section.name}"? This cannot be undone.`)) return

    const result = await dispatch(deleteSection(section._id))
    if (deleteSection.fulfilled.match(result)) {
      dispatch(clearSectionData(section._id))
      setSearchParams({})
      return
    }
    if (deleteSection.rejected.match(result)) {
      window.alert(result.payload ?? 'Failed to delete section')
    }
  }

  const handleSaveData = async (data: Record<string, unknown>) => {
    if (!selectedSection?._id) return

    if ('_id' in data && data._id) {
      await dispatch(
        updateSectionEntry({
          sectionId: selectedSection._id,
          entryId: data._id as string,
          data: Object.fromEntries(Object.entries(data).filter(([key]) => key !== '_id')),
        }),
      )
    } else {
      await dispatch(
        createSectionEntry({
          sectionId: selectedSection._id,
          data,
        }),
      )
    }
    await dispatch(fetchSections())
  }

  const handleDeleteData = async (entryId: string) => {
    if (!selectedSection?._id) return
    await dispatch(
      deleteSectionEntry({
        sectionId: selectedSection._id,
        entryId,
      }),
    )
    void dispatch(fetchSections())
  }

  const currentData = selectedSection?._id ? sectionData[selectedSection._id] || [] : []

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4">CMS Dashboard</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={showBuilder ? 'contained' : 'outlined'}
            onClick={() => setSearchParams({})}
          >
            Create Section
          </Button>
          <Button variant="outlined" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Box
          sx={{
            width: 250,
            borderRight: '1px solid #e0e0e0',
            overflow: 'auto',
          }}
        >
          <Sidebar
            sections={sections}
            onSelectSection={handleSelectSection}
            onReorderSections={handleReorderSections}
            onDeleteSection={handleDeleteSection}
            selectedSection={selectedSection}
            selectedAction={selectedAction}
          />
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          {showBuilder ? (
            <DynamicSectionBuilder onSubmitSection={handleSubmitSection} />
          ) : selectedSection && selectedAction === 'edit' ? (
            <SectionEditor
              section={selectedSection}
              entryCount={getSectionEntryCount(selectedSection)}
              onUpdateSection={handleUpdateSection}
              onDeleteSection={handleDeleteSection}
              onCancel={() => {
                setSearchParams({ sectionName: selectedSection.name, action: 'view' })
              }}
            />
          ) : selectedSection && (selectedAction === 'view' || selectedAction === 'create') ? (
            <SectionDataViewer
              section={selectedSection}
              data={currentData as unknown as Record<string, unknown>[]}
              action={selectedAction}
              onSaveData={handleSaveData}
              onDeleteData={handleDeleteData}
            />
          ) : (
            <Box sx={{ textAlign: 'center', pt: 5 }}>
              <Typography variant="h6" color="textSecondary">
                Select a section from the sidebar or create a new one
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
