import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../slices/apiSlice'
// import authSliceReducer from '@/slices/authSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    // auth: authSliceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),

  devTools: true,
})

// 👇 Type exports
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type RootDispatch = AppDispatch
