"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { Menu } from "lucide-react";

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
    <nav className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-[10px] border border-[#4E4E4E] bg-[#383838] px-3 py-2 text-sm font-medium text-white transition-colors duration-200 ease-in-out hover:bg-[#4a4a4a] hover:text-white">
              <Menu className="mr-2 size-4 text-white" />
              Menu
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border border-[#4E4E4E] bg-[#383838] text-foreground shadow-lg">
              {links.map((l) => {
                const active =
                  l.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(l.href);

                return (
                  <DropdownMenuItem
                    key={l.href}
                    onClick={() => router.push(l.href)}
                    className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-colors duration-200 ease-in-out ${
                      active
                        ? "bg-[#FFFFFF] text-black"
                        : "bg-transparent text-foreground hover:bg-[#4a4a4a] hover:text-[#FFFFFF]"
                    }`}
                  >
                    {l.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
