"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Key, Download, Trash2, AlertTriangle, PlusCircle, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const router= useRouter();
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      alert("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
    }, 1000);
  };

  const handleResetAllData = async () => {
    if (resetConfirmText !== "DELETE") {
      alert("Please type DELETE to confirm");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      alert("All data has been reset. Default ledgers created.");
      setShowResetDialog(false);
      setResetConfirmText("");
      setLoading(false);
    }, 1000);
  };

  const handleExport = async (type: "transactions" | "balance-sheet") => {
    alert(`Exporting ${type}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6 max-w-2xl mx-auto" data-testid="settings-page">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account and data</p>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="change-password-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
              <Key size={20} className="text-blue-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-500">Update your account password</p>
            </div>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label className="text-gray-900 text-sm font-medium">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="Enter current password"
                required
                data-testid="current-password-input"
              />
            </div>
            <div>
              <Label className="text-gray-900 text-sm font-medium">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="Enter new password"
                required
                data-testid="new-password-input"
              />
            </div>
            <div>
              <Label className="text-gray-900 text-sm font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="Confirm new password"
                required
                data-testid="confirm-new-password-input"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              data-testid="change-password-btn"
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {loading ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="export-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-emerald-50 flex items-center justify-center">
              <Download size={20} className="text-emerald-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Export Data</h2>
              <p className="text-sm text-gray-500">Download your financial data as Excel</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => handleExport("transactions")}
              data-testid="export-transactions-btn"
              className="border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
            >
              <Download size={16} className="mr-2" />
              Transactions
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("balance-sheet")}
              data-testid="export-balance-sheet-btn"
              className="border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
            >
              <Download size={16} className="mr-2" />
              Balance Sheet
            </Button>
          </div>
        </div>

        {/* Manage Data */}
        <div
          className="bg-white rounded-lg border border-gray-200 p-6"
          data-testid="manage-data-section"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-indigo-50 flex items-center justify-center">
              <PlusCircle size={20} className="text-indigo-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Manage Data</h2>
              <p className="text-sm text-gray-500">
                Create categories and accounts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
              data-testid="add-category-btn"
              onClick={() => router.push("/settings/categories")}
            >
              <PlusCircle size={16} className="mr-2" />
              Manage Categories
            </Button>

            <Button
              variant="outline"
              className="border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
              data-testid="add-account-btn"
              onClick={() => router.push("/settings/accounts")}
            >
              <Wallet size={16} className="mr-2" />
              Manage Accounts
            </Button>
          </div>
        </div>


        {/* Reset All Data */}
        <div
          className="bg-white rounded-lg border border-rose-200 p-6"
          data-testid="reset-section"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-md bg-rose-50 flex items-center justify-center">
              <Trash2 size={20} className="text-rose-600" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Reset All Data</h2>
              <p className="text-sm text-gray-500">
                Delete all ledgers, transactions, loans and start fresh
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            data-testid="reset-data-btn"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 size={16} className="mr-2" />
            Reset All Data
          </Button>
        </div>

        {/* Reset Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <AlertTriangle size={20} />
                Confirm Data Reset
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                This will permanently delete all your data including:
                <ul className="list-disc ml-6 mt-2 text-gray-700">
                  <li>All ledgers and accounts</li>
                  <li>All transactions</li>
                  <li>All loans</li>
                  <li>All tagging patterns</li>
                </ul>
                <p className="mt-3 font-medium text-gray-900">
                  Default ledgers will be recreated.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label className="text-gray-900 text-sm font-medium">Type DELETE to confirm:</Label>
              <Input
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="mt-1.5 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                placeholder="DELETE"
                data-testid="reset-confirm-input"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmText("");
                }}
                className="border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetAllData}
                disabled={loading || resetConfirmText !== "DELETE"}
                data-testid="confirm-reset-btn"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Resetting..." : "Reset Everything"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}