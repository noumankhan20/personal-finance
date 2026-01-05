"use client";
import { useState } from "react";
import {
  Calendar,
  Folder,
  Trash2,
  Download,
  X,
  Edit2,
  Search,
  ArrowRightLeft,
} from "lucide-react";
import {
  useGetEntriesQuery,
  useUpdateEntryMutation,
  useDeleteEntryMutation,
  Entry as BaseEntry,
} from "../../redux/slices/entrySlice";
import { Entry } from "../../redux/slices/entrySlice";
// Extended Entry type with included relations from backend

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "sm" | "icon";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

// UI Components
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  onClick,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
  };
  const sizes = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = ({ className = "", ...props }: any) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

const Label = ({ children, className = "" }: any) => (
  <label className={`text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
);

const Checkbox = ({ checked, onCheckedChange, ...props }: any) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(e) => onCheckedChange?.(e.target.checked)}
    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    {...props}
  />
);

const Dialog = ({ open, onOpenChange, children }: any) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
};

const DialogContent = ({ children, className = "" }: any) => (
  <div
    className={`bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 ${className}`}
  >
    {children}
  </div>
);

const DialogHeader = ({ children }: any) => (
  <div className="px-6 pt-6 pb-4">{children}</div>
);
const DialogTitle = ({ children }: any) => (
  <h2 className="text-xl font-semibold text-gray-900">{children}</h2>
);
const DialogFooter = ({ children }: any) => (
  <div className="flex justify-end gap-3 px-6 pb-6 pt-4">{children}</div>
);

// Main Component
export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterAccount, setFilterAccount] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterUntagged, setFilterUntagged] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Entry | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    description: "",
    amount: 0,
    category_id: "",
    notes: "",
  });

  // API Hooks
  const { data: entries = [], isLoading, isError } = useGetEntriesQuery();
  const [updateEntry] = useUpdateEntryMutation();
  const [deleteEntry] = useDeleteEntryMutation();

  // Extract unique accounts and categories from entries
  const accounts = Array.from(
    new Map(
      entries.filter((e) => e.account).map((e) => [e.account!.id, e.account!])
    ).values()
  );

  const categories = Array.from(
    new Map(
      entries
        .filter((e) => e.category)
        .map((e) => [e.category!.id, e.category!])
    ).values()
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);

  const getAccountName = (id: string) => {
    const account = entries.find((e) => e.accountId === id)?.account;
    return account?.accountname || "-";
  };

  const getCategoryName = (id?: string) => {
    if (!id) return null;
    const cat = categories.find((c) => c.id === id);
    if (!cat) return null;
    if (cat.parentId) {
      const parent = categories.find((c) => c.id === cat.parentId);
      return parent ? `${parent.name} > ${cat.name}` : cat.name;
    }
    return cat.name;
  };

  const filteredTransactions = entries.filter((txn) => {
    if (
      searchTerm &&
      !txn.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filterAccount !== "all" && txn.accountId !== filterAccount)
      return false;
    if (filterCategory !== "all" && txn.categoryId !== filterCategory)
      return false;
    if (filterType !== "all" && txn.entryType !== filterType) return false;
    if (filterUntagged && txn.categoryId) return false;
    if (startDate && txn.date < startDate) return false;
    if (endDate && txn.date > endDate) return false;
    return true;
  });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const toggleSelectAll = () =>
    selectedIds.length === filteredTransactions.length
      ? setSelectedIds([])
      : setSelectedIds(filteredTransactions.map((t) => t.id));

  const handleEdit = (txn: Entry) => {
    setEditingTxn(txn);
    setEditForm({
      date: txn.date.split("T")[0], // Extract date part only
      description: txn.description,
      amount: Number(txn.amount),
      category_id: txn.categoryId || "",
      notes: txn.notes || "",
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTxn) return;

    try {
      await updateEntry({
        id: editingTxn.id,
        date: editForm.date,
        description: editForm.description,
        amount: Number(editForm.amount),
        categoryId: editForm.category_id || null,
        notes: editForm.notes || undefined,
      }).unwrap();

      setShowEditDialog(false);
      setEditingTxn(null);
    } catch (error) {
      console.error("Failed to update entry:", error);
      alert("Failed to update transaction. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;

    try {
      await deleteEntry(id).unwrap();
    } catch (error) {
      console.error("Failed to delete entry:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleBulkTag = async (categoryId: string) => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map((id) =>
          updateEntry({
            id,
            categoryId: categoryId === "none" ? null : categoryId,
          }).unwrap()
        )
      );
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to bulk tag:", error);
      alert("Failed to update categories. Please try again.");
    }
  };

  const handleExport = () => {
    console.log("Exporting transactions");
    // TODO: Implement export functionality
  };

  const clearFilters = () => {
    setFilterAccount("all");
    setFilterCategory("all");
    setFilterType("all");
    setFilterUntagged(false);
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
  };

  const hasActiveFilters =
    filterAccount !== "all" ||
    filterCategory !== "all" ||
    filterType !== "all" ||
    filterUntagged ||
    startDate ||
    endDate ||
    searchTerm;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-red-600">
          Failed to load transactions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 text-sm mt-1">
              View and manage all transactions
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] max-w-[300px] relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                className="pl-10"
              />
            </div>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountname}
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm w-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories
                .filter((c) => !c.parentId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm w-[130px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById(
                    "start-date"
                  ) as HTMLInputElement | null;
                  input?.showPicker();
                }}
              >
                <Calendar size={14} className="mr-2" />
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-0 bg-transparent outline-none w-20 text-sm"
                  placeholder="From"
                />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.getElementById(
                    "end-date"
                  ) as HTMLInputElement | null;
                  input?.showPicker();
                }}
              >
                <Calendar size={14} className="mr-2" />
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-0 bg-transparent outline-none w-20 text-sm"
                  placeholder="To"
                />
              </Button>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <Checkbox
                checked={filterUntagged}
                onCheckedChange={setFilterUntagged}
              />
              Uncategorized
            </label>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={
                  selectedIds.length > 0 &&
                  selectedIds.length === filteredTransactions.length
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-gray-600">
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : `${filteredTransactions.length} transactions`}
              </span>
            </div>

            {selectedIds.length > 0 && (
              <select
                onChange={(e) => handleBulkTag(e.target.value)}
                className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm w-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Bulk Categorize
                </option>
                <option value="none">Remove Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? `  └ ${cat.name}` : cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-10 p-3"></th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Date
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Description
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Account
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-gray-700">
                      Category
                    </th>
                    <th className="w-20 p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        selectedIds.includes(txn.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedIds.includes(txn.id)}
                          onCheckedChange={() => toggleSelect(txn.id)}
                        />
                      </td>
                      <td className="font-mono text-sm text-gray-700 p-3">
                        {txn.date.split("T")[0]}
                      </td>
                      <td
                        className="text-sm text-gray-900 max-w-[300px] truncate p-3"
                        title={txn.description}
                      >
                        {txn.description}
                      </td>
                      <td
                        className={`font-mono text-sm text-right font-medium p-3 ${
                          txn.entryType === "income"
                            ? "text-emerald-600"
                            : txn.entryType === "transfer"
                            ? "text-blue-600"
                            : "text-rose-600"
                        }`}
                      >
                        {txn.entryType === "income"
                          ? "+"
                          : txn.entryType === "transfer"
                          ? "↔"
                          : "-"}
                        {formatCurrency(Number(txn.amount))}
                      </td>
                      <td className="text-sm text-gray-600 p-3">
                        {txn.account?.accountname || "-"}
                      </td>
                      <td className="p-3">
                        {txn.categoryId ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                            <Folder size={12} />
                            {getCategoryName(txn.categoryId)}
                          </span>
                        ) : txn.counterAccountId ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                            <ArrowRightLeft size={12} />
                            {getAccountName(txn.counterAccountId)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(txn)}
                          >
                            <Edit2 size={14} className="text-gray-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDelete(txn.id)}
                          >
                            <Trash2
                              size={14}
                              className="text-gray-500 hover:text-rose-600"
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm({ ...editForm, date: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditForm({
                        ...editForm,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 font-mono"
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Category</Label>
                <select
                  value={editForm.category_id || "none"}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      category_id:
                        e.target.value === "none" ? "" : e.target.value,
                    })
                  }
                  className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentId ? `  └ ${cat.name}` : cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={editForm.notes}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  className="mt-1"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
