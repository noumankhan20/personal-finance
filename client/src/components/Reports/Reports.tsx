"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Download, TrendingUp, TrendingDown, PieChart, BarChart3 } from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { PieLabelRenderProps } from "recharts";
import Loans from "@/components/Loans/Loans";
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

interface AccountItem {
    id: number;
    name: string;
    current_balance: number;
}

interface BalanceSheet {
    total_assets: number;
    total_liabilities: number;
    net_worth: number;
    assets: {
        bank?: AccountItem[];
        cash?: AccountItem[];
        investment?: AccountItem[];
    };
    liabilities: {
        loans_payable?: AccountItem[];
        credit_card?: AccountItem[];
    };
}

interface IncomeExpense {
    total_income: number;
    total_expense: number;
    net_income: number;
    income_by_category: Record<string, number>;
    expense_by_category: Record<string, number>;
}

interface ChartData {
    name: string;
    value: number;
    [key: string]: any;
}

interface ComparisonData {
    name: string;
    amount: number;
}

export default function Reports() {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    // Mock balance sheet data
    const balanceSheet: BalanceSheet = {
        total_assets: 340950.8,
        total_liabilities: 10000,
        net_worth: 330950.8,
        assets: {
            bank: [
                { id: 1, name: "HDFC CA", current_balance: 159049.2 },
            ],
            cash: [
                { id: 2, name: "Cash", current_balance: 500000 },
            ],
        },
        liabilities: {
            loans_payable: [
                { id: 1, name: "Loan - Nikita", current_balance: 10000 },
            ],
        },
    };

    // Mock income/expense data
    const incomeExpense: IncomeExpense = {
        total_income: 250000,
        total_expense: 180000,
        net_income: 70000,
        income_by_category: {
            salary: 200000,
            freelance: 30000,
            investment: 20000,
        },
        expense_by_category: {
            food: 45000,
            transport: 25000,
            shopping: 40000,
            utilities: 30000,
            entertainment: 20000,
            healthcare: 20000,
        },
    };

    const handleExport = (type: "balance-sheet" | "transactions") => {
        // Mock export functionality - in real app this would download a file
        alert(`Exporting ${type}... (Mock functionality)`);
    };

    const incomeChartData: ChartData[] = Object.entries(incomeExpense.income_by_category).map(([name, value]) => ({
        name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.replace(/_/g, " ").slice(1),
        value,
    }));

    const expenseChartData: ChartData[] = Object.entries(incomeExpense.expense_by_category).map(([name, value]) => ({
        name: name.replace(/_/g, " ").charAt(0).toUpperCase() + name.replace(/_/g, " ").slice(1),
        value,
    }));

    const comparisonData: ComparisonData[] = [
        { name: "Income", amount: incomeExpense.total_income },
        { name: "Expense", amount: incomeExpense.total_expense },
    ];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                        <p className="text-gray-500 text-sm mt-1">Financial statements and analysis</p>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm text-gray-600">Date Range:</span>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <CalendarIcon size={14} className="mr-2" />
                                    {startDate ? formatDate(startDate) : "From"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <CalendarIcon size={14} className="mr-2" />
                                    {endDate ? formatDate(endDate) : "To"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                            </PopoverContent>
                        </Popover>
                        {(startDate || endDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setStartDate(undefined);
                                    setEndDate(undefined);
                                }}
                                className="text-gray-500"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="balance-sheet" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
                        <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
                        <TabsTrigger value="loans">Loans</TabsTrigger>
                    </TabsList>

                    {/* Balance Sheet Tab */}
                    <TabsContent value="balance-sheet" className="space-y-6">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleExport("balance-sheet")}>
                                <Download size={14} className="mr-2" />
                                Export Excel
                            </Button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-emerald-600" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-gray-600">TOTAL ASSETS</p>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(balanceSheet.total_assets)}</p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown size={18} className="text-rose-600" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-gray-600">TOTAL LIABILITIES</p>
                                </div>
                                <p className="text-3xl font-bold text-rose-600">{formatCurrency(balanceSheet.total_liabilities)}</p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">NET WORTH</p>
                                <p className={`text-3xl font-bold ${balanceSheet.net_worth >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {formatCurrency(balanceSheet.net_worth)}
                                </p>
                            </div>
                        </div>

                        {/* Assets and Liabilities */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Assets */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-emerald-600 mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} strokeWidth={1.5} />
                                    Assets
                                </h2>

                                {Object.entries(balanceSheet.assets).map(([category, items]) =>
                                    !items || items.length === 0 ? null : (
                                        <div key={category} className="mb-4">
                                            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                                                {category.replace(/_/g, " ")}
                                            </h3>
                                            {items.map((item) => (
                                                <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-700">{item.name}</span>
                                                    <span className="font-mono text-emerald-600">{formatCurrency(item.current_balance)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
                                    <span className="font-semibold text-gray-900">Total Assets</span>
                                    <span className="font-mono font-semibold text-emerald-600">
                                        {formatCurrency(balanceSheet.total_assets)}
                                    </span>
                                </div>
                            </div>

                            {/* Liabilities */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h2 className="text-lg font-semibold text-rose-600 mb-4 flex items-center gap-2">
                                    <TrendingDown size={20} strokeWidth={1.5} />
                                    Liabilities
                                </h2>

                                {Object.entries(balanceSheet.liabilities).map(([category, items]) =>
                                    !items || items.length === 0 ? null : (
                                        <div key={category} className="mb-4">
                                            <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-2">
                                                {category.replace(/_/g, " ")}
                                            </h3>
                                            {items.map((item) => (
                                                <div key={item.id} className="flex justify-between py-2 border-b border-gray-100">
                                                    <span className="text-gray-700">{item.name}</span>
                                                    <span className="font-mono text-rose-600">{formatCurrency(item.current_balance)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                )}

                                {Object.values(balanceSheet.liabilities).every((arr) => !arr || arr.length === 0) && (
                                    <p className="text-gray-500 text-center py-4">No liabilities</p>
                                )}

                                <div className="flex justify-between pt-4 border-t border-gray-200 mt-4">
                                    <span className="font-semibold text-gray-900">Total Liabilities</span>
                                    <span className="font-mono font-semibold text-rose-600">
                                        {formatCurrency(balanceSheet.total_liabilities)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Income & Expense Tab */}
                    <TabsContent value="income-expense" className="space-y-6">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleExport("transactions")}>
                                <Download size={14} className="mr-2" />
                                Export Excel
                            </Button>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={18} className="text-emerald-600" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-gray-600">TOTAL INCOME</p>
                                </div>
                                <p className="text-3xl font-bold text-emerald-600">{formatCurrency(incomeExpense.total_income)}</p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown size={18} className="text-rose-600" strokeWidth={1.5} />
                                    <p className="text-sm font-medium text-gray-600">TOTAL EXPENSE</p>
                                </div>
                                <p className="text-3xl font-bold text-rose-600">{formatCurrency(incomeExpense.total_expense)}</p>
                            </div>

                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-2">NET INCOME</p>
                                <p className={`text-3xl font-bold ${incomeExpense.net_income >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                    {formatCurrency(incomeExpense.net_income)}
                                </p>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Income Chart */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <PieChart size={20} className="text-emerald-600" strokeWidth={1.5} />
                                    Income by Category
                                </h3>
                                {incomeChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RePieChart>
                                            <Pie
                                                data={incomeChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#22c55e"
                                                dataKey="value"
                                                label={(props: PieLabelRenderProps) => {
                                                    const name = props.name ?? "";
                                                    const percent = props.percent ?? 0;
                                                    return `${name} (${(percent * 100).toFixed(0)}%)`;
                                                }}

                                                labelLine={false}
                                            >
                                                {incomeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-500">No income data</div>
                                )}
                            </div>

                            {/* Expense Chart */}
                            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <PieChart size={20} className="text-rose-600" strokeWidth={1.5} />
                                    Expense by Category
                                </h3>
                                {expenseChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <RePieChart>
                                            <Pie
                                                data={expenseChartData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                fill="#ef4444"
                                                dataKey="value"
                                                label={(props: PieLabelRenderProps) => {
                                                    const name = props.name ?? "";
                                                    const percent = props.percent ?? 0;
                                                    return `${name} (${(percent * 100).toFixed(0)}%)`;
                                                }}
                                                labelLine={false}
                                            >
                                                {expenseChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />

                                        </RePieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] flex items-center justify-center text-gray-500">No expense data</div>
                                )}
                            </div>
                        </div>

                        {/* Comparison Chart */}
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BarChart3 size={20} className="text-blue-600" strokeWidth={1.5} />
                                Income vs Expense
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={comparisonData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis
                                        stroke="#6b7280"
                                        tickFormatter={(val: number) => `₹${(val / 1000).toFixed(0)}K`}
                                    />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#ef4444" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </TabsContent>

                    <TabsContent value="loans" className="space-y-6">
                        <Loans />
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}