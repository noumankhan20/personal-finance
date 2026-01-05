import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
// import { logout } from './authSlice'
// 1️⃣ base fetch with cookies

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:5000/api',
  credentials: 'include', // VERY important: send cookies with every request
})

// 2️⃣ wrap to handle 401 and auto-logout
const baseQueryWithAutoLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // api.dispatch(logout())
  }

  return result
}

// 3️⃣ use wrapped baseQuery in apiSlice
export const apiSlice = createApi({
  baseQuery: baseQueryWithAutoLogout,
  tagTypes: [
    'Account',
    'Category',
    'Entry',
    'Loan',
  ],
  endpoints: () => ({}),
})
