export default function ComparePage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Compare</h1>
      <p className="mt-2 text-muted-foreground">
        Compare up to 3 cars side-by-side. (Placeholder)
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">Car A (placeholder)</div>
        <div className="p-4 border rounded-lg">Car B (placeholder)</div>
        <div className="p-4 border rounded-lg">Car C (placeholder)</div>
      </div>
    </main>
  );
}
