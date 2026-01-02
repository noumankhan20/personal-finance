// components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Upload,
  Receipt,
  PlusCircle,
  Folder,
  Tag,
  HandCoins,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, label, isActive }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive
          ? 'bg-blue-50 text-blue-600 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard />, label: 'Dashboard' },
    { href: '/bank-upload', icon: <Upload />, label: 'Bank Upload' },
    { href: '/transactions', icon: <Receipt />, label: 'Transactions' },
    { href: '/add-entry', icon: <PlusCircle />, label: 'Add Entry' },
    { href: '/accounts', icon: <Folder />, label: 'Accounts' },
    { href: '/categories', icon: <Tag />, label: 'Categories' },
    { href: '/loans', icon: <HandCoins />, label: 'Loans' },
    { href: '/reports', icon: <FileText />, label: 'Reports' },
    { href: '/settings', icon: <Settings />, label: 'Settings' },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">LedgerOS</h1>
        <p className="text-xs text-gray-500 mt-1">Personal Accounting</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href}
          />
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all w-full">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
