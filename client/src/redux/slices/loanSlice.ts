import { apiSlice } from "./apiSlice";
import {Loan,LoanRepayment} from "@/types/loans"

export const loansApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /* -------------------------------
       GET ALL LOANS
       GET /api/loans/get
    -------------------------------- */
    getLoans: builder.query<Loan[], void>({
      query: () => "/loans/get",
      providesTags: ["Loan"],
    }),

    /* -------------------------------
       GET SINGLE LOAN
       GET /api/loans/:id/get
    -------------------------------- */
    getLoanById: builder.query<Loan, string>({
      query: (id) => `/loans/${id}/get`,
      providesTags: (_result, _err, id) => [{ type: "Loan", id }],
    }),

    /* -------------------------------
       CREATE LOAN
       POST /api/loans/create
    -------------------------------- */
    createLoan: builder.mutation<Loan, Partial<Loan>>({
      query: (body) => ({
        url: "/loans/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loan"],
    }),

    /* -------------------------------
       UPDATE LOAN
       PUT /api/loans/:id/update
    -------------------------------- */
    updateLoan: builder.mutation<
      Loan,
      { id: string; data: Partial<Loan> }
    >({
      query: ({ id, data }) => ({
        url: `/loans/${id}/update`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: "Loan", id },
        "Loan",
      ],
    }),

    /* -------------------------------
       DELETE LOAN
       DELETE /api/loans/:id/delete
    -------------------------------- */
    deleteLoan: builder.mutation<
      { message: string },
      string
    >({
      query: (id) => ({
        url: `/loans/${id}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Loan"],
    }),

     createLoanRepayment: builder.mutation<
      LoanRepayment,
      {
        loanId: string;
        amount: number;
        repaymentType: "PRINCIPAL" | "INTEREST";
        date: string;
        notes?: string;
      }
    >({
      query: ({ loanId, ...body }) => ({
        url: `/loans/${loanId}/create-repayment`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { loanId }) => [
        { type: "Loan", id: loanId },
        "Loan",
      ],
    }),

    /* -------------------------------
       GET REPAYMENTS FOR A LOAN
       GET /api/loans/:loanId/get-repayment
    -------------------------------- */
    getLoanRepayments: builder.query<LoanRepayment[], string>({
      query: (loanId) => `/loans/${loanId}/get-repayment`,
      providesTags: (_res, _err, loanId) => [
        { type: "Loan", id: loanId },
      ],
    }),

  }),
});

export const {
  useGetLoansQuery,
  useGetLoanByIdQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useCreateLoanRepaymentMutation,
  useGetLoanRepaymentsQuery,
} = loansApiSlice;