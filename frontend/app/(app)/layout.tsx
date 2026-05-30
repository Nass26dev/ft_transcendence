import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr]">
      <Sidebar />

      <div className="grid min-h-screen min-w-0 grid-rows-[auto_1fr]">
        <Topbar />
        <main>{children}</main>
      </div>
    </div>
  );
}