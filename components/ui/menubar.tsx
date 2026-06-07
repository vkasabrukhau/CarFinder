"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type LinkItem = { href: string; label: string };

export default function Menubar({ links }: { links: LinkItem[] }) {
  const pathname = usePathname() || "/";
  const router = useRouter();

  return (
    <div
      className="hidden sm:flex items-center gap-2"
      role="menubar"
      aria-label="Main menu"
    >
      {links.map((l) => {
        const active =
          l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);

        return (
          <button
            key={l.href}
            role="menuitem"
            onClick={() => router.push(l.href)}
            className={cn(
              "rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-200 ease-out",
              active
                ? "bg-white text-black font-heading shadow-sm scale-102"
                : "bg-transparent text-white/90 hover:bg-[#4a4a4a] hover:text-white",
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
