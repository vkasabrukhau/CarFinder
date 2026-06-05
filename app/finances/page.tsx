export default function FinancesPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-semibold">Finances</h1>
      <p className="mt-2 text-muted-foreground">
        Track payments, loans, and estimated monthly costs. (Placeholder)
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          Loan calculator (placeholder)
        </div>
        <div className="p-4 border rounded-lg">
          Payment schedule (placeholder)
        </div>
      </div>
    </main>
  );
}
