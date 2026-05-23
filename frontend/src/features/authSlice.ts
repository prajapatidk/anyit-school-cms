import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiRequest } from '../services/api'
import type { User } from '../types'

interface AuthResponse {
  token: string
  user: User
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,
}

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
)

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (payload: { name: string; email: string; password: string }) =>
    apiRequest<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut(state) {
      state.token = null
      state.user = null
      localStorage.removeItem('token')
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Sign in failed'
      })
      .addCase(signUp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        localStorage.setItem('token', action.payload.token)
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message ?? 'Sign up failed'
      })
  },
})

export const { signOut } = authSlice.actions
export default authSlice.reducer
