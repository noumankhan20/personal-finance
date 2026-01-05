import { configureStore } from '@reduxjs/toolkit'
import { apiSlice } from '../slices/apiSlice'
import authReducer from '../slices/authSlice'
// import authSliceReducer from '@/slices/authSlice'

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),

  devTools: true,
})

// 👇 Type exports
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type RootDispatch = AppDispatch
