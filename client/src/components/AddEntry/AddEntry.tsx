"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

// Types
interface Account {
  id: string;
  name: string;
  account_type: string;
  current_balance: number;
  person_name?: string;
}

interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  parent_id?: string | null;
  children?: Category[];
}

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

// Mock data
const mockAccounts: Account[] = [
  { id: "1", name: "HDFC Bank", account_type: "bank", current_balance: 50000 },
  { id: "2", name: "Cash Wallet", account_type: "cash", current_balance: 5000 },
  { id: "3", name: "Stocks", account_type: "investment", current_balance: 100000 },
  { id: "4", name: "Loan to Friend", account_type: "loan_receivable", current_balance: 20000, person_name: "Rahul" },
  { id: "5", name: "Personal Loan", account_type: "loan_payable", current_balance: 50000 },
];

const mockCategories: Category[] = [
  {
    id: "c1",
    name: "Food & Dining",
    type: "expense",
    children: [
      { id: "c1-1", name: "Groceries", type: "expense" },
      { id: "c1-2", name: "Restaurants", type: "expense" },
    ],
  },
  {
    id: "c2",
    name: "Transportation",
    type: "expense",
    children: [
      { id: "c2-1", name: "Fuel", type: "expense" },
      { id: "c2-2", name: "Public Transport", type: "expense" },
    ],
  },
  { id: "c3", name: "Shopping", type: "expense" },
  { id: "c4", name: "Interest Paid", type: "expense" },
  { id: "c5", name: "Salary", type: "income" },
  { id: "c6", name: "Freelance", type: "income" },
  { id: "c7", name: "Interest Received", type: "income" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);

export default function AddEntry() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income" | "transfer">("expense");

  const [entryData, setEntryData] = useState<EntryData>({
    date: format(new Date(), "yyyy-MM-dd"),
    account_id: "",
    amount: "",
    description: "",
    category_id: "",
    sub_category_id: "",
    linked_loan_id: "",
    notes: "",
  });

  const [transferData, setTransferData] = useState<TransferData>({
    date: format(new Date(), "yyyy-MM-dd"),
    from_account_id: "",
    to_account_id: "",
    amount: "",
    description: "",
    notes: "",
  });

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    // Load mock data
    setAccounts(mockAccounts);
    setCategories(mockCategories);

    const defaultAccount = mockAccounts.find(
      (a) => a.account_type === "bank" || a.account_type === "cash"
    );
    if (defaultAccount) {
      setEntryData((prev) => ({ ...prev, account_id: defaultAccount.id }));
      setTransferData((prev) => ({ ...prev, from_account_id: defaultAccount.id }));
    }
  }, []);

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryData.account_id) {
      alert("Please select an account");
      return;
    }

    console.log("Entry submitted:", {
      ...entryData,
      transaction_type: activeTab,
      category_id: entryData.sub_category_id || entryData.category_id || null,
    });

    alert(`${activeTab === "income" ? "Income" : "Expense"} recorded successfully!`);

    setEntryData({
      date: format(new Date(), "yyyy-MM-dd"),
      account_id: entryData.account_id,
      amount: "",
      description: "",
      category_id: "",
      sub_category_id: "",
      linked_loan_id: "",
      notes: "",
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.from_account_id || !transferData.to_account_id) {
      alert("Please select both accounts");
      return;
    }
    if (transferData.from_account_id === transferData.to_account_id) {
      alert("Cannot transfer to same account");
      return;
    }

    console.log("Transfer submitted:", transferData);
    alert("Transfer recorded successfully!");

    setTransferData({
      date: format(new Date(), "yyyy-MM-dd"),
      from_account_id: transferData.from_account_id,
      to_account_id: "",
      amount: "",
      description: "",
      notes: "",
    });
  };

  const createNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCat: Category = {
      id: `new-${Date.now()}`,
      name: newCategoryName,
      type: activeTab === "income" ? "income" : "expense",
      parent_id: entryData.category_id || null,
    };

    console.log("New category created:", newCat);
    alert("Category created successfully!");
    
    setNewCategoryName("");
    setShowNewCategory(false);
  };

  const getAccountBalance = (id: string) => {
    const account = accounts.find((a) => a.id === id);
    return account ? formatCurrency(account.current_balance) : "";
  };

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");
  const currentCategories = activeTab === "income" ? incomeCategories : expenseCategories;
  const selectedCategoryData = currentCategories.find((c) => c.id === entryData.category_id);

  const assetAccounts = accounts.filter((a) =>
    ["bank", "cash", "investment"].includes(a.account_type)
  );
  const loanAccounts = accounts.filter((a) =>
    ["loan_receivable", "loan_payable"].includes(a.account_type)
  );

  const isInterestCategory =
    selectedCategoryData?.name === "Interest Paid" ||
    selectedCategoryData?.name === "Interest Received";

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Entry</h1>
        <p className="text-gray-500 text-sm mt-1">Record income, expenses, or transfers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "expense"
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
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "income"
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
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === "transfer"
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
        <form onSubmit={handleEntrySubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
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
                    {a.name}
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
              <option value="none">No category</option>
              {currentCategories.map((cat) => (
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
              className={`p-3 rounded-lg border ${
                activeTab === "income"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <label
                className={`flex items-center gap-2 text-sm font-medium mb-1 ${
                  activeTab === "income" ? "text-emerald-800" : "text-amber-800"
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
                    {acc.name} {acc.person_name ? `(${acc.person_name})` : ""} -{" "}
                    {formatCurrency(acc.current_balance)}
                  </option>
                ))}
              </select>
              <p
                className={`text-xs mt-1 ${
                  activeTab === "income" ? "text-emerald-700" : "text-amber-700"
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
                onClick={createNewCategory}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {loading ? "Processing..." : `Record ${activeTab === "income" ? "Income" : "Expense"}`}
          </button>
        </form>
      )}

      {/* Transfer Form */}
      {activeTab === "transfer" && (
        <form onSubmit={handleTransferSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
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
                    {a.name}
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
                    {a.name}
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
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {loading ? "Processing..." : "Record Transfer"}
          </button>
        </form>
      )}
    </div>
  );
}