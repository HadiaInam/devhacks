'use client'
import Navbar from "@/components/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #020810 0%, #050f1f 50%, #020c18 100%)" }} className="min-h-screen">
      <div className="px-20">
        <Navbar />
        {children}
      </div>
    </div>
  );
}
