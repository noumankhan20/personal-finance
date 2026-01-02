import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Target,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

interface Transaction {
  id: number;
  description: string;
  date: string;
  category: string;
  amount: number;
}

interface DashboardData {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  bankBalance: number;
  cashInHand: number;
  loansReceivable: number;
  loansPayable: number;
  investments: number;
  creditCards: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recentTransactions: Transaction[];
}

interface StatCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  iconBgColor?: string;
}

interface TransactionItemProps {
  description: string;
  date: string;
  category: string;
  amount: number;
}

/* ------------------------------------------------------------------ */
/* Mock Data (replace with API / state later) */
/* ------------------------------------------------------------------ */

const dashboardData: DashboardData = {
  netWorth: 311500,
  totalAssets: 311500,
  totalLiabilities: 0,
  bankBalance: 171000,
  cashInHand: 0,
  loansReceivable: 140500,
  loansPayable: 0,
  investments: 0,
  creditCards: 0,
  monthlyIncome: 0,
  monthlyExpense: 0,
  recentTransactions: [
    {
      id: 1,
      description: "Test transfer between accounts",
      date: "2024-01-21",
      category: "Personal",
      amount: -3500,
    },
    {
      id: 2,
      description: "Test expense with category",
      date: "2024-01-20",
      category: "Personal",
      amount: -1000,
    },
    {
      id: 3,
      description: "Transfer to loan account",
      date: "2024-01-17",
      category: "Personal",
      amount: 10000,
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Components */
/* ------------------------------------------------------------------ */

const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  icon,
  iconBgColor = "bg-blue-100",
}) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm text-gray-500 font-medium uppercase tracking-wide">
          {title}
        </span>
        <div className={`${iconBgColor} p-2 rounded-lg`}>{icon}</div>
      </div>

      <div className="text-2xl font-bold text-gray-900">
        ₹{amount.toLocaleString("en-IN")}
      </div>
    </div>
  );
};

const TransactionItem: React.FC<TransactionItemProps> = ({
  description,
  date,
  category,
  amount,
}) => {
  const isNegative = amount < 0;

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-4 -mx-4 rounded-lg transition-colors">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900 mb-1">
          {description}
        </h4>
        <p className="text-xs text-gray-500">{date}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {category}
        </span>

        <span
          className={`text-sm font-semibold min-w-[100px] text-right ${
            isNegative ? "text-red-600" : "text-green-600"
          }`}
        >
          {isNegative ? "-" : "+"}₹
          {Math.abs(amount).toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Page */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Your financial overview</p>
          </div>
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Welcome back!</span>
          </div>
        </div>
      </div>

      {/* Net Worth */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8 mb-8 text-white shadow-xl">
        <p className="text-sm text-gray-300 uppercase tracking-wide mb-2">
          Net Worth
        </p>
        <h2 className="text-5xl font-bold mb-6">
          ₹{dashboardData.netWorth.toLocaleString("en-IN")}
        </h2>

        <div className="flex gap-8">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Assets</p>
            <p className="text-xl font-semibold">
              ₹{dashboardData.totalAssets.toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Liabilities</p>
            <p className="text-xl font-semibold">
              ₹{dashboardData.totalLiabilities.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Bank Balance" amount={dashboardData.bankBalance} icon={<Wallet className="w-5 h-5 text-blue-600" />} />
        <StatCard title="Cash in Hand" amount={dashboardData.cashInHand} icon={<Wallet className="w-5 h-5 text-green-600" />} />
        <StatCard title="Loans Receivable" amount={dashboardData.loansReceivable} icon={<ArrowUpRight className="w-5 h-5 text-orange-600" />} />
        <StatCard title="Loans Payable" amount={dashboardData.loansPayable} icon={<ArrowDownRight className="w-5 h-5 text-red-600" />} />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Investments" amount={dashboardData.investments} icon={<Target className="w-5 h-5 text-purple-600" />} />
        <StatCard title="Credit Cards" amount={dashboardData.creditCards} icon={<CreditCard className="w-5 h-5 text-pink-600" />} />
        <StatCard title="Monthly Income" amount={dashboardData.monthlyIncome} icon={<TrendingUp className="w-5 h-5 text-teal-600" />} />
        <StatCard title="Monthly Expense" amount={dashboardData.monthlyExpense} icon={<TrendingDown className="w-5 h-5 text-red-600" />} />
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Recent Transactions
        </h3>

        {dashboardData.recentTransactions.map((tx) => (
          <TransactionItem key={tx.id} {...tx} />
        ))}
      </div>
    </div>
  );
}
