import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
}

// ✅ Safe helper
const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

const initialState: AuthState = {
  accessToken: getInitialToken(),
  isAuthenticated: !!getInitialToken(),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
      state.isAuthenticated = true

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', action.payload)
      }
    },

    logout: (state) => {
      state.accessToken = null
      state.isAuthenticated = false

      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
      }
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
