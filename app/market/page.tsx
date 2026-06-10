import { Suspense } from "react";
import MarketplacePage from "@/components/MarketplacePage";

export default function MarketPage() {
  return (
    <Suspense fallback={<LoadingPage title="Market" />}>
      <MarketplacePage
        category="market"
        title="Market"
        subtitle="Browse game items, accessories, and market products for the selected game."
        searchPlaceholder="Search market products..."
      />
    </Suspense>
  );
}

function LoadingPage({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#08080b] p-8 text-white">
      Loading {title}...
    </main>
  );
}