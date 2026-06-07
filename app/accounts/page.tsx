import MarketplacePage from "@/components/MarketplacePage";

export default function AccountsPage() {
  return (
    <MarketplacePage
      category="accounts"
      title="Brawl Stars Accounts"
      subtitle="Browse account listings and submit a purchase request for admin review. No passwords or recovery details should be shared through the site."
      searchPlaceholder="Search accounts by rank, trophies, brawlers, skins..."
    />
  );
}