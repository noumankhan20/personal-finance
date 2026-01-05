import { apiSlice } from './apiSlice'

/* =========================
   Types
========================= */

export type EntryType = 'income' | 'expense' | 'transfer'

export interface Entry {
  id: string
  entryType: EntryType
  date: string

  amount: number
  description: string
  notes: string | null

  accountId: string
  categoryId: string | null
  linkedLoanId: string | null

  transferGroupId: string | null
  counterAccountId: string | null

  createdAt: string
  updatedAt: string
}

/* =========================
   Payloads
========================= */

export interface CreateEntryPayload {
  entryType: Exclude<EntryType, 'transfer'>
  date: string
  amount: number
  description: string
  notes?: string

  accountId: string
  categoryId?: string | null
  linkedLoanId?: string | null
}

export interface CreateTransferPayload {
  date: string
  amount: number
  description: string
  notes?: string

  fromAccountId: string
  toAccountId: string
}

export interface UpdateEntryPayload {
  id: string
  date?: string
  amount?: number
  description?: string
  notes?: string
  categoryId?: string | null
  linkedLoanId?: string | null
}

/* =========================
   API Slice
========================= */

export const entriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/entries
    getEntries: builder.query<Entry[], void>({
      query: () => '/entries',
      providesTags: ['Entry'],
    }),

    // GET /api/entries/:id
    getEntryById: builder.query<Entry, string>({
      query: (id) => `/entries/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Entry', id }],
    }),

    // POST /api/entries (expense / income)
    createEntry: builder.mutation<Entry, CreateEntryPayload>({
      query: (body) => ({
        url: '/entries',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Entry', 'Account'],
    }),

    // POST /api/entries/transfer
    createTransfer: builder.mutation<
      { transferGroupId: string },
      CreateTransferPayload
    >({
      query: (body) => ({
        url: '/entries/transfer',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Entry', 'Account'],
    }),

    // PUT /api/entries/:id
    updateEntry: builder.mutation<Entry, UpdateEntryPayload>({
      query: ({ id, ...body }) => ({
        url: `/entries/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'Entry', id: arg.id },
      ],
    }),

    // DELETE /api/entries/:id
    deleteEntry: builder.mutation<void, string>({
      query: (id) => ({
        url: `/entries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Entry', 'Account'],
    }),
  }),
})

/* =========================
   Hooks
========================= */

export const {
  useGetEntriesQuery,
  useGetEntryByIdQuery,
  useCreateEntryMutation,
  useCreateTransferMutation,
  useUpdateEntryMutation,
  useDeleteEntryMutation,
} = entriesApiSlice
