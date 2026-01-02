"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Folder, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";

// Types
interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  type: "expense" | "income";
  children?: Category[];
}

interface FormData {
  name: string;
  parent_id: string;
  type: "expense" | "income";
}

interface CategoryStats {
  expense: Record<string, number>;
  income: Record<string, number>;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

// Mock data for demonstration
const mockExpenseCategories: Category[] = [
  {
    id: "1",
    name: "Food & Dining",
    parent_id: null,
    type: "expense",
    children: [
      { id: "2", name: "Restaurants", parent_id: "1", type: "expense" },
      { id: "3", name: "Groceries", parent_id: "1", type: "expense" },
    ],
  },
  {
    id: "4",
    name: "Transportation",
    parent_id: null,
    type: "expense",
    children: [
      { id: "5", name: "Uber", parent_id: "4", type: "expense" },
      { id: "6", name: "Fuel", parent_id: "4", type: "expense" },
    ],
  },
];

const mockIncomeCategories: Category[] = [
  {
    id: "7",
    name: "Salary",
    parent_id: null,
    type: "income",
  },
  {
    id: "8",
    name: "Freelance",
    parent_id: null,
    type: "income",
  },
];

const mockCategoryStats: CategoryStats = {
  expense: {
    "Food & Dining": 15000,
    "Food & Dining > Restaurants": 8000,
    "Food & Dining > Groceries": 7000,
    Transportation: 5000,
    "Transportation > Uber": 3000,
    "Transportation > Fuel": 2000,
  },
  income: {
    Salary: 80000,
    Freelance: 25000,
  },
};

export default function Categories() {
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    expense: {},
    income: {},
  });

  const [formData, setFormData] = useState<FormData>({
    name: "",
    parent_id: "",
    type: "expense",
  });

  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      setExpenseCategories(mockExpenseCategories);
      setIncomeCategories(mockIncomeCategories);
      setCategoryStats(mockCategoryStats);
      setLoading(false);
    }, 500);
  }, []);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: formData.name,
      parent_id: formData.parent_id === "none" || !formData.parent_id ? null : formData.parent_id,
      type: activeTab,
    };

    if (editingCategory) {
      // Update existing category
      const updateCategories = (cats: Category[]): Category[] => {
        return cats.map((cat) => {
          if (cat.id === editingCategory.id) {
            return { ...cat, ...newCategory, id: editingCategory.id };
          }
          if (cat.children) {
            return { ...cat, children: updateCategories(cat.children) };
          }
          return cat;
        });
      };

      if (activeTab === "expense") {
        setExpenseCategories(updateCategories(expenseCategories));
      } else {
        setIncomeCategories(updateCategories(incomeCategories));
      }
    } else {
      // Add new category
      if (activeTab === "expense") {
        setExpenseCategories([...expenseCategories, newCategory]);
      } else {
        setIncomeCategories([...incomeCategories, newCategory]);
      }
    }

    setShowDialog(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      parent_id: category.parent_id || "",
      type: category.type,
    });
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this category? Sub-categories will also be deleted.")) return;

    const deleteFromCategories = (cats: Category[]): Category[] => {
      return cats
        .filter((cat) => cat.id !== id)
        .map((cat) => ({
          ...cat,
          children: cat.children ? deleteFromCategories(cat.children) : undefined,
        }));
    };

    if (activeTab === "expense") {
      setExpenseCategories(deleteFromCategories(expenseCategories));
    } else {
      setIncomeCategories(deleteFromCategories(incomeCategories));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      parent_id: "",
      type: "expense",
    });
  };

  const getCategoryTotal = (category: Category, type: "expense" | "income"): number => {
    const stats = categoryStats[type] || {};
    let total = stats[category.name] || 0;
    
    if (category.children) {
      category.children.forEach((child) => {
        total += stats[`${category.name} > ${child.name}`] || 0;
      });
    }
    return total;
  };

  const categories = activeTab === "expense" ? expenseCategories : incomeCategories;
  const parentCategories = categories.filter((c) => !c.parent_id);

  return (
    <div className="space-y-6 animate-fadeIn bg-gray-50 min-h-screen p-6" data-testid="categories-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organize your income and expenses</p>
        </div>
        <Button
        className="text-black bg-gray-300"
          onClick={() => {
            resetForm();
            setEditingCategory(null);
            setShowDialog(true);
          }}
          data-testid="create-category-btn"
        >
          <Plus size={16} className="mr-2" />
          New Category
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "expense" | "income")}>
        <TabsList className="grid grid-cols-2 w-64">
          <TabsTrigger value="expense" className="flex items-center gap-2">
            <TrendingDown size={14} />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="income" className="flex items-center gap-2">
            <TrendingUp size={14} />
            Income
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="mt-6">
          <CategoryList
            categories={expenseCategories}
            type="expense"
            onEdit={handleEdit}
            onDelete={handleDelete}
            getCategoryTotal={(cat) => getCategoryTotal(cat, "expense")}
          />
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <CategoryList
            categories={incomeCategories}
            type="income"
            onEdit={handleEdit}
            onDelete={handleDelete}
            getCategoryTotal={(cat) => getCategoryTotal(cat, "income")}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
       {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white text-gray-900 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
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
                value={formData.parent_id || "none"}
                onValueChange={(val) =>
                  setFormData({ ...formData, parent_id: val === "none" ? "" : val })
                }
              >
                <SelectTrigger className="mt-2 bg-white border-gray-300" data-testid="parent-category-select">
                  <SelectValue placeholder="No parent (top-level)" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="none">No parent (top-level)</SelectItem>
                  {parentCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Select a parent to create a sub-category (e.g., Personal &gt; Uber)
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="bg-white">
                Cancel
              </Button>
              <Button onClick={handleSubmit} data-testid="save-category-btn" className="bg-gray-900 hover:bg-gray-800 text-white">
                {editingCategory ? "Update" : "Create"}
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
  type: "expense" | "income";
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  getCategoryTotal: (category: Category) => number;
}

function CategoryList({ categories, type, onEdit, onDelete, getCategoryTotal }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder size={40} className="mx-auto mb-4 text-gray-300" />
        <p>No {type} categories yet</p>
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="card-surface overflow-hidden">
          {/* Parent Category */}
          <div className="p-4 flex items-center justify-between group hover:bg-gray-50">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-md flex items-center justify-center ${
                  type === "expense" ? "bg-rose-50" : "bg-emerald-50"
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
            <div className="flex items-center gap-4">
              <span
                className={`font-mono text-sm ${
                  type === "expense" ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formatCurrency(getCategoryTotal(category))}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(category)}
                >
                  <Edit2 size={14} className="text-gray-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onDelete(category.id)}
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
                  className="px-4 py-3 flex items-center justify-between group hover:bg-gray-100 ml-8 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{child.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(child)}
                      >
                        <Edit2 size={12} className="text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onDelete(child.id)}
                      >
                        <Trash2 size={12} className="text-gray-500 hover:text-rose-600" />
                      </Button>
                    </div>
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