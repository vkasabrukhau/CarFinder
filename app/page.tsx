"use client";

import { useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { GripVertical } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const savingsRows = [
  { atTime: "$7,600", pay: "$850", result: "$8,450", date: "Jan 8, 2026" },
  { atTime: "$8,450", pay: "$850", result: "$9,300", date: "Feb 8, 2026" },
  { atTime: "$9,300", pay: "$850", result: "$10,150", date: "Mar 8, 2026" },
  { atTime: "$10,150", pay: "$850", result: "$11,000", date: "Apr 8, 2026" },
  { atTime: "$11,000", pay: "$850", result: "$11,850", date: "May 8, 2026" },
  { atTime: "$11,850", pay: "$850", result: "$12,700", date: "Jun 8, 2026" },
  { atTime: "$12,700", pay: "$850", result: "$13,550", date: "Jul 8, 2026" },
  { atTime: "$13,550", pay: "$850", result: "$14,400", date: "Aug 8, 2026" },
  { atTime: "$14,400", pay: "$850", result: "$15,250", date: "Sep 8, 2026" },
  { atTime: "$15,250", pay: "$850", result: "$16,100", date: "Oct 8, 2026" },
  { atTime: "$16,100", pay: "$850", result: "$16,950", date: "Nov 8, 2026" },
  { atTime: "$16,950", pay: "$850", result: "$17,800", date: "Dec 8, 2026" },
  { atTime: "$17,800", pay: "$850", result: "$18,650", date: "Jan 8, 2027" },
];

const prospectiveStats = [
  { label: "Cars", value: "148" },
  { label: "Added", value: "32" },
  { label: "Sold", value: "18" },
  { label: "Matches", value: "41" },
  { label: "Got Away", value: "9" },
  { label: "Models", value: "22" },
  { label: "Miles", value: "18,420" },
];

const prospectTableRows = [
  {
    searchId: "honda-civic",
    model: "Honda Civic",
    lowEnd: "$18,500",
    highEnd: "$23,900",
    avg: "$21,200",
    toReview: "12",
    tracking: "Active",
    available: "84",
    preference: "#1",
    turnover: "4.2%",
  },
  {
    searchId: "toyota-camry",
    model: "Toyota Camry",
    lowEnd: "$21,000",
    highEnd: "$28,600",
    avg: "$24,750",
    toReview: "8",
    tracking: "Active",
    available: "67",
    preference: "#2",
    turnover: "3.8%",
  },
  {
    searchId: "mazda-cx-5",
    model: "Mazda CX-5",
    lowEnd: "$24,300",
    highEnd: "$32,100",
    avg: "$28,100",
    toReview: "5",
    tracking: "Watch",
    available: "41",
    preference: "#3",
    turnover: "2.9%",
  },
  {
    searchId: "subaru-outback",
    model: "Subaru Outback",
    lowEnd: "$26,900",
    highEnd: "$35,750",
    avg: "$30,800",
    toReview: "11",
    tracking: "Active",
    available: "38",
    preference: "#4",
    turnover: "3.1%",
  },
  {
    searchId: "vw-jetta",
    model: "VW Jetta",
    lowEnd: "$19,800",
    highEnd: "$26,400",
    avg: "$22,900",
    toReview: "6",
    tracking: "Watch",
    available: "29",
    preference: "#5",
    turnover: "2.4%",
  },
  {
    searchId: "hyundai-elantra",
    model: "Hyundai Elantra",
    lowEnd: "$17,200",
    highEnd: "$22,500",
    avg: "$19,800",
    toReview: "9",
    tracking: "Active",
    available: "53",
    preference: "#6",
    turnover: "5.1%",
  },
  {
    searchId: "nissan-altima",
    model: "Nissan Altima",
    lowEnd: "$20,400",
    highEnd: "$27,100",
    avg: "$23,600",
    toReview: "4",
    tracking: "Paused",
    available: "44",
    preference: "#7",
    turnover: "3.3%",
  },
  {
    searchId: "kia-forte",
    model: "Kia Forte",
    lowEnd: "$16,900",
    highEnd: "$21,300",
    avg: "$18,900",
    toReview: "7",
    tracking: "Active",
    available: "31",
    preference: "#8",
    turnover: "4.7%",
  },
  {
    searchId: "toyota-corolla",
    model: "Toyota Corolla",
    lowEnd: "$19,200",
    highEnd: "$25,800",
    avg: "$22,400",
    toReview: "10",
    tracking: "Active",
    available: "72",
    preference: "#9",
    turnover: "4.0%",
  },
  {
    searchId: "honda-accord",
    model: "Honda Accord",
    lowEnd: "$23,100",
    highEnd: "$30,400",
    avg: "$26,700",
    toReview: "3",
    tracking: "Watch",
    available: "55",
    preference: "#10",
    turnover: "2.6%",
  },
  {
    searchId: "mazda-3",
    model: "Mazda 3",
    lowEnd: "$20,500",
    highEnd: "$27,200",
    avg: "$23,800",
    toReview: "6",
    tracking: "Active",
    available: "36",
    preference: "#11",
    turnover: "3.5%",
  },
  {
    searchId: "subaru-impreza",
    model: "Subaru Impreza",
    lowEnd: "$21,700",
    highEnd: "$28,900",
    avg: "$25,100",
    toReview: "4",
    tracking: "Watch",
    available: "27",
    preference: "#12",
    turnover: "2.2%",
  },
  {
    searchId: "hyundai-sonata",
    model: "Hyundai Sonata",
    lowEnd: "$22,300",
    highEnd: "$29,700",
    avg: "$25,900",
    toReview: "5",
    tracking: "Paused",
    available: "48",
    preference: "#13",
    turnover: "1.8%",
  },
  {
    searchId: "chevrolet-malibu",
    model: "Chevrolet Malibu",
    lowEnd: "$18,800",
    highEnd: "$24,500",
    avg: "$21,500",
    toReview: "2",
    tracking: "Paused",
    available: "22",
    preference: "#14",
    turnover: "1.5%",
  },
  {
    searchId: "ford-fusion",
    model: "Ford Fusion",
    lowEnd: "$17,400",
    highEnd: "$23,100",
    avg: "$20,100",
    toReview: "8",
    tracking: "Active",
    available: "19",
    preference: "#15",
    turnover: "3.9%",
  },
];

const PROSPECT_PAGE_SIZE = 12;
const SAVINGS_PAGE_SIZE = 6;

function usePagination(totalItems: number, pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return { page, setPage, totalPages, start, end };
}

function TablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const visiblePages = pages.filter((p) => {
    if (totalPages <= 5) return true;
    return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
  });

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          />
        </PaginationItem>

        {visiblePages.map((p, i) => {
          const prev = visiblePages[i - 1];
          const showEllipsisBefore = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsisBefore && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  isActive={p === page}
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            </span>
          );
        })}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default function RootPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const username = user?.username ?? user?.id ?? "me";

  const [prospectRows, setProspectRows] = useState(prospectTableRows);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragFromRef = useRef<number | null>(null);

  const prospect = usePagination(prospectRows.length, PROSPECT_PAGE_SIZE);
  const savings = usePagination(savingsRows.length, SAVINGS_PAGE_SIZE);

  function handleDragStart(pageIndex: number) {
    dragFromRef.current = pageIndex;
  }

  function handleDragOver(e: React.DragEvent, pageIndex: number) {
    e.preventDefault();
    setDragOverIndex(pageIndex);
  }

  function handleDrop(pageIndex: number) {
    const from = dragFromRef.current;
    if (from === null || from === pageIndex) {
      setDragOverIndex(null);
      return;
    }
    const globalFrom = prospect.start + from;
    const globalTo = prospect.start + pageIndex;
    const next = [...prospectRows];
    const [moved] = next.splice(globalFrom, 1);
    next.splice(globalTo, 0, moved);
    setProspectRows(next);
    dragFromRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragFromRef.current = null;
    setDragOverIndex(null);
  }

  if (!isLoaded) return null;

  if (isSignedIn) {
    const prospectPage = prospectRows.slice(prospect.start, prospect.end);
    const savingsPage = savingsRows.slice(savings.start, savings.end);

    return (
      <main className="p-6">
        <section className="grid grid-cols-1 gap-4 md:h-[calc(100dvh-6.5rem)] md:min-h-130 md:grid-cols-3 md:items-stretch">
          <Card className="h-full md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">
                Prospective Car Postings
              </CardTitle>
              <CardDescription>
                Big container for featured listings, AI recommendations, or
                market insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-4 p-4 md:p-6">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-7">
                    {prospectiveStats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-end justify-start gap-1 whitespace-nowrap"
                      >
                        <span className="text-2xl font-semibold leading-none tabular-nums">
                          {stat.value}
                        </span>
                        <span className="pb-0.5 text-xs leading-tight text-muted-foreground">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>Model</TableHead>
                          <TableHead>Low End</TableHead>
                          <TableHead>High End</TableHead>
                          <TableHead>Avg</TableHead>
                          <TableHead>To Review</TableHead>
                          <TableHead>Tracking</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Preference #</TableHead>
                          <TableHead>Turnover</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prospectPage.map((row, i) => (
                          <TableRow
                            key={row.model}
                            draggable
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={() => handleDrop(i)}
                            onDragEnd={handleDragEnd}
                            onClick={() =>
                              router.push(`/${username}/${row.searchId}`)
                            }
                            className={`cursor-pointer ${dragOverIndex === i ? "bg-accent" : ""}`}
                          >
                            <TableCell
                              className="w-8 px-2 cursor-grab active:cursor-grabbing"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                            <TableCell className="font-medium">
                              {row.model}
                            </TableCell>
                            <TableCell>{row.lowEnd}</TableCell>
                            <TableCell>{row.highEnd}</TableCell>
                            <TableCell>{row.avg}</TableCell>
                            <TableCell>{row.toReview}</TableCell>
                            <TableCell>{row.tracking}</TableCell>
                            <TableCell>{row.available}</TableCell>
                            <TableCell>{row.preference}</TableCell>
                            <TableCell>{row.turnover}</TableCell>
                          </TableRow>
                        ))}
                        {Array.from({
                          length: PROSPECT_PAGE_SIZE - prospectPage.length,
                        }).map((_, i) => (
                          <TableRow
                            key={`filler-${i}`}
                            aria-hidden
                            className="invisible pointer-events-none"
                          >
                            <TableCell>&nbsp;</TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                            <TableCell />
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <TablePagination
                      page={prospect.page}
                      totalPages={prospect.totalPages}
                      onPageChange={prospect.setPage}
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <div className="grid h-full grid-cols-1 gap-4 md:grid-rows-3">
            <Card className="h-full md:row-span-2">
              <CardHeader>
                <CardTitle>Savings Projections</CardTitle>
                <CardDescription>
                  Progress tracking towards your goal with a thorough timeline.
                  Everything shown is post immediate tax deductions.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex items-end gap-1.5 leading-none">
                  <span className="text-3xl font-semibold tabular-nums text-muted-foreground">
                    $12,250
                  </span>
                  <span className="pb-0.5 text-xl text-muted-foreground">
                    /
                  </span>
                  <span className="text-3xl font-semibold tabular-nums">
                    $18,000
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <Progress value={68} />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>68% achieved</span>
                    <span>ETA: 5 months</span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>At time</TableHead>
                        <TableHead>Pay</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {savingsPage.map((row) => (
                        <TableRow key={`${row.date}-${row.result}`}>
                          <TableCell className="font-medium tabular-nums">
                            {row.atTime}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                            {row.pay}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {row.result}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.date}
                          </TableCell>
                        </TableRow>
                      ))}
                      {Array.from({
                        length: SAVINGS_PAGE_SIZE - savingsPage.length,
                      }).map((_, i) => (
                        <TableRow
                          key={`filler-${i}`}
                          aria-hidden
                          className="invisible pointer-events-none"
                        >
                          <TableCell>&nbsp;</TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell />
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <TablePagination
                    page={savings.page}
                    totalPages={savings.totalPages}
                    onPageChange={savings.setPage}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="h-full md:row-span-1">
              <CardHeader>
                <CardTitle>Current Financial Tools</CardTitle>
                <CardDescription>
                  Active instruments contributing to your car fund.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-3 gap-3 h-full">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">CDs</CardTitle>
                      <CardDescription>Certificate of Deposit</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold tabular-nums">
                        $4,200
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        4.85% APY · matures Aug 2026
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Bonds</CardTitle>
                      <CardDescription>US Treasury / I-Bond</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold tabular-nums">
                        $3,050
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        4.30% yield · 2-yr note
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Stocks</CardTitle>
                      <CardDescription>Liquid equity holdings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-semibold tabular-nums">
                        $5,000
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        +6.2% YTD · 3 positions
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Car Finder</h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to start tracking, comparing, and finding your next car.
      </p>
    </main>
  );
}
