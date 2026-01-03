"use client"; // This marks the component as a client-side component

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "../components/Layout/SideBar"; // Import Sidebar component
import { usePathname } from "next/navigation"; // Import usePathname to get current route

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Check if the current path is not the login page
  const showSidebar = pathname !== "/"; // Exclude sidebar on /login route

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen">
          {/* Conditionally render Sidebar only if not on /login */}
          {showSidebar && <Sidebar />}

          {/* Main Content Area */}
          <main className="flex-1 bg-gray-50 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
