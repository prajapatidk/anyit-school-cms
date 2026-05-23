import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiRequest } from '../services/api'
import type { RootState } from '../store'
import type { SectionEntry } from '../types'

interface SectionDataState {
  entries: Record<string, SectionEntry[]>
  loading: boolean
  error: string | null
}

const initialState: SectionDataState = {
  entries: {},
  loading: false,
  error: null,
}

export const fetchSectionData = createAsyncThunk<SectionEntry[], string, { state: RootState }>(
  'sectionData/fetchSectionData',
  async (sectionId, { getState }) => {
    const token = getState().auth.token
    return apiRequest<SectionEntry[]>(`/sections/${sectionId}/entries`, { token })
  },
)

export const createSectionEntry = createAsyncThunk<
  SectionEntry,
  { sectionId: string; data: Record<string, unknown> },
  { state: RootState }
>('sectionData/createSectionEntry', async ({ sectionId, data }, { getState }) => {
  const token = getState().auth.token
  return apiRequest<SectionEntry>(`/sections/${sectionId}/entries`, {
    method: 'POST',
    token,
    body: JSON.stringify(data),
  })
})

export const updateSectionEntry = createAsyncThunk<
  SectionEntry,
  { sectionId: string; entryId: string; data: Record<string, unknown> },
  { state: RootState }
>('sectionData/updateSectionEntry', async ({ sectionId, entryId, data }, { getState }) => {
  const token = getState().auth.token
  return apiRequest<SectionEntry>(`/sections/${sectionId}/entries/${entryId}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(data),
  })
})

export const deleteSectionEntry = createAsyncThunk<
  string,
  { sectionId: string; entryId: string },
  { state: RootState }
>('sectionData/deleteSectionEntry', async ({ sectionId, entryId }, { getState }) => {
  const token = getState().auth.token
  await apiRequest<void>(`/sections/${sectionId}/entries/${entryId}`, {
    method: 'DELETE',
    token,
  })
  return entryId
})

const sectionDataSlice = createSlice({
  name: 'sectionData',
  initialState,
  reducers: {
    clearSectionData: (state, action) => {
      delete state.entries[action.payload]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectionData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSectionData.fulfilled, (state, action) => {
        state.loading = false
        const sectionId = action.meta.arg
        state.entries[sectionId] = action.payload
      })
      .addCase(fetchSectionData.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Failed to fetch section data'
      })
      .addCase(createSectionEntry.fulfilled, (state, action) => {
        const sectionId = action.meta.arg.sectionId
        if (!state.entries[sectionId]) {
          state.entries[sectionId] = []
        }
        state.entries[sectionId].push(action.payload)
      })
      .addCase(updateSectionEntry.fulfilled, (state, action) => {
        const sectionId = action.meta.arg.sectionId
        if (state.entries[sectionId]) {
          const index = state.entries[sectionId].findIndex(
            (entry) => entry._id === action.payload._id,
          )
          if (index !== -1) {
            state.entries[sectionId][index] = action.payload
          }
        }
      })
      .addCase(deleteSectionEntry.fulfilled, (state, action) => {
        const { sectionId, entryId } = action.meta.arg
        if (state.entries[sectionId]) {
          state.entries[sectionId] = state.entries[sectionId].filter(
            (entry) => entry._id !== entryId,
          )
        }
      })
  },
})

export const { clearSectionData } = sectionDataSlice.actions
export default sectionDataSlice.reducer
