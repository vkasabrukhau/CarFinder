"use client";

import { useAuth } from "@clerk/nextjs";

export default function RootPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-semibold">Home Page</h1>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Landing Page</h1>
      <p className="mt-2 text-muted-foreground">
        Start building your page tree here.
      </p>
    </main>
  );
}
