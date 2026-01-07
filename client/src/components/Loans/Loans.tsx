"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ArrowUpRight, ArrowDownRight, User, Calculator, Edit2, Trash2, Banknote } from "lucide-react";
import {
  useGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanMutation,
  useDeleteLoanMutation,
  useCreateLoanRepaymentMutation,
  useGetLoanRepaymentsQuery,
} from "@/redux/slices/loanSlice";

interface Loan {
  id: string;
  personName: string;
  loanType: "GIVEN" | "TAKEN";
  principal: number | "";
  interestRate: number | "";
  interestType: "SIMPLE" | "COMPOUND";
  startDate: string;
  notes: string;
  total_repaid: number;
  interest_paid: number;
}

interface InterestData {
  principal: number | "";
  outstanding_principal: number;
  interestRate: number | "";
  interestType: string;
  days_elapsed: number;
  accrued_interest: number;
  interest_paid: number;
  interest_due: number;
  total_due: number;
}

interface FormData {
  personName: string;
  loanType: "GIVEN" | "TAKEN";
  principal: number | "";
  interestRate: number | "";
  interestType: "SIMPLE" | "COMPOUND";
  startDate: string;
  notes: string;
}

interface RepaymentData {
  amount: number;
  date: string;
  is_interest: boolean;
  notes: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateInterest = (loan: Loan): InterestData => {
  const startDate = new Date(loan.startDate);
  const today = new Date();
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const outstandingPrincipal = loan.principal - loan.total_repaid;

  let accruedInterest = 0;
  if (loan.interestType === "SIMPLE") {
    accruedInterest = (outstandingPrincipal * loan.interestRate * daysElapsed) / (365 * 100);
  } else {
    const months = daysElapsed / 30;
    accruedInterest = outstandingPrincipal * (Math.pow(1 + loan.interestRate / 1200, months) - 1);
  }

  const interestDue = accruedInterest - loan.interest_paid;
  const totalDue = outstandingPrincipal + interestDue;

  return {
    principal: loan.principal,
    outstanding_principal: outstandingPrincipal,
    interestRate: loan.interestRate,
    interestType: loan.interestType,
    days_elapsed: daysElapsed,
    accrued_interest: accruedInterest,
    interest_paid: loan.interest_paid,
    interest_due: interestDue,
    total_due: totalDue,
  };
};

export default function Loans() {
  const { data: loans = [], isLoading, error } = useGetLoansQuery();
  const [createLoan] = useCreateLoanMutation();
  const [updateLoan] = useUpdateLoanMutation();
  const [deleteLoan] = useDeleteLoanMutation();
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  const [showDialog, setShowDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filterType, setFilterType] = useState<"all" | "GIVEN" | "TAKEN">("all");
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [createLoanRepayment] = useCreateLoanRepaymentMutation();

  const [formData, setFormData] = useState<FormData>({
    personName: "",
    loanType: "GIVEN",
    principal: 0,
    interestRate: 0,
    interestType: "SIMPLE",
    startDate: formatDate(new Date()),
    notes: "",
  });

  const [repaymentData, setRepaymentData] = useState<RepaymentData>({
    amount: 0,
    date: formatDate(new Date()),
    is_interest: false,
    notes: "",
  });

  const {
    data: repayments = [],
    isLoading: repaymentsLoading,
  } = useGetLoanRepaymentsQuery(historyLoan?.id!, {
    skip: !historyLoan,
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLoan) {
        await updateLoan({ id: editingLoan.id, data: formData }).unwrap();
      } else {
        await createLoan(formData).unwrap();
      }
      setShowDialog(false);
      setEditingLoan(null);
      resetForm();
    } catch (err) {
      console.error("Failed to save loan:", err);
    }
  };

  const handleRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    try {
      await createLoanRepayment({
        loanId: selectedLoan.id,
        amount: repaymentData.amount,
        repaymentType: repaymentData.is_interest
          ? "INTEREST"
          : "PRINCIPAL",
        date: repaymentData.date,
        notes: repaymentData.notes,
      }).unwrap();

      setShowRepaymentDialog(false);
      setSelectedLoan(null);
    } catch (err) {
      console.error("Failed to record repayment:", err);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Delete this loan? This cannot be undone.")) return;
    try {
      await deleteLoan(id).unwrap();
    } catch (err) {
      console.error("Failed to delete loan:", err);
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      personName: loan.personName,
      loanType: loan.loanType,
      principal: loan.principal,
      interestRate: loan.interestRate,
      interestType: loan.interestType,
      startDate: loan.startDate.split("T")[0],
      notes: loan.notes,
    });
    setShowDialog(true);
  };

  const showInterestCalc = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowInterestDialog(true);
  };

  const resetForm = () => {
    setFormData({
      personName: "",
      loanType: "GIVEN",
      principal: 0,
      interestRate: 0,
      interestType: "SIMPLE",
      startDate: formatDate(new Date()),
      notes: "",
    });
  };

  const getOutstandingBalance = (loan: Loan): number => {
    return loan.principal - loan.total_repaid;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading loans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">Error loading loans. Please try again.</p>
      </div>
    );
  }

  const filteredLoans = filterType === "all" ? loans : loans.filter(l => l.loanType === filterType);
  const totalReceivable = loans.filter(l => l.loanType === "GIVEN").reduce((sum, l) => sum + getOutstandingBalance(l), 0);
  const totalPayable = loans.filter(l => l.loanType === "TAKEN").reduce((sum, l) => sum + getOutstandingBalance(l), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
            <p className="text-gray-500 text-sm mt-1">Track loans given and taken with interest</p>
          </div>
          <Button
            className="bg-black text-white "
            onClick={() => { resetForm(); setEditingLoan(null); setShowDialog(true); }}>
            <Plus size={16} className="mr-2" />
            New Loan
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight size={18} className="text-emerald-600" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-600">TOTAL RECEIVABLE</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalReceivable)}</p>
            <p className="text-xs text-gray-500 mt-1">{loans.filter(l => l.loanType === "GIVEN").length} active loans</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight size={18} className="text-rose-600" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-600">TOTAL PAYABLE</p>
            </div>
            <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalPayable)}</p>
            <p className="text-xs text-gray-500 mt-1">{loans.filter(l => l.loanType === "TAKEN").length} active loans</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 text-black cursor-pointer">
          <Button variant={filterType === "all" ? "outline" : "default"} size="sm" onClick={() => setFilterType("all")}>All</Button>
          <Button variant={filterType === "GIVEN" ? "outline" : "default"} size="sm" onClick={() => setFilterType("GIVEN")}>Given</Button>
          <Button variant={filterType === "TAKEN" ? "outline" : "default"} size="sm" onClick={() => setFilterType("TAKEN")}>Taken</Button>
        </div>

        {/* Loans List */}
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No loans found</p>
            <Button variant="link" className="text-blue-600 mt-2" onClick={() => setShowDialog(true)}>Create your first loan</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLoans.map((loan) => {
              const outstanding = getOutstandingBalance(loan);
              const isGiven = loan.loanType === "GIVEN";
              const interest = calculateInterest(loan);

              return (
                <div key={loan.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isGiven ? "bg-emerald-50" : "bg-rose-50"}`}>
                        <User size={20} className={isGiven ? "text-emerald-600" : "text-rose-600"} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{loan.personName}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${isGiven ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {isGiven ? "Given" : "Taken"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(loan)}>
                        <Edit2 size={14} className="text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(loan.id)}>
                        <Trash2 size={14} className="text-gray-500 hover:text-rose-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Principal</span>
                      <span className="font-mono text-gray-900">{formatCurrency(loan.principal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Repaid</span>
                      <span className="font-mono text-gray-900">{formatCurrency(loan.total_repaid)}</span>
                    </div>
                    {loan.interestRate > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Interest Rate</span>
                          <span className="font-mono text-gray-900">{loan.interestRate}% ({loan.interestType})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Accrued Interest</span>
                          <span className="font-mono text-amber-600">{formatCurrency(interest.accrued_interest)}</span>
                        </div>
                        {loan.interest_paid > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Interest Paid</span>
                            <span className="font-mono text-emerald-600">{formatCurrency(loan.interest_paid)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-500">Outstanding</span>
                      <span className={`font-mono text-lg font-medium ${isGiven ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatCurrency(interest.total_due)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setHistoryLoan(loan);
                          setShowHistoryDialog(true);
                        }}
                      >
                        History
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                        setSelectedLoan(loan);
                        setRepaymentData({ amount: 0, date: formatDate(new Date()), is_interest: false, notes: "" });
                        setShowRepaymentDialog(true);
                      }}>
                        <Banknote size={14} className="mr-1" />
                        Pay
                      </Button>
                      {loan.interestRate > 0 && (
                        <Button variant="outline" size="sm" onClick={() => showInterestCalc(loan)}>
                          <Calculator size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">Started: {loan.startDate}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Loan Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-white text-black max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3 pb-4">
              <DialogTitle className="text-2xl font-semibold tracking-tight">
                {editingLoan ? "Edit Loan Details" : "Create New Loan"}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {editingLoan
                  ? "Update the loan information below"
                  : "Enter the details of your loan transaction"}
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Person Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="e.g., John Doe"
                  required
                />
              </div>

              {/* Loan Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Loan Type <span className="text-red-500">*</span>
                </Label>
                <select
                  value={formData.loanType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      loanType: e.target.value as "GIVEN" | "TAKEN",
                    })
                  }
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm
             focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GIVEN">Loan Given</option>
                  <option value="TAKEN">Loan Taken</option>
                </select>

              </div>

              {/* Principal and Interest Rate */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Principal Amount <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      ₹
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.principal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          principal: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="h-11 pl-8 font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="10000.00"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Interest Rate (% per annum)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interestRate: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="h-11 pr-8 font-mono border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      placeholder="5.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Interest Type - Conditional */}
              {formData.interestRate > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label className="text-sm font-medium text-gray-700">
                    Interest Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={formData.interestType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestType: e.target.value as "SIMPLE" | "COMPOUND",
                      })
                    }
                    className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm
             focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SIMPLE">Simple Interest</option>
                    <option value="COMPOUND">Compound Interest (Monthly)</option>
                  </select>

                </div>
              )}

              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Start Date
                </Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Additional Notes
                  <span className="text-xs text-gray-400 font-normal ml-2">(Optional)</span>
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  placeholder="Add any additional information about this loan..."
                />
              </div>

              {/* Action Buttons */}
              <DialogFooter className="gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="h-11 px-6 border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {editingLoan ? "Update Loan" : "Create Loan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Repayment Dialog */}
        <Dialog open={showRepaymentDialog} onOpenChange={setShowRepaymentDialog}>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>Record Payment - {selectedLoan?.personName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRepayment} className="space-y-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" step="0.01" value={repaymentData.amount} onChange={(e) => setRepaymentData({ ...repaymentData, amount: parseFloat(e.target.value) || 0 })} className="mt-1 font-mono" required />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={repaymentData.date} onChange={(e) => setRepaymentData({ ...repaymentData, date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Payment Type</Label>
                <select
                  value={repaymentData.is_interest ? "interest" : "principal"}
                  onChange={(e) =>
                    setRepaymentData({
                      ...repaymentData,
                      is_interest: e.target.value === "interest",
                    })
                  }
                  className="mt-1 h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm
             focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="principal">Principal Repayment</option>
                  <option value="interest">Interest Payment</option>
                </select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowRepaymentDialog(false)}>Cancel</Button>
                <Button type="submit">Record Payment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Interest Calculation Dialog */}
        <Dialog open={showInterestDialog} onOpenChange={setShowInterestDialog}>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>Interest Calculation - {selectedLoan?.personName}</DialogTitle>
            </DialogHeader>
            {selectedLoan && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {(() => {
                    const interest = calculateInterest(selectedLoan);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Principal</span>
                          <span className="font-mono">{formatCurrency(interest.principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Outstanding Principal</span>
                          <span className="font-mono">{formatCurrency(interest.outstanding_principal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interest Rate</span>
                          <span className="font-mono">{interest.interestRate}% ({interest.interestType})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Days Elapsed</span>
                          <span className="font-mono">{interest.days_elapsed} days</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accrued Interest</span>
                            <span className="font-mono text-amber-600">{formatCurrency(interest.accrued_interest)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Interest Paid</span>
                            <span className="font-mono text-emerald-600">{formatCurrency(interest.interest_paid)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Interest Due</span>
                            <span className="font-mono text-rose-600">{formatCurrency(interest.interest_due)}</span>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 pt-2 mt-2">
                          <div className="flex justify-between text-lg font-medium">
                            <span className="text-gray-900">Total Due</span>
                            <span className={`font-mono ${selectedLoan.loanType === "GIVEN" ? "text-emerald-600" : "text-rose-600"}`}>
                              {formatCurrency(interest.total_due)}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowInterestDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="bg-white text-black max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Repayment History – {historyLoan?.personName}
              </DialogTitle>
            </DialogHeader>

            {repaymentsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : repayments.length === 0 ? (
              <p className="text-sm text-gray-500">No repayments yet</p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {repayments.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center border rounded-md p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {r.repaymentType === "PRINCIPAL"
                          ? "Principal Payment"
                          : "Interest Payment"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(r.date).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="font-mono">
                      {formatCurrency(Number(r.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => setShowHistoryDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}