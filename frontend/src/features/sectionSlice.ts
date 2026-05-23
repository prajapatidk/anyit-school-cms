import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { apiRequest } from '../services/api'
import type { RootState } from '../store'
import type { Section } from '../types'
import { reorderSectionList, sortSectionsByOrder } from '../utils/sectionOrder'

interface SectionState {
  items: Section[]
  loading: boolean
  error: string | null
}

const initialState: SectionState = {
  items: [],
  loading: false,
  error: null,
}

export const fetchSections = createAsyncThunk<Section[], void, { state: RootState }>(
  'sections/fetchSections',
  async (_, { getState }) => {
    const token = getState().auth.token
    return apiRequest<Section[]>('/sections', { token })
  },
)

export const createSection = createAsyncThunk<Section, Section, { state: RootState }>(
  'sections/createSection',
  async (payload, { getState }) => {
    const token = getState().auth.token
    return apiRequest<Section>('/sections', {
      method: 'POST',
      token,
      body: JSON.stringify(payload),
    })
  },
)

export const updateSection = createAsyncThunk<
  Section,
  { sectionId: string; name: string; fields: Section['fields'] },
  { state: RootState }
>('sections/updateSection', async ({ sectionId, name, fields }, { getState }) => {
  const token = getState().auth.token
  return apiRequest<Section>(`/sections/${sectionId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify({ name, fields }),
  })
})

export const reorderSections = createAsyncThunk<
  Section[],
  string[],
  { state: RootState; rejectValue: string }
>('sections/reorderSections', async (orderedIds, { getState, rejectWithValue }) => {
  const token = getState().auth.token
  try {
    return apiRequest<Section[]>('/sections/reorder', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ orderedIds }),
    })
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to reorder sections')
  }
})

export const deleteSection = createAsyncThunk<
  string,
  string,
  { state: RootState; rejectValue: string }
>('sections/deleteSection', async (sectionId, { getState, rejectWithValue }) => {
  const token = getState().auth.token
  try {
    await apiRequest<{ message: string }>(`/sections/${sectionId}`, {
      method: 'DELETE',
      token,
    })
    return sectionId
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete section')
  }
})

const sectionSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    setSectionOrderOptimistic: (
      state,
      action: PayloadAction<{ activeId: string; overId: string }>,
    ) => {
      state.items = reorderSectionList(state.items, action.payload.activeId, action.payload.overId)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSections.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false
        state.items = sortSectionsByOrder(action.payload)
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to fetch sections'
      })
      .addCase(createSection.fulfilled, (state, action) => {
        state.items = sortSectionsByOrder([...state.items, action.payload])
      })
      .addCase(reorderSections.fulfilled, (state, action) => {
        const entryCounts = Object.fromEntries(
          state.items.map((section) => [section._id, section.entryCount]),
        )
        state.items = sortSectionsByOrder(action.payload).map((section) => ({
          ...section,
          entryCount: entryCounts[section._id ?? ''] ?? section.entryCount,
        }))
        state.error = null
      })
      .addCase(reorderSections.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to reorder sections'
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        const index = state.items.findIndex((section) => section._id === action.payload._id)
        if (index !== -1) {
          const previous = state.items[index]
          state.items[index] = {
            ...action.payload,
            entryCount: previous.entryCount,
          }
        }
      })
      .addCase(deleteSection.fulfilled, (state, action) => {
        state.items = state.items.filter((section) => section._id !== action.payload)
        state.error = null
      })
      .addCase(deleteSection.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to delete section'
      })
  },
})

export const { setSectionOrderOptimistic } = sectionSlice.actions
export default sectionSlice.reducer
