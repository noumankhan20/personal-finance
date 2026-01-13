import { apiSlice } from "./apiSlice";

export type CategoryType = "expense" | "income";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

interface CreateCategoryPayload {
  name: string;
  type: CategoryType;
  parentId?: string;
}

interface UpdateCategoryPayload {
  id: string;
  name?: string;
  parentId?: string | null;
}

export const categoriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ----------------------------------------------------
       GET CATEGORIES
       GET /api/categories/get?type=expense|income
    ---------------------------------------------------- */
    getCategories: builder.query<Category[], CategoryType | void>({
      query: (type) => ({
        url: `/categories/get`,
        params: { type },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: "Category" as const,
                id,
              })),
              { type: "Category", id: "LIST" },
            ]
          : [{ type: "Category", id: "LIST" }],
    }),

    /* ----------------------------------------------------
       CREATE CATEGORY
       POST /api/categories/create
    ---------------------------------------------------- */
    createCategory: builder.mutation<Category, CreateCategoryPayload>({
      query: (body) => ({
        url: `/categories/create`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),

    /* ----------------------------------------------------
       UPDATE CATEGORY
       PUT /api/categories/:id/update
    ---------------------------------------------------- */
    updateCategory: builder.mutation<Category, UpdateCategoryPayload>({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}/update`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Category", id: arg.id },
        { type: "Category", id: "LIST" },
      ],
    }),

    /* ----------------------------------------------------
       DELETE CATEGORY
       DELETE /api/categories/:id/delete
    ---------------------------------------------------- */
    deleteCategory: builder.mutation<
      { message: string },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/categories/${id}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApiSlice;
