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
      className="hidden sm:flex items-center gap-1"
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
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
