import { Suspense } from "react";
import MarketplacePage from "@/components/MarketplacePage";

export default function PinsPage() {
  return (
    <Suspense fallback={<LoadingPage title="Pins" />}>
      <MarketplacePage
        category="pins"
        title="Pins"
        subtitle="Browse exclusive pin listings for the selected game."
        searchPlaceholder="Search pins..."
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