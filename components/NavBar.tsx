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
          <Menubar links={links} />
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="group inline-flex items-center justify-center rounded-[10px] border border-[#4E4E4E] bg-[#383838] px-3 py-2 text-sm font-medium text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-[#4a4a4a] hover:text-white hover:shadow-lg">
                <Menu className="mr-2 size-4 text-white transition-transform duration-300 ease-out" />
                Menu
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border border-[#4E4E4E] bg-[#383838] text-foreground shadow-lg transition-[opacity,transform] duration-300 ease-out data-closed:translate-y-1 data-open:translate-y-0 data-closed:opacity-0 data-open:opacity-100">
                {links.map((l) => {
                  const active =
                    l.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(l.href);

                  return (
                    <DropdownMenuItem
                      key={l.href}
                      onClick={() => router.push(l.href)}
                      className={`rounded-[10px] px-3 py-2 text-sm font-medium transition-all duration-300 ease-out ${
                        active
                          ? "bg-[#FFFFFF] text-black font-heading tracking-[0.08em] shadow-sm scale-[1.02]"
                          : "bg-transparent text-white/90 hover:bg-[#4a4a4a] hover:text-[#FFFFFF] hover:translate-x-1"
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
      </div>
    </nav>
  );
}
