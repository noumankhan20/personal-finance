"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, ArrowUpRight, ArrowDownRight, User, Calculator, Edit2, Trash2, Banknote } from "lucide-react";

interface Loan {
  id: number;
  person_name: string;
  loan_type: "given" | "taken";
  principal: number;
  interest_rate: number;
  interest_type: "simple" | "compound";
  start_date: string;
  notes: string;
  total_repaid: number;
  interest_paid: number;
}

interface InterestData {
  principal: number;
  outstanding_principal: number;
  interest_rate: number;
  interest_type: string;
  days_elapsed: number;
  accrued_interest: number;
  interest_paid: number;
  interest_due: number;
  total_due: number;
}

interface FormData {
  person_name: string;
  loan_type: "given" | "taken";
  principal: number;
  interest_rate: number;
  interest_type: "simple" | "compound";
  start_date: string;
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
  const startDate = new Date(loan.start_date);
  const today = new Date();
  const daysElapsed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const outstandingPrincipal = loan.principal - loan.total_repaid;
  
  let accruedInterest = 0;
  if (loan.interest_type === "simple") {
    accruedInterest = (outstandingPrincipal * loan.interest_rate * daysElapsed) / (365 * 100);
  } else {
    const months = daysElapsed / 30;
    accruedInterest = outstandingPrincipal * (Math.pow(1 + loan.interest_rate / 1200, months) - 1);
  }

  const interestDue = accruedInterest - loan.interest_paid;
  const totalDue = outstandingPrincipal + interestDue;

  return {
    principal: loan.principal,
    outstanding_principal: outstandingPrincipal,
    interest_rate: loan.interest_rate,
    interest_type: loan.interest_type,
    days_elapsed: daysElapsed,
    accrued_interest: accruedInterest,
    interest_paid: loan.interest_paid,
    interest_due: interestDue,
    total_due: totalDue,
  };
};

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([
    {
      id: 1,
      person_name: "AKash Broker",
      loan_type: "taken",
      principal: 100000,
      interest_rate: 2,
      interest_type: "simple",
      start_date: "2025-12-31",
      notes: "",
      total_repaid: 0,
      interest_paid: 0,
    },
    {
      id: 2,
      person_name: "Nikita",
      loan_type: "taken",
      principal: 10000,
      interest_rate: 40,
      interest_type: "simple",
      start_date: "2026-01-01",
      notes: "",
      total_repaid: 0,
      interest_paid: 0,
    },
  ]);

  const [showDialog, setShowDialog] = useState(false);
  const [showRepaymentDialog, setShowRepaymentDialog] = useState(false);
  const [showInterestDialog, setShowInterestDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filterType, setFilterType] = useState<"all" | "given" | "taken">("all");
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  const [formData, setFormData] = useState<FormData>({
    person_name: "",
    loan_type: "given",
    principal: 0,
    interest_rate: 0,
    interest_type: "simple",
    start_date: formatDate(new Date()),
    notes: "",
  });

  const [repaymentData, setRepaymentData] = useState<RepaymentData>({
    amount: 0,
    date: formatDate(new Date()),
    is_interest: false,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLoan) {
      setLoans(loans.map(l => l.id === editingLoan.id ? { ...l, ...formData } : l));
    } else {
      const newLoan: Loan = {
        id: Date.now(),
        ...formData,
        total_repaid: 0,
        interest_paid: 0,
      };
      setLoans([...loans, newLoan]);
    }
    setShowDialog(false);
    setEditingLoan(null);
    resetForm();
  };

  const handleRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setLoans(loans.map(l => {
      if (l.id === selectedLoan.id) {
        if (repaymentData.is_interest) {
          return { ...l, interest_paid: l.interest_paid + repaymentData.amount };
        } else {
          return { ...l, total_repaid: l.total_repaid + repaymentData.amount };
        }
      }
      return l;
    }));

    setShowRepaymentDialog(false);
    setSelectedLoan(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this loan? This cannot be undone.")) return;
    setLoans(loans.filter(l => l.id !== id));
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      person_name: loan.person_name,
      loan_type: loan.loan_type,
      principal: loan.principal,
      interest_rate: loan.interest_rate,
      interest_type: loan.interest_type,
      start_date: loan.start_date,
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
      person_name: "",
      loan_type: "given",
      principal: 0,
      interest_rate: 0,
      interest_type: "simple",
      start_date: formatDate(new Date()),
      notes: "",
    });
  };

  const getOutstandingBalance = (loan: Loan): number => {
    return loan.principal - loan.total_repaid;
  };

  const filteredLoans = filterType === "all" ? loans : loans.filter(l => l.loan_type === filterType);
  const totalReceivable = loans.filter(l => l.loan_type === "given").reduce((sum, l) => sum + getOutstandingBalance(l), 0);
  const totalPayable = loans.filter(l => l.loan_type === "taken").reduce((sum, l) => sum + getOutstandingBalance(l), 0);

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
            <p className="text-xs text-gray-500 mt-1">{loans.filter(l => l.loan_type === "given").length} active loans</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight size={18} className="text-rose-600" strokeWidth={1.5} />
              <p className="text-sm font-medium text-gray-600">TOTAL PAYABLE</p>
            </div>
            <p className="text-3xl font-bold text-rose-600">{formatCurrency(totalPayable)}</p>
            <p className="text-xs text-gray-500 mt-1">{loans.filter(l => l.loan_type === "taken").length} active loans</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 text-black cursor-pointer">
          <Button variant={filterType === "all" ? "outline" : "default"} size="sm" onClick={() => setFilterType("all")}>All</Button>
          <Button variant={filterType === "given" ? "outline" : "default"} size="sm" onClick={() => setFilterType("given")}>Given</Button>
          <Button variant={filterType === "taken" ? "outline" : "default"} size="sm" onClick={() => setFilterType("taken")}>Taken</Button>
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
              const isGiven = loan.loan_type === "given";
              const interest = calculateInterest(loan);

              return (
                <div key={loan.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${isGiven ? "bg-emerald-50" : "bg-rose-50"}`}>
                        <User size={20} className={isGiven ? "text-emerald-600" : "text-rose-600"} strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{loan.person_name}</h3>
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
                    {loan.interest_rate > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Interest Rate</span>
                          <span className="font-mono text-gray-900">{loan.interest_rate}% ({loan.interest_type})</span>
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
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                        setSelectedLoan(loan);
                        setRepaymentData({ amount: 0, date: formatDate(new Date()), is_interest: false, notes: "" });
                        setShowRepaymentDialog(true);
                      }}>
                        <Banknote size={14} className="mr-1" />
                        Pay
                      </Button>
                      {loan.interest_rate > 0 && (
                        <Button variant="outline" size="sm" onClick={() => showInterestCalc(loan)}>
                          <Calculator size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-3">Started: {loan.start_date}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Loan Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>{editingLoan ? "Edit Loan" : "New Loan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Person Name</Label>
                <Input value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} className="mt-1" placeholder="Enter name" required />
              </div>

              <div>
                <Label>Loan Type</Label>
                <Select value={formData.loan_type} onValueChange={(val: "given" | "taken") => setFormData({ ...formData, loan_type: val })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="given">Loan Given (You lent money)</SelectItem>
                    <SelectItem value="taken">Loan Taken (You borrowed money)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Principal Amount (₹)</Label>
                  <Input type="number" step="0.01" value={formData.principal} onChange={(e) => setFormData({ ...formData, principal: parseFloat(e.target.value) || 0 })} className="mt-1 font-mono" required />
                </div>
                <div>
                  <Label>Interest Rate (% p.a.)</Label>
                  <Input type="number" step="0.01" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) || 0 })} className="mt-1 font-mono" />
                </div>
              </div>

              {formData.interest_rate > 0 && (
                <div>
                  <Label>Interest Type</Label>
                  <Select value={formData.interest_type} onValueChange={(val: "simple" | "compound") => setFormData({ ...formData, interest_type: val })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple Interest</SelectItem>
                      <SelectItem value="compound">Compound Interest (Monthly)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Start Date</Label>
                <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="mt-1" />
              </div>

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="mt-1 h-20" placeholder="Any additional notes" />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                <Button type="submit">{editingLoan ? "Update" : "Create Loan"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Repayment Dialog */}
        <Dialog open={showRepaymentDialog} onOpenChange={setShowRepaymentDialog}>
          <DialogContent className="bg-white text-black">
            <DialogHeader>
              <DialogTitle>Record Payment - {selectedLoan?.person_name}</DialogTitle>
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
                <Select value={repaymentData.is_interest ? "interest" : "principal"} onValueChange={(val) => setRepaymentData({ ...repaymentData, is_interest: val === "interest" })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal Repayment</SelectItem>
                    <SelectItem value="interest">Interest Payment</SelectItem>
                  </SelectContent>
                </Select>
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
              <DialogTitle>Interest Calculation - {selectedLoan?.person_name}</DialogTitle>
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
                          <span className="font-mono">{interest.interest_rate}% ({interest.interest_type})</span>
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
                            <span className={`font-mono ${selectedLoan.loan_type === "given" ? "text-emerald-600" : "text-rose-600"}`}>
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
      </div>
    </div>
  );
}