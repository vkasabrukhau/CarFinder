export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Home</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back — here is your dashboard with recent searches and saved
        cars.
      </p>

      <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          Recent searches (placeholder)
        </div>
        <div className="p-4 border rounded-lg">Saved cars (placeholder)</div>
      </section>
    </main>
  );
}
