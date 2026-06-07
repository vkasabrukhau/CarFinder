"use client";

import { useAuth } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RootPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <main className="p-6">
        <h1 className="text-3xl font-semibold">Home Page</h1>
        <p className="mt-2 text-muted-foreground">
          Your personalized overview for searches, saved cars, and alerts.
        </p>

        <section className="mt-6 grid grid-cols-1 gap-4 md:min-h-130 md:grid-cols-3">
          <Card className="h-full md:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">Primary Workspace</CardTitle>
              <CardDescription>
                Big container for featured listings, AI recommendations, or
                market insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-full min-h-55 rounded-lg border border-dashed border-border/60 bg-muted/20" />
            </CardContent>
          </Card>

          <div className="grid h-full grid-cols-1 gap-4 md:grid-rows-3">
            <Card className="h-full md:row-span-2">
              <CardHeader>
                <CardTitle>Secondary Panel</CardTitle>
                <CardDescription>
                  This card takes two-thirds of the right column height.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="h-full min-h-35 rounded-lg border border-dashed border-border/60 bg-muted/20" />
              </CardContent>
            </Card>

            <Card className="h-full md:row-span-1">
              <CardHeader>
                <CardTitle>Tertiary Panel</CardTitle>
                <CardDescription>
                  Compact panel occupying one-third of the right column height.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>
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
