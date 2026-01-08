"use client";

import { useState, useEffect } from "react";
import { useGetAccountsQuery } from "../../redux/slices/accountsSlice";
import { useGetCategoriesQuery, useCreateCategoryMutation } from "../../redux/slices/categoriesSlice";
import { useCreateEntryMutation, useCreateTransferMutation } from "../../redux/slices/entrySlice";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// Types
interface EntryData {
  date: string;
  account_id: string;
  amount: string;
  description: string;
  category_id: string;
  sub_category_id: string;
  linked_loan_id: string;
  notes: string;
}

interface TransferData {
  date: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  description: string;
  notes: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function AddEntry() {
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">("expense");

  // RTK Query hooks
  const { data: accounts = [], isLoading: accountsLoading } = useGetAccountsQuery();
  const { data: expenseCategories = [], isLoading: expenseCategoriesLoading } = useGetCategoriesQuery("expense");
  const { data: incomeCategories = [], isLoading: incomeCategoriesLoading } = useGetCategoriesQuery("income");
  const router = useRouter();
  const [createEntry, { isLoading: creatingEntry }] = useCreateEntryMutation();
  const [createTransfer, { isLoading: creatingTransfer }] = useCreateTransferMutation();
  const [createCategory, { isLoading: creatingCategory }] = useCreateCategoryMutation();

  const [entryData, setEntryData] = useState<EntryData>({
    date: formatDate(new Date()),
    account_id: "",
    amount: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    linked_loan_id: "",
    notes: "",
  });

  const [transferData, setTransferData] = useState<TransferData>({
    date: formatDate(new Date()),
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
    notes: "",
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    const defaultAccount = accounts.find(
      (a) => a.accountType === "bank" || a.accountType === "cash"
    );
    if (defaultAccount && !entryData.account_id) {
      setEntryData((prev) => ({ ...prev, account_id: defaultAccount.id }));
      setTransferData((prev) => ({ ...prev, from_account_id: defaultAccount.id }));
    }
  }, [accounts, entryData.account_id]);

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryData.account_id) {
      alert("Please select an account");
      return;
    }

    try {
      const payload = {
        entryType: activeTab as "income" | "expense",
        date: entryData.date,
        amount: parseFloat(entryData.amount),
        description: entryData.description,
        notes: entryData.notes || undefined,
        accountId: entryData.account_id,
        categoryId: entryData.sub_category_id || entryData.category_id || null,
        linkedLoanId: entryData.linked_loan_id || null,
      };

      await createEntry(payload).unwrap();
      alert(`${activeTab === "income" ? "Income" : "Expense"} recorded successfully!`);

      setEntryData({
        date: formatDate(new Date()),
        account_id: entryData.account_id,
        amount: "",
        description: "",
        category_id: "",
        sub_category_id: "",
        linked_loan_id: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create entry:", error);
      alert("Failed to create entry. Please try again.");
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.from_account_id || !transferData.to_account_id) {
      alert("Please select both accounts");
      return;
    }
    if (transferData.from_account_id === transferData.to_account_id) {
      alert("Cannot transfer to same account");
      return;
    }

    try {
      const payload = {
        date: transferData.date,
        amount: parseFloat(transferData.amount),
        description: transferData.description,
        notes: transferData.notes || undefined,
        fromAccountId: transferData.from_account_id,
        toAccountId: transferData.to_account_id,
      };

      await createTransfer(payload).unwrap();
      alert("Transfer recorded successfully!");

      setTransferData({
        date: formatDate(new Date()),
        from_account_id: transferData.from_account_id,
        to_account_id: "",
        amount: "",
        description: "",
        notes: "",
      });
    } catch (error) {
      console.error("Failed to create transfer:", error);
      alert("Failed to create transfer. Please try again.");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      await createCategory({
        name: newCategoryName,
        type: activeTab === "income" ? "income" : "expense",
        parentId: entryData.category_id || undefined,
      }).unwrap();

      alert("Category created successfully!");
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (error) {
      console.error("Failed to create category:", error);
      alert("Failed to create category. Please try again.");
    }
  };

  const getAccountBalance = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    return account ? formatCurrency(account.currentBalance) : "";
  };

  const currentCategories = activeTab === "income" ? incomeCategories : expenseCategories;
  const selectedCategoryData = currentCategories.find((c) => c.id === entryData.category_id);

  const assetAccounts = accounts.filter((a) =>
    ["bank", "cash", "investment"].includes(a.accountType)
  );
  const loanAccounts = accounts.filter((a) =>
    a.accountType === "credit_card"
  );

  const isInterestCategory =
    selectedCategoryData?.name === "Interest Paid" ||
    selectedCategoryData?.name === "Interest Received";

  const loading = creatingEntry || creatingTransfer || creatingCategory;

  if (accountsLoading || expenseCategoriesLoading || incomeCategoriesLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6 flex items-start gap-4">
        <button
          onClick={() => router.push("/transactions")}
          className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          aria-label="Back to settings"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Entry</h1>
          <p className="text-gray-500 text-sm mt-1">
            Record income, expenses, or transfers
          </p>
        </div>
      </div>


      {/* Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${activeTab === "expense"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
            Expense
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${activeTab === "income"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Income
          </button>
          <button
            onClick={() => setActiveTab("transfer")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${activeTab === "transfer"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer
          </button>
        </div>
      </div>

      {/* Expense/Income Form */}
      {(activeTab === "expense" || activeTab === "income") && (
        <div className="bg-white rounded-lg shadow p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Record {activeTab === "income" ? "an income" : "an expense"} entry
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={entryData.date}
                onChange={(e) => setEntryData({ ...entryData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={entryData.account_id}
                onChange={(e) => setEntryData({ ...entryData, account_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select account</option>
                {assetAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountname}
                  </option>
                ))}
              </select>
              {entryData.account_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {getAccountBalance(entryData.account_id)}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={entryData.amount}
              onChange={(e) => setEntryData({ ...entryData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={entryData.description}
              onChange={(e) => setEntryData({ ...entryData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`e.g., ${activeTab === "income" ? "Salary, Freelance payment" : "Groceries, Uber ride"}`}
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Category
            </label>
            <select
              value={entryData.category_id}
              onChange={(e) =>
                setEntryData({
                  ...entryData,
                  category_id: e.target.value,
                  sub_category_id: "",
                  linked_loan_id: "",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select category</option>
              <option value="">No category</option>
              {currentCategories.filter(c => !c.parentId).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategoryData?.children && selectedCategoryData.children.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-category (optional)
              </label>
              <select
                value={entryData.sub_category_id}
                onChange={(e) => setEntryData({ ...entryData, sub_category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Use parent category</option>
                <option value="none">Use parent category</option>
                {selectedCategoryData.children.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isInterestCategory && loanAccounts.length > 0 && (
            <div
              className={`p-3 rounded-lg border ${activeTab === "income"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
                }`}
            >
              <label
                className={`flex items-center gap-2 text-sm font-medium mb-1 ${activeTab === "income" ? "text-emerald-800" : "text-amber-800"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Link Interest to Loan
              </label>
              <select
                value={entryData.linked_loan_id}
                onChange={(e) => setEntryData({ ...entryData, linked_loan_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select loan account</option>
                <option value="none">No specific loan</option>
                {loanAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountname} - {formatCurrency(acc.currentBalance)}
                  </option>
                ))}
              </select>
              <p
                className={`text-xs mt-1 ${activeTab === "income" ? "text-emerald-700" : "text-amber-700"
                  }`}
              >
                Track which loan this interest payment {activeTab === "income" ? "is from" : "belongs to"}
              </p>
            </div>
          )}

          {!showNewCategory ? (
            <button
              type="button"
              onClick={() => setShowNewCategory(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {entryData.category_id ? "Add sub-category" : "Add new category"}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={entryData.category_id ? "Sub-category name" : "Category name"}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={creatingCategory}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName("");
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={entryData.notes}
              onChange={(e) => setEntryData({ ...entryData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes"
            />
          </div>

          <button
            type="button"
            onClick={handleEntrySubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {loading ? "Processing..." : `Record ${activeTab === "income" ? "Income" : "Expense"}`}
          </button>
        </div>
      )}

      {/* Transfer Form */}
      {activeTab === "transfer" && (
        <div className="bg-white rounded-lg shadow p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Transfer money between accounts (bank to loan, bank to bank, etc.)
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={transferData.date}
              onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
              <select
                value={transferData.from_account_id}
                onChange={(e) =>
                  setTransferData({ ...transferData, from_account_id: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select source</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountname}
                  </option>
                ))}
              </select>
              {transferData.from_account_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {getAccountBalance(transferData.from_account_id)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
              <select
                value={transferData.to_account_id}
                onChange={(e) => setTransferData({ ...transferData, to_account_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select destination</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountname}
                  </option>
                ))}
              </select>
              {transferData.to_account_id && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {getAccountBalance(transferData.to_account_id)}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={transferData.amount}
              onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={transferData.description}
              onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Loan payment to Akash"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={transferData.notes}
              onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any additional notes"
            />
          </div>

          <button
            type="button"
            onClick={handleTransferSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {loading ? "Processing..." : "Record Transfer"}
          </button>
        </div>
      )}
    </div>
  );
}