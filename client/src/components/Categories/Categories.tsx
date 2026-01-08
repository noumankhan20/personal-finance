"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Folder, ChevronRight, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  Category,
  CategoryType,
} from "@/redux/slices/categoriesSlice";
import { useRouter } from "next/navigation";
interface FormData {
  name: string;
  parentId: string;
}

export default function Categories() {
  const [activeTab, setActiveTab] = useState<CategoryType>("expense");
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    parentId: "",
  }); 
  const router= useRouter();

  // RTK Query hooks
  const { data: categoriesData, isLoading, isFetching } = useGetCategoriesQuery(activeTab);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // API already returns tree structure, so just use it directly
  const categories = categoriesData || [];

  // Get parent categories for the dropdown (only top-level categories)
  const parentCategories = categories.filter((c) => !c.parentId);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory({
          id: editingCategory.id,
          name: formData.name,
          parentId: formData.parentId === "none" || !formData.parentId ? null : formData.parentId,
        }).unwrap();
      } else {
        // Create new category
        await createCategory({
          name: formData.name,
          type: activeTab,
          parentId: formData.parentId === "none" || !formData.parentId ? undefined : formData.parentId,
        }).unwrap();
      }

      setShowDialog(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error("Failed to save category:", error);
      alert("Failed to save category. Please try again.");
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Sub-categories will also be deleted.")) return;

    try {
      await deleteCategory({ id }).unwrap();
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      parentId: "",
    });
  };

  const handleOpenDialog = () => {
    resetForm();
    setEditingCategory(null);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingCategory(null);
    resetForm();
  };

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen p-6" data-testid="categories-page">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label="Back to settings"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organize your income and expenses</p>
        </div>
        <Button
          className="bg-gray-900 hover:bg-gray-800 text-white"
          onClick={handleOpenDialog}
          data-testid="create-category-btn"
        >
          <Plus size={16} className="mr-2" />
          New Category
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CategoryType)}>
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="expense" className="flex items-center gap-2 text-black">
            <TrendingDown size={14} />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2 text-black">
            <TrendingUp size={14} />
            Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : (
            <CategoryList
              categories={categories}
              type="expense"
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={32} />
            </div>
          ) : (
            <CategoryList
              categories={categories}
              type="income"
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-white text-gray-900 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label className="text-sm font-medium text-gray-900">Category Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 bg-white border-gray-300"
                placeholder="e.g., Food & Dining, Uber"
                data-testid="category-name-input"
              />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-900">Parent Category (optional)</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, parentId: val === "none" ? "" : val })
                }
              >
                <SelectTrigger className="mt-2 bg-white text-black border-gray-300" data-testid="parent-category-select">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Select a parent to create a sub-category (e.g., Transportation &gt; Uber)
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                className="bg-white"
                disabled={isCreating || isUpdating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                data-testid="save-category-btn"
                className="bg-gray-900 hover:bg-gray-800 text-white"
                disabled={isCreating || isUpdating || !formData.name.trim()}
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={14} />
                    {editingCategory ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{editingCategory ? "Update" : "Create"}</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CategoryListProps {
  categories: Category[];
  type: CategoryType;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function CategoryList({ categories, type, onEdit, onDelete, isDeleting }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder size={40} className="mx-auto mb-4 text-gray-300" />
        <p>No {type} categories yet</p>
        <p className="text-sm mt-2">Click "New Category" to create your first one</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Parent Category */}
          <div className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center ${type === "expense" ? "bg-rose-50" : "bg-emerald-50"
                  }`}
              >
                <Folder
                  size={20}
                  className={type === "expense" ? "text-rose-600" : "text-emerald-600"}
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                {category.children && category.children.length > 0 && (
                  <p className="text-xs text-gray-500">{category.children.length} sub-categories</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(category)}
                  disabled={isDeleting}
                >
                  <Edit2 size={14} className="text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(category.id)}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                </Button>
              </div>
            </div>
          </div>

          {/* Sub-categories */}
          {category.children && category.children.length > 0 && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              {category.children.map((child) => (
                <div
                  key={child.id}
                  className="px-4 py-3 flex items-center justify-between group hover:bg-gray-100 transition-colors ml-8 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{child.name}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(child)}
                      disabled={isDeleting}
                    >
                      <Edit2 size={12} className="text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete(child.id)}
                      disabled={isDeleting}
                    >
                      <Trash2 size={12} className="text-gray-500 hover:text-rose-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}