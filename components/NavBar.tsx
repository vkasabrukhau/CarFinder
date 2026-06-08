"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Menubar from "@/components/ui/menubar";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/add", label: "Add" },
  { href: "/compare", label: "Compare" },
  { href: "/finances", label: "Finances" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname() || "/";
  const router = useRouter();

  return (
    <nav className="w-full border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          <span className="font-semibold text-sm mr-2">Car Finder</span>
          <Menubar links={links} />
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
                <Menu className="mr-2 size-4" />
                Menu
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {links.map((l) => {
                  const active =
                    l.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(l.href);

                  return (
                    <DropdownMenuItem
                      key={l.href}
                      onClick={() => router.push(l.href)}
                      className={cn(
                        active && "bg-accent text-accent-foreground font-medium",
                      )}
                    >
                      {l.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
