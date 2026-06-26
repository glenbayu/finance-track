"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  desktopNavBottomItems,
  desktopNavMainItems,
  getActiveNavFromPathname,
  withMonth,
} from "@/components/layout/app-nav";

type DesktopSidebarLinksProps = {
  section: "main" | "bottom";
};

export default function DesktopSidebarLinks({ section }: DesktopSidebarLinksProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const month = searchParams.get("month")?.trim() || undefined;
  const activeNav = getActiveNavFromPathname(pathname);
  const highlightedNav = activeNav === "add" ? "transactions" : activeNav;
  const items = section === "main" ? desktopNavMainItems : desktopNavBottomItems;

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === highlightedNav;
        const href = section === "main" ? withMonth(item.path, month) : item.path;

        return (
          <Link
            key={item.key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`app-shell-nav-link ${isActive ? "is-active" : ""}`}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}
