import { Suspense } from "react";
import MarketplacePage from "@/components/MarketplacePage";

export default function AccountsPage() {
  return (
    <Suspense fallback={<LoadingPage title="Accounts" />}>
      <MarketplacePage
        category="accounts"
        title="Accounts"
        subtitle="Browse available account listings for the selected game."
        searchPlaceholder="Search accounts..."
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