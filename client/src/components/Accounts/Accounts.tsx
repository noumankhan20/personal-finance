"use client";

import { useState } from "react";
import {
  useGetAccountsQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
} from "@/redux/slices/accountsSlice";

// Types
interface Account {
  id: string;
  accountname: string;
  accountType: string;
  description: string | null;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
  person_name?: string;
}

interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  transaction_type: "income" | "expense" | "transfer";
}

interface FormData {
  accountname: string;
  accountType: string;
  description: string;
  openingBalance: number | string;
  person_name: string;
}

interface AccountType {
  value: string;
  label: string;
  color: string;
  bg: string;
}

const ACCOUNT_TYPES: AccountType[] = [
  { value: "bank", label: "Bank Account", color: "text-blue-600", bg: "bg-blue-50" },
  { value: "cash", label: "Cash", color: "text-emerald-600", bg: "bg-emerald-50" },
  { value: "credit_card", label: "Credit Card", color: "text-rose-600", bg: "bg-rose-50" },
  { value: "investment", label: "Investment", color: "text-purple-600", bg: "bg-purple-50" },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const getAccountIcon = (type: string) => {
  const icons: { [key: string]: string } = {
    bank: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
    cash: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    credit_card: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    investment: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    loan_receivable: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    loan_payable: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
  };
  return icons[type] || icons.bank;
};

export default function Accounts() {
  const { data: accountsData, isLoading, error } = useGetAccountsQuery();
  const [createAccount] = useCreateAccountMutation();
  const [updateAccount] = useUpdateAccountMutation();
  const [deleteAccount] = useDeleteAccountMutation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showAccountSheet, setShowAccountSheet] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    accountname: "",
    accountType: "bank",
    description: "",
    openingBalance: 0,
    person_name: "",
  });

  const accounts = accountsData || [];

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    setShowAccountSheet(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingAccount) {
        await updateAccount({
          id: editingAccount.id,
          accountname: formData.accountname,
          accountType: formData.accountType as any,
          description: formData.description || undefined,
        }).unwrap();
        alert("Account updated successfully!");
      } else {
        await createAccount({
          accountname: formData.accountname,
          accountType: formData.accountType as any,
          openingBalance: Number(formData.openingBalance),
          description: formData.description || undefined,
        }).unwrap();
        alert("Account created successfully!");
      }

      setShowDialog(false);
      setEditingAccount(null);
      resetForm();
    } catch (err) {
      alert("Failed to save account. Please try again.");
      console.error("Error saving account:", err);
    }
  };

  const handleEdit = (e: React.MouseEvent, account: Account) => {
    e.stopPropagation();
    setEditingAccount(account);
    setFormData({
      accountname: account.accountname,
      accountType: account.accountType,
      description: account.description || "",
      openingBalance: account.openingBalance,
      person_name: account.person_name || "",
    });
    setShowDialog(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this account? This cannot be undone.")) {
      try {
        await deleteAccount(id).unwrap();
        alert("Account deleted successfully!");
      } catch (err) {
        alert("Failed to delete account. Please try again.");
        console.error("Error deleting account:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      accountname: "",
      accountType: "bank",
      description: "",
      openingBalance: 0,
      person_name: "",
    });
  };

  const getAccountConfig = (type: string) =>
    ACCOUNT_TYPES.find((t) => t.value === type) || ACCOUNT_TYPES[0];

  const filteredAccounts =
    filterType === "all" ? accounts : accounts.filter((a) => a.accountType === filterType);

  const groupedAccounts = filteredAccounts.reduce((acc, account) => {
    const type = account.accountType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as { [key: string]: Account[] });

  const totals = {
    assets: accounts
      .filter((a) => ["bank", "cash", "investment", "loan_receivable"].includes(a.accountType))
      .reduce((sum, a) => sum + a.currentBalance, 0),
    liabilities: accounts
      .filter((a) => ["credit_card", "loan_payable"].includes(a.accountType))
      .reduce((sum, a) => sum + Math.abs(a.currentBalance), 0),
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your bank accounts, cash, and other assets</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingAccount(null);
            setShowDialog(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Account
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Assets</p>
          <p className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(totals.assets)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Liabilities</p>
          <p className="text-2xl font-mono font-bold text-rose-600">{formatCurrency(totals.liabilities)}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === "all"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
        >
          All
        </button>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === type.value
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">Error loading accounts. Please try again.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAccounts).map(([type, typeAccounts]) => {
            const typeConfig = getAccountConfig(type);
            return (
              <div key={type} className="space-y-3">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${typeConfig.color}`}>
                  {typeConfig.label} ({typeAccounts.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow group"
                      onClick={() => handleAccountClick(account)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-md flex items-center justify-center ${typeConfig.bg}`}>
                            <svg
                              className={`w-5 h-5 ${typeConfig.color}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d={getAccountIcon(account.accountType)}
                              />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                              {account.accountname}
                            </h3>
                            {account.person_name && (
                              <p className="text-xs text-gray-500">{account.person_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleEdit(e, account)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, account.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <svg className="w-4 h-4 text-gray-500 hover:text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Current Balance</p>
                        <p
                          className={`font-mono text-lg font-medium ${account.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                        >
                          {formatCurrency(account.currentBalance)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(groupedAccounts).length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No accounts found</p>
              <button
                onClick={() => setShowDialog(true)}
                className="text-blue-600 mt-2 hover:underline"
              >
                Create your first account
              </button>
            </div>
          )}
        </div>
      )}

      {showDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
               bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowDialog(false)}   // 👈 click outside closes modal
        >
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()} // 👈 prevent closing on modal click
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingAccount ? "Edit Account" : "New Account"}</h2>
              <button
                onClick={() => setShowDialog(false)}
                className=" text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={formData.accountname}
                  onChange={(e) => setFormData({ ...formData, accountname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HDFC Savings"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance (₹)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formData.openingBalance}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || val === "-") {
                      setFormData({ ...formData, openingBalance: val });
                    } else {
                      const num = parseFloat(val);
                      if (!isNaN(num)) {
                        setFormData({ ...formData, openingBalance: num });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current balance"
                />
                <p className="text-xs text-gray-500 mt-1">Enter negative value for credit card dues</p>
              </div>

              {(formData.accountType === "loan_receivable" || formData.accountType === "loan_payable") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person Name</label>
                  <input
                    type="text"
                    value={formData.person_name}
                    onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Akash, Rahul"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notes about this account"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  {editingAccount ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAccountSheet && selectedAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
          <div className="bg-white w-full sm:max-w-xl h-full sm:h-auto sm:rounded-l-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold">{selectedAccount.accountname}</h2>
                <p
                  className={`font-mono text-lg mt-1 ${selectedAccount.currentBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                >
                  {formatCurrency(selectedAccount.currentBalance)}
                </p>
              </div>
              <button
                onClick={() => setShowAccountSheet(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Transactions</h3>
                <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  View All
                </button>
              </div>
              {transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{txn.description}</p>
                        <p className="text-xs text-gray-500 font-mono">{txn.date}</p>
                      </div>
                      <p
                        className={`font-mono text-sm font-medium ${txn.transaction_type === "income" ? "text-emerald-600" : "text-rose-600"
                          }`}
                      >
                        {txn.transaction_type === "income" ? "+" : "-"}
                        {formatCurrency(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No transactions in this account</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}