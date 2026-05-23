import { configureStore } from '@reduxjs/toolkit'
import authReducer from './features/authSlice'
import sectionReducer from './features/sectionSlice'
import sectionDataReducer from './features/sectionDataSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sections: sectionReducer,
    sectionData: sectionDataReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
