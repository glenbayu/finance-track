"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, FolderSearch, Wallet } from "lucide-react";

export default function MobileBottomNav({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Transaksi", href: "/transactions", icon: ReceiptText },
    { name: "Kategori", href: "/categories", icon: FolderSearch },
    { name: "Dompet", href: "/wallets", icon: Wallet },
  ];

  return (
    <nav className={`fixed bottom-0 z-50 w-full border-t border-slate-200 bg-white/90 backdrop-blur-md pb-safe pt-2 px-2 dark:border-slate-800 dark:bg-slate-950/90 ${className}`}>
      <div className="flex h-14 items-center justify-around gap-1 pb-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-full rounded-lg transition-colors ${
                isActive
                  ? "text-teal-700 dark:text-teal-400 font-semibold"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
