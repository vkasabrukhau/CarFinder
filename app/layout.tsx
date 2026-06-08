import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AnimatedLayout from "@/components/AnimatedLayout";
import NavBar from "@/components/NavBar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Finder",
  description: "Find, compare, and track your next car purchase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <NavBar />
        <ClerkProvider>
          <AnimatedLayout>{children}</AnimatedLayout>
        </ClerkProvider>
      </body>
    </html>
  );
}
