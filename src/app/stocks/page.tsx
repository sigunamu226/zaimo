import { fetchStocks } from "@/repositories/server/stocks";
import { StockTable } from "@/components/stocks/StockTable";
import { StockHeader } from "@/components/stocks/StockHeader";

export default async function Page() {
  const stocks = await fetchStocks();

  return (
    <main className="relative z-10 p-6 max-w-6xl mx-auto">
      <StockHeader />

      <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl p-6">
        <StockTable stocks={stocks} />
      </div>
    </main>
  );
}
