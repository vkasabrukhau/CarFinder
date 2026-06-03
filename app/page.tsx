"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { ArrowRight, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,250,250,1))] text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-border/70 bg-background/80 px-4 py-3 shadow-sm backdrop-blur">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-muted-foreground">
              Car Finder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get started</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <div className="flex items-center gap-3 rounded-full border border-border/70 bg-muted/40 px-3 py-1.5">
                <span className="text-sm text-muted-foreground">Account</span>
                <UserButton afterSignOutUrl="/" />
              </div>
            </Show>
          </div>
        </header>

        <section className="flex flex-1 items-center py-12 lg:py-20">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
                <Sparkles className="size-4 text-primary" />
                Clerk authentication is ready
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  Sign in once, then search cars with a clean authenticated
                  experience.
                </h1>
                <p className="max-w-xl text-lg leading-8 text-muted-foreground">
                  The app now has Clerk wired into the Next.js layout, public
                  auth routes, and a visible first-run sign-in flow right on the
                  landing page.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Show when="signed-out">
                  <SignUpButton mode="modal">
                    <Button size="lg" className="gap-2">
                      Create account
                      <ArrowRight className="size-4" />
                    </Button>
                  </SignUpButton>
                  <SignInButton mode="modal">
                    <Button variant="outline" size="lg" className="gap-2">
                      Sign in
                      <ArrowRight className="size-4" />
                    </Button>
                  </SignInButton>
                </Show>
                <Show when="signed-in">
                  <Button size="lg" className="gap-2" asChild>
                    <a href="#results">
                      Browse listings
                      <Search className="size-4" />
                    </a>
                  </Button>
                </Show>
              </div>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/90 p-6 shadow-xl shadow-black/5 backdrop-blur">
              <div className="space-y-4 rounded-2xl border border-dashed border-border/80 p-6">
                <p className="text-sm font-medium text-muted-foreground">
                  Auth surface
                </p>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <span>Signed-out state</span>
                    <span className="font-medium text-primary">Visible</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <span>Sign-in / sign-up routes</span>
                    <span className="font-medium text-primary">Ready</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <span>Signed-in user menu</span>
                    <span className="font-medium text-primary">Visible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
