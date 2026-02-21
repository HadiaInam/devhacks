'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppContextProvider from "@/context/AppContext";
import { ToastContainer } from "react-toastify";
import Navbar from "@/components/Navbar";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased px-20`}
        style={{ background: "linear-gradient(135deg, #020810 0%, #050f1f 50%, #020c18 100%)" }}>
        <AppContextProvider>
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false}
            newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss
            draggable pauseOnHover theme="light" />
          {children}
        </AppContextProvider>
      </body>
    </html>
  )
}