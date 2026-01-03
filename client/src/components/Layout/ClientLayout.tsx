"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./SideBar";
import {ReduxProviders} from "../../redux/store/provider";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/";

  return (
    <ReduxProviders>
      <div className="flex min-h-screen">
        {showSidebar && <Sidebar />}
        <main className="flex-1 bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </ReduxProviders>
  );
}
