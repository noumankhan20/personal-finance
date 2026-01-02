"use client"
import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Save, Tag, X, CheckCircle2, Plus, ChevronRight, Folder, ArrowRightLeft, Trash2 } from "lucide-react";

// Types
interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    transaction_type: "income" | "expense";
    category_id?: string;
    payee_id?: string;
    linked_loan_id?: string;
}

interface Account {
    id: string;
    name: string;
    account_type: string;
    person_name?: string;
}

interface Category {
    id: string;
    name: string;
    children?: Category[];
}

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
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none";
    const variants = {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
    };
    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
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

const Select = ({ value, onValueChange, children }: any) => {
    return <div className="relative">{children}</div>;
};

const SelectTrigger = ({ children, className = "", ...props }: any) => (
    <button className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className}`} {...props}>
        {children}
    </button>
);

const SelectValue = ({ placeholder }: any) => <span className="text-gray-500">{placeholder}</span>;

const SelectContent = ({ children }: any) => (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
        {children}
    </div>
);

const SelectItem = ({ value, children, onClick }: any) => (
    <div className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100" onClick={onClick}>
        {children}
    </div>
);

const Checkbox = ({ checked, onCheckedChange }: any) => (
    <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
);

const Input = ({ className = "", ...props }: any) => (
    <input className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ${className}`} {...props} />
);

const Dialog = ({ open, onOpenChange, children }: any) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => onOpenChange(false)}>
            <div onClick={(e) => e.stopPropagation()}>{children}</div>
        </div>
    );
};

const DialogContent = ({ children, className = "" }: any) => (
    <div className={`bg-white rounded-lg shadow-xl max-w-md w-full mx-4 ${className}`}>{children}</div>
);

const DialogHeader = ({ children }: any) => <div className="px-6 pt-6 pb-4">{children}</div>;

const DialogTitle = ({ children }: any) => <h2 className="text-xl font-semibold">{children}</h2>;

const DialogFooter = ({ children }: any) => <div className="flex justify-end gap-2 px-6 pb-6">{children}</div>;

// Main Component
export default function BankUpload() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedAccount, setSelectedAccount] = useState("account-1");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Category dialog
    const [showCategoryDialog, setShowCategoryDialog] = useState(false);
    const [selectedTxnForTag, setSelectedTxnForTag] = useState<Transaction | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedPayee, setSelectedPayee] = useState("");
    const [selectedLoanId, setSelectedLoanId] = useState("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [showNewCategory, setShowNewCategory] = useState(false);

    // Mock data
    const accounts: Account[] = [
        { id: "account-1", name: "HDFC Savings", account_type: "bank" },
        { id: "account-2", name: "ICICI Current", account_type: "bank" },
    ];

    const loanAccounts: Account[] = [
        { id: "loan-1", name: "Personal Loan", account_type: "loan_payable", person_name: "Rahul" },
        { id: "loan-2", name: "Home Loan", account_type: "loan_receivable", person_name: "Bank" },
    ];

    const categories: Category[] = [
        { id: "cat-1", name: "Food & Dining", children: [{ id: "sub-1", name: "Restaurants" }, { id: "sub-2", name: "Groceries" }] },
        { id: "cat-2", name: "Transportation", children: [{ id: "sub-3", name: "Uber" }, { id: "sub-4", name: "Petrol" }] },
        { id: "cat-3", name: "Interest Paid", children: [] },
        { id: "cat-4", name: "Interest Received", children: [] },
    ];

    const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(amount || 0);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            handleUpload(droppedFile);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            handleUpload(selectedFile);
        }
    };

    const handleUpload = async (uploadFile: File) => {
        if (!uploadFile) return;
        setUploading(true);

        // Simulate upload with mock data
        setTimeout(() => {
            const mockTransactions: Transaction[] = [
                { id: "txn-1", date: "2026-01-02", description: "Swiggy Food Order", amount: 450, transaction_type: "expense" },
                { id: "txn-2", date: "2026-01-01", description: "Salary Credit", amount: 50000, transaction_type: "income" },
                { id: "txn-3", date: "2025-12-31", description: "Uber Ride", amount: 280, transaction_type: "expense" },
                { id: "txn-4", date: "2025-12-30", description: "Amazon Purchase", amount: 1200, transaction_type: "expense" },
                { id: "txn-5", date: "2025-12-29", description: "Interest Credit", amount: 125, transaction_type: "income" },
            ];
            setTransactions(mockTransactions);
            setUploading(false);
        }, 1500);
    };

    const openTagDialog = (txn: Transaction) => {
        setSelectedTxnForTag(txn);
        setSelectedCategory(txn.category_id || "");
        setSelectedSubCategory("");
        setSelectedPayee(txn.payee_id || "");
        setSelectedLoanId(txn.linked_loan_id || "");
        setShowCategoryDialog(true);
    };

    const applyTag = () => {
        if (!selectedTxnForTag) return;

        const categoryId = selectedSubCategory || selectedCategory;

        if (selectedIds.length > 0 && selectedIds.includes(selectedTxnForTag.id)) {
            setTransactions((prev) => prev.map((txn) =>
                selectedIds.includes(txn.id)
                    ? { ...txn, category_id: categoryId || undefined, payee_id: selectedPayee || undefined, linked_loan_id: selectedLoanId || undefined }
                    : txn
            ));
            setSelectedIds([]);
        } else {
            setTransactions((prev) => prev.map((txn) =>
                txn.id === selectedTxnForTag.id
                    ? { ...txn, category_id: categoryId || undefined, payee_id: selectedPayee || undefined, linked_loan_id: selectedLoanId || undefined }
                    : txn
            ));
        }

        setShowCategoryDialog(false);
        setSelectedTxnForTag(null);
        setSelectedCategory("");
        setSelectedSubCategory("");
        setSelectedPayee("");
        setSelectedLoanId("");
    };

    const createNewCategory = () => {
        if (!newCategoryName.trim()) return;
        setNewCategoryName("");
        setShowNewCategory(false);
    };

    const toggleSelect = (id: string) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
    const toggleSelectAll = () => selectedIds.length === transactions.length ? setSelectedIds([]) : setSelectedIds(transactions.map((t) => t.id));

    const deleteTransaction = (id: string) => {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
    };

    const deleteSelected = () => {
        if (selectedIds.length === 0) return;
        setTransactions((prev) => prev.filter((t) => !selectedIds.includes(t.id)));
        setSelectedIds([]);
    };

    const deleteAll = () => {
        if (!confirm("Remove all pending transactions?")) return;
        setTransactions([]);
        setSelectedIds([]);
        setFile(null);
    };

    const handleSave = () => {
        if (transactions.length === 0) return;
        setSaving(true);
        setTimeout(() => {
            setTransactions([]);
            setFile(null);
            setSaving(false);
        }, 1000);
    };

    const getCategoryName = (categoryId?: string) => {
        if (!categoryId) return null;
        for (const cat of categories) {
            if (cat.id === categoryId) return cat.name;
            if (cat.children) {
                const child = cat.children.find(c => c.id === categoryId);
                if (child) return `${cat.name} > ${child.name}`;
            }
        }
        return null;
    };

    const getPayeeName = (payeeId?: string) => {
        const account = loanAccounts.find(a => a.id === payeeId);
        return account?.name || null;
    };

    const bankAccounts = accounts.filter((a) => a.account_type === "bank");
    const selectedCategoryData = categories.find(c => c.id === selectedCategory);
    const isInterestCategory = selectedCategoryData?.name === "Interest Paid" || selectedCategoryData?.name === "Interest Received";

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Bank Statement Upload</h1>
                        <p className="text-gray-500 text-sm mt-1">Import HDFC bank statement (XLS/XLSX)</p>
                    </div>
                </div>

                {bankAccounts.length > 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-xs">
                                <label className="text-sm text-gray-600 mb-1 block">Select Bank Account</label>
                                <select
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                                >
                                    {bankAccounts.map((account) => (
                                        <option key={account.id} value={account.id}>{account.name}</option>
                                    ))}
                                </select>
                            </div>
                            <Button variant="outline" size="sm" className="mt-6">
                                <Plus size={14} className="mr-1" />Add Bank
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                        <p className="text-gray-600 mb-3">No bank accounts found. Create one first.</p>
                        <Button><Plus size={16} className="mr-2" />Create Bank Account</Button>
                    </div>
                )}

                {transactions.length === 0 && bankAccounts.length > 0 && (
                    <div
                        className={`bg-white rounded-lg shadow-sm p-12 text-center cursor-pointer border-2 border-dashed transition-colors ${dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".xls,.xlsx" onChange={handleFileSelect} className="hidden" />
                        {uploading ? (
                            <div className="text-gray-500">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>Processing...</p>
                            </div>
                        ) : (
                            <>
                                <FileSpreadsheet size={40} className="text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                                <p className="text-gray-700 font-medium">Drop your HDFC bank statement here</p>
                                <p className="text-gray-500 text-sm mt-1">or click to browse (XLS, XLSX)</p>
                            </>
                        )}
                    </div>
                )}

                {transactions.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-4">
                                <Checkbox checked={selectedIds.length === transactions.length} onCheckedChange={toggleSelectAll} />
                                <span className="text-sm text-gray-600">
                                    {selectedIds.length > 0 ? `${selectedIds.length} selected` : `${transactions.length} transactions`}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedIds.length > 0 && (
                                    <>
                                        <Button variant="outline" size="sm" onClick={() => {
                                            const firstSelected = transactions.find(t => t.id === selectedIds[0]);
                                            if (firstSelected) openTagDialog(firstSelected);
                                        }}>
                                            <Tag size={14} className="mr-2" />Bulk Tag ({selectedIds.length})
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={deleteSelected} className="text-rose-600 hover:text-rose-700">
                                            <Trash2 size={14} className="mr-2" />Delete Selected
                                        </Button>
                                    </>
                                )}
                                <Button variant="outline" size="sm" onClick={deleteAll} className="text-rose-600 hover:text-rose-700">
                                    <Trash2 size={14} className="mr-2" />Delete All
                                </Button>
                                <Button onClick={handleSave} disabled={saving}>
                                    <Save size={16} className="mr-2" />{saving ? "Saving..." : "Save All"}
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            <table className="w-full">
                                <thead className="sticky top-0 bg-gray-50 z-10">
                                    <tr className="text-sm">
                                        <th className="w-10 p-3"></th>
                                        <th className="text-left p-3">Date</th>
                                        <th className="text-left p-3">Description</th>
                                        <th className="text-right p-3">Amount</th>
                                        <th className="text-left w-32 p-3">Type</th>
                                        <th className="text-left w-48 p-3">Category / Payee</th>
                                        <th className="w-10 p-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className={`text-sm border-t ${selectedIds.includes(txn.id) ? "bg-blue-50" : ""}`}>
                                            <td className="p-3"><Checkbox checked={selectedIds.includes(txn.id)} onCheckedChange={() => toggleSelect(txn.id)} /></td>
                                            <td className="font-mono text-sm p-3">{txn.date}</td>
                                            <td className="text-sm max-w-[250px] truncate p-3" title={txn.description}>{txn.description}</td>
                                            <td className={`font-mono text-sm text-right p-3 ${txn.transaction_type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                                                {formatCurrency(txn.amount)}
                                            </td>
                                            <td className="p-3">
                                                <span className={`text-xs px-2 py-1 rounded ${txn.transaction_type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                    {txn.transaction_type}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-xs w-full justify-start"
                                                    onClick={() => openTagDialog(txn)}
                                                >
                                                    {txn.category_id || txn.payee_id ? (
                                                        <span className="truncate flex items-center gap-1">
                                                            {txn.payee_id ? <ArrowRightLeft size={12} /> : <Folder size={12} />}
                                                            {getCategoryName(txn.category_id) || getPayeeName(txn.payee_id)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 flex items-center gap-1">
                                                            <Tag size={12} />
                                                            Tag...
                                                        </span>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="p-3">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTransaction(txn.id)}>
                                                    <X size={14} className="text-gray-400 hover:text-rose-600" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-200">
                            <div className="flex gap-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Income: </span>
                                    <span className="font-mono text-emerald-600">
                                        {formatCurrency(transactions.filter((t) => t.transaction_type === "income").reduce((sum, t) => sum + t.amount, 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Expense: </span>
                                    <span className="font-mono text-rose-600">
                                        {formatCurrency(transactions.filter((t) => t.transaction_type === "expense").reduce((sum, t) => sum + t.amount, 0))}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span className="text-gray-600">
                                    {transactions.filter((t) => t.category_id || t.payee_id).length}/{transactions.length} tagged
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedIds.length > 1 ? `Tag ${selectedIds.length} Transactions` : "Tag Transaction"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 p-6">
                            {selectedTxnForTag && (
                                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                                    <p className="font-medium truncate">{selectedTxnForTag.description}</p>
                                    <p className={`font-mono ${selectedTxnForTag.transaction_type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                                        {formatCurrency(selectedTxnForTag.amount)}
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(""); }}
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                                >
                                    <option value="">Select category</option>
                                    <option value="none">No category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedCategoryData?.children && selectedCategoryData.children.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Sub-category (optional)</label>
                                    <select
                                        value={selectedSubCategory}
                                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                                    >
                                        <option value="">Use parent category</option>
                                        <option value="none">Use parent category</option>
                                        {selectedCategoryData.children.map((sub) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {isInterestCategory && loanAccounts.length > 0 && (
                                <div className="pt-2 border-t">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Link to Loan (for interest tracking)</label>
                                    <select
                                        value={selectedLoanId}
                                        onChange={(e) => setSelectedLoanId(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                                    >
                                        <option value="">Select loan account</option>
                                        <option value="none">No specific loan</option>
                                        {loanAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} {acc.person_name ? `(${acc.person_name})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Track which loan this interest payment belongs to</p>
                                </div>
                            )}

                            {!showNewCategory ? (
                                <Button variant="ghost" size="sm" onClick={() => setShowNewCategory(true)} className="text-blue-600">
                                    <Plus size={14} className="mr-1" />
                                    {selectedCategory ? "Add sub-category" : "Add new category"}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder={selectedCategory ? "Sub-category name" : "Category name"}
                                        value={newCategoryName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setNewCategoryName(e.target.value)
                                        }
                                        className="flex-1"
                                    />
                                    <Button size="sm" onClick={createNewCategory}>Add</Button>
                                    <Button size="sm" variant="ghost" onClick={() => { setShowNewCategory(false); setNewCategoryName(""); }}>
                                        <X size={14} />
                                    </Button>
                                </div>
                            )}

                            {loanAccounts.length > 0 && !isInterestCategory && (
                                <div className="pt-4 border-t">
                                    <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                                        <ArrowRightLeft size={14} />
                                        Or mark as Transfer to
                                    </label>
                                    <select
                                        value={selectedPayee}
                                        onChange={(e) => { setSelectedPayee(e.target.value); if (e.target.value) setSelectedCategory(""); }}
                                        className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                                    >
                                        <option value="">Select payee account</option>
                                        <option value="none">Not a transfer</option>
                                        {loanAccounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} {acc.person_name ? `(${acc.person_name})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">For loans/transfers to specific people or accounts</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
                            <Button onClick={applyTag}>Apply Tag</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}