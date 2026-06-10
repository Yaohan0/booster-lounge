import { Suspense } from "react";
import MarketplacePage from "@/components/MarketplacePage";

export default function OffersPage() {
  return (
    <Suspense fallback={<LoadingPage title="Offers" />}>
      <MarketplacePage
        category="offers"
        title="Offers"
        subtitle="Browse bundles, promotions, and special deals for the selected game."
        searchPlaceholder="Search offers..."
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