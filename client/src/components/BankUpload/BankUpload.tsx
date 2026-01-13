"use client"

import { useRef, useState, useEffect } from "react"
import {
  FileSpreadsheet,
  Save,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Upload,
} from "lucide-react"
import { useGetAccountsQuery } from "../../redux/slices/accountsSlice"
import { useGetCategoriesQuery, type CategoryType } from "../../redux/slices/categoriesSlice"
import { useCreateEntryMutation } from "../../redux/slices/entrySlice"

/* ============================================================
   TYPES
============================================================ */

interface ImportTransaction {
  tempId: string
  entryType: "income" | "expense"
  date: string
  amount: number
  description: string
  notes?: string | null
  accountId: string | null
  categoryId: string | null
}

/* ============================================================
   COMPONENT
============================================================ */

export default function BankUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Redux queries
  const { data: accounts = [], isLoading: loadingAccounts } = useGetAccountsQuery()
  const { data: incomeCategories = [], isLoading: loadingIncomeCategories } = useGetCategoriesQuery("income")
  const { data: expenseCategories = [], isLoading: loadingExpenseCategories } = useGetCategoriesQuery("expense")
  const [createEntry] = useCreateEntryMutation()

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 })

  const [transactions, setTransactions] = useState<ImportTransaction[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [defaultAccount, setDefaultAccount] = useState<string>("")

  // Set default account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !defaultAccount) {
      setDefaultAccount(accounts[0].id)
    }
  }, [accounts, defaultAccount])

  /* ============================================================
     FILE UPLOAD → PARSE
  ============================================================ */

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    await handleUpload(selectedFile)
  }

  const handleUpload = async (uploadFile: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", uploadFile)

      const res = await fetch(
        "http://localhost:5000/api/bank-uploads/import/parse",
        {
          method: "POST",
          body: formData,
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Parse failed")
      }

      const data = await res.json()

      const parsed: ImportTransaction[] = data.entries.map(
        (e: ImportTransaction) => ({
          ...e,
          accountId: defaultAccount || null,
        })
      )

      setTransactions(parsed)
      setSelectedIds(parsed.map(t => t.tempId))
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to parse bank statement")
    } finally {
      setUploading(false)
    }
  }

  /* ============================================================
     SELECTION & EDIT
  ============================================================ */

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === transactions.length
        ? []
        : transactions.map((t) => t.tempId)
    )
  }

  const updateTransaction = (
    id: string,
    updates: Partial<ImportTransaction>
  ) => {
    setTransactions((prev) =>
      prev.map((t) => (t.tempId === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.tempId !== id))
    setSelectedIds((prev) => prev.filter((i) => i !== id))
    if (editingId === id) setEditingId(null)
  }

  const startEditing = (id: string) => {
    setEditingId(id)
  }

  const saveEditing = () => {
    setEditingId(null)
  }

  /* ============================================================
     SAVE ALL → BULK ENTRY CREATION
  ============================================================ */

  const handleSave = async () => {
    if (transactions.length === 0) {
      alert("No transactions to save")
      return
    }

    const validEntries = transactions.filter(
      (t) => t.accountId && t.amount > 0 && t.description && t.date
    )

    if (validEntries.length === 0) {
      alert("No valid entries to save. Please ensure all entries have an account, amount, description, and date.")
      return
    }

    setSaving(true)
    setSaveProgress({ current: 0, total: validEntries.length })

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < validEntries.length; i++) {
      const txn = validEntries[i]
      
      try {
        await createEntry({
          entryType: txn.entryType,
          date: txn.date,
          amount: txn.amount,
          description: txn.description,
          notes: txn.notes || undefined,
          accountId: txn.accountId!,
          categoryId: txn.categoryId || undefined,
        }).unwrap()
        
        successCount++
      } catch (err) {
        console.error(`Failed to save entry ${txn.tempId}:`, err)
        failCount++
      }

      setSaveProgress({ current: i + 1, total: validEntries.length })
    }

    setSaving(false)
    
    if (failCount === 0) {
      alert(`Successfully imported ${successCount} transactions!`)
      setTransactions([])
      setSelectedIds([])
      setFile(null)
    } else {
      alert(`Imported ${successCount} transactions. ${failCount} failed.`)
      const failedIds = new Set(
        validEntries.slice(successCount).map(t => t.tempId)
      )
      setTransactions(prev => prev.filter(t => failedIds.has(t.tempId)))
    }
  }

  const handleReset = () => {
    if (confirm("Are you sure you want to clear all transactions?")) {
      setTransactions([])
      setSelectedIds([])
      setFile(null)
      setEditingId(null)
    }
  }

  /* ============================================================
     RENDERING
  ============================================================ */

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-[1600px] mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bank Statement Import</h1>
              <p className="text-gray-600 mt-2">Upload and process your bank statements</p>
            </div>
            <FileSpreadsheet className="text-blue-600" size={48} />
          </div>
        </div>

        {/* Account Selection */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Default Account for Transactions
          </label>
          <select
            value={defaultAccount}
            onChange={(e) => {
              setDefaultAccount(e.target.value)
              setTransactions(prev =>
                prev.map(t => ({
                  ...t,
                  accountId: t.accountId || e.target.value
                }))
              )
            }}
            disabled={loadingAccounts}
            className="w-full md:w-96 border-2 border-gray-300 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            {loadingAccounts ? (
              <option>Loading accounts...</option>
            ) : accounts.length === 0 ? (
              <option>No accounts available</option>
            ) : (
              accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountname} ({acc.accountType})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Upload Area */}
        {transactions.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-10 border border-gray-200">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-16 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-6 text-lg font-medium text-gray-700">
                    Processing your statement...
                  </p>
                </>
              ) : (
                <>
                  <Upload size={64} className="mx-auto text-gray-400 mb-6" />
                  <p className="text-xl font-semibold text-gray-700 mb-2">
                    Click to upload bank statement
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports XLS and XLSX formats
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between p-6 bg-gray-50 border-b-2 border-gray-200">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-base font-medium text-gray-700">
                    {selectedIds.length} of {transactions.length} selected
                  </span>
                </label>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X size={18} />
                  Clear All
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || selectedIds.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Save size={18} />
                  {saving ? `Saving ${saveProgress.current}/${saveProgress.total}...` : `Save ${selectedIds.length} Entries`}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="w-16 px-6 py-4"></th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[300px]">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">Account</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[200px]">Category</th>
                    <th className="w-32 px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((txn) => {
                    const isEditing = editingId === txn.tempId
                    const isSelected = selectedIds.includes(txn.tempId)
                    
                    return (
                      <tr
                        key={txn.tempId}
                        className={`hover:bg-gray-50 transition-colors ${
                          isSelected ? "bg-blue-50" : ""
                        } ${isEditing ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-6 py-5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(txn.tempId)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        
                        <td className="px-6 py-5">
                          {isEditing ? (
                            <input
                              type="date"
                              value={txn.date.split("T")[0]}
                              onChange={(e) =>
                                updateTransaction(txn.tempId, {
                                  date: e.target.value,
                                })
                              }
                              className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(txn.date)}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-6 py-5">
                          {isEditing ? (
                            <div className="space-y-3">
                              <input
                                type="text"
                                value={txn.description}
                                onChange={(e) =>
                                  updateTransaction(txn.tempId, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Description"
                                className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <textarea
                                value={txn.notes || ""}
                                onChange={(e) =>
                                  updateTransaction(txn.tempId, {
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Notes (optional)"
                                rows={2}
                                className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {txn.description}
                              </div>
                              {txn.notes && (
                                <div className="text-xs text-gray-500 mt-1 italic">
                                  {txn.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-5">
                          <select
                            value={txn.accountId || ""}
                            onChange={(e) =>
                              updateTransaction(txn.tempId, {
                                accountId: e.target.value || null,
                              })
                            }
                            className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all ${
                              !txn.accountId ? "border-red-300 bg-red-50 text-red-700" : isEditing ? "border-blue-300" : "border-gray-300"
                            }`}
                          >
                            <option value="">Select Account</option>
                            {accounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.accountname}
                              </option>
                            ))}
                          </select>
                        </td>
                        
                        <td className="px-6 py-5 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={txn.amount}
                              onChange={(e) =>
                                updateTransaction(txn.tempId, {
                                  amount: parseFloat(e.target.value) || 0,
                                })
                              }
                              step="0.01"
                              className="w-full border-2 border-blue-300 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          ) : (
                            <span
                              className={`text-base font-bold ${
                                txn.entryType === "income"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.entryType === "income" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-6 py-5 text-center">
                          {isEditing ? (
                            <select
                              value={txn.entryType}
                              onChange={(e) =>
                                updateTransaction(txn.tempId, {
                                  entryType: e.target.value as "income" | "expense",
                                })
                              }
                              className="border-2 border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="income">Income</option>
                              <option value="expense">Expense</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                txn.entryType === "income"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {txn.entryType}
                            </span>
                          )}
                        </td>
                        
                        <td className="px-6 py-5">
                          <select
                            value={txn.categoryId || ""}
                            onChange={(e) =>
                              updateTransaction(txn.tempId, {
                                categoryId: e.target.value || null,
                              })
                            }
                            disabled={loadingIncomeCategories || loadingExpenseCategories}
                            className={`w-full border-2 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition-all ${
                              isEditing ? "border-blue-300" : "border-gray-300"
                            }`}
                          >
                            <option value="">No Category</option>
                            {(txn.entryType === "income" ? incomeCategories : expenseCategories).map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2">
                            {isEditing ? (
                              <button
                                onClick={saveEditing}
                                className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-lg transition-colors"
                                title="Save changes"
                              >
                                <Check size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => startEditing(txn.tempId)}
                                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Edit transaction"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => deleteTransaction(txn.tempId)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors"
                              title="Delete transaction"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-6 bg-gray-50 border-t-2 border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-gray-600 font-medium">Total Transactions:</span>
                    <span className="ml-2 font-bold text-gray-900 text-base">
                      {transactions.length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Income:</span>
                    <span className="ml-2 font-bold text-green-600 text-base">
                      {formatCurrency(
                        transactions
                          .filter(t => t.entryType === "income")
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 font-medium">Expenses:</span>
                    <span className="ml-2 font-bold text-red-600 text-base">
                      {formatCurrency(
                        transactions
                          .filter(t => t.entryType === "expense")
                          .reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </span>
                  </div>
                </div>
                
                {transactions.some(t => !t.accountId) && (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                    <AlertCircle size={18} />
                    <span className="text-sm font-semibold">
                      Some transactions are missing accounts
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}