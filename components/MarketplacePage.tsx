"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type ProductCategory = "accounts" | "pins" | "offers" | "market";

type GameRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  tag_label: string | null;
  tag_placeholder: string | null;
  image_url?: string | null;
  badge?: string | null;
  sort_order?: number | null;
  is_active: boolean;
};

type CategoryRow = {
  id: string;
  game_slug: string;
  slug: ProductCategory | string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  instructions_title?: string | null;
  instructions_body?: string | null;
  required_information?: string | null;
  delivery_time?: string | null;
  top_up_method?: string | null;
  applicable_server?: string | null;
};

type Product = {
  id: string;
  game: string | null;
  category: ProductCategory;
  title: string;
  description: string | null;
  price: number | null;
  tags: string[] | null;
  image_url: string | null;
  video_url: string | null;
  rank_icon_url: string | null;
  delivery_time: string | null;
  is_active: boolean | null;
  created_at?: string;
};

type MarketplacePageProps = {
  category: ProductCategory;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
};

const popularSearches: Record<ProductCategory, string[]> = {
  accounts: [
    "100K",
    "Masters",
    "Pro Rank",
    "All Brawlers",
    "Prestige",
    "Legendary",
    "50K",
    "Max",
  ],
  pins: [
    "Exclusive",
    "Rare",
    "Collector",
    "Bundle",
    "Limited",
    "Cosmetic",
    "Pin Pack",
  ],
  offers: [
    "Rank Boost",
    "Coaching",
    "Bundle",
    "Limited",
    "Discount",
    "Starter",
    "Limited Offer",
  ],
  market: [
    "Diamonds",
    "Top-Up",
    "Bundle",
    "Recharge",
    "Membership",
    "Weekly Pass",
    "Monthly Pass",
  ],
};

const categoryLabels: Record<ProductCategory, string> = {
  accounts: "Account Purchase",
  pins: "Exclusive Pins",
  offers: "Special Offer",
  market: "Top-Up Purchase",
};

const categoryIcons: Record<ProductCategory, string> = {
  accounts: "🎮",
  pins: "📌",
  offers: "🔥",
  market: "💎",
};

const addListingLabels: Record<ProductCategory, string> = {
  accounts: "Add Account Listing",
  pins: "Add Pin Listing",
  offers: "Add Offer Listing",
  market: "Add Top-Up Item",
};

const marketTypes = [
  "All",
  "Diamonds",
  "Top-Up",
  "Bundle",
  "Membership",
  "Weekly Pass",
  "Monthly Pass",
];

function gameHref(path: string, gameSlug: string) {
  return `${path}?game=${encodeURIComponent(gameSlug)}`;
}

function productManagerHref(category: ProductCategory, gameSlug: string) {
  return `/admin/products?category=${category}&game=${encodeURIComponent(
    gameSlug
  )}`;
}

function buildWhatsAppUrl(product: Product, gameLabel: string) {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "65YOURNUMBER";

  const message = encodeURIComponent(
    `Hi, I want to buy this from Booster Lounge:\n\nGame: ${gameLabel}\nProduct: ${
      product.title
    }\nPrice: SGD${Number(product.price ?? 0).toFixed(
      2
    )}\n\nIs it still available?`
  );

  return `https://wa.me/${phone}?text=${message}`;
}

function displayCategoryName(category: ProductCategory, categoryInfo?: CategoryRow) {
  if (categoryInfo?.name) return categoryInfo.name;
  if (category === "market") return "Top-Up";
  if (category === "accounts") return "Accounts";
  if (category === "offers") return "Offers";
  if (category === "pins") return "Pins";
  return category;
}

export default function MarketplacePage({
  category,
  title,
  subtitle,
  searchPlaceholder,
}: MarketplacePageProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedGameSlug = searchParams.get("game") || "brawl_stars";

  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryRow | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [marketTypeFilter, setMarketTypeFilter] = useState("All");

  const selectedGameSlug = selectedGame?.slug || requestedGameSlug;
  const selectedGameName = selectedGame?.name || "Selected Game";
  const selectedGameDescription =
    selectedGame?.description || "Browse listings for this game.";
  const categoryAllowed = Boolean(categoryInfo);

  useEffect(() => {
    loadMarketplace();
  }, [requestedGameSlug, category]);

  async function loadMarketplace() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    } else {
      setIsAdmin(false);
    }

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (gameError) {
      setErrorMessage(gameError.message);
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadedGames = (gameData ?? []) as GameRow[];
    setGames(loadedGames);

    const matchedGame =
      loadedGames.find((game) => game.slug === requestedGameSlug) ??
      loadedGames.find((game) => game.slug === "brawl_stars") ??
      loadedGames[0] ??
      null;

    setSelectedGame(matchedGame);

    if (!matchedGame) {
      setCategories([]);
      setCategoryInfo(null);
      setProducts([]);
      setErrorMessage("No active games found.");
      setLoading(false);
      return;
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("game_categories")
      .select("*")
      .eq("game_slug", matchedGame.slug)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (categoryError) {
      setErrorMessage(categoryError.message);
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadedCategories = (categoryData ?? []) as CategoryRow[];
    setCategories(loadedCategories);

    const matchedCategory =
      loadedCategories.find((item) => item.slug === category) ?? null;

    setCategoryInfo(matchedCategory);

    if (!matchedCategory) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("game", matchedGame.slug)
      .eq("category", category)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (productError) {
      setErrorMessage(productError.message);
      setProducts([]);
      setLoading(false);
      return;
    }

    setProducts((productData ?? []) as Product[]);
    setLoading(false);
  }

  function matchesPrice(product: Product) {
    const price = Number(product.price ?? 0);

    if (quickPrice === "0-70") return price >= 0 && price <= 70;
    if (quickPrice === "70-200") return price > 70 && price <= 200;
    if (quickPrice === "200-400") return price > 200 && price <= 400;
    if (quickPrice === "400+") return price > 400;

    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;

    if (min !== null && price < min) return false;
    if (max !== null && price > max) return false;

    return true;
  }

  function matchesMarketType(product: Product) {
    if (category !== "market") return true;
    if (marketTypeFilter === "All") return true;

    const tags = product.tags ?? [];

    return tags.some(
      (tag) => tag.toLowerCase() === marketTypeFilter.toLowerCase()
    );
  }

  async function requestProduct(product: Product) {
    if (!selectedGame) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      alert(
        "Admins manage listings from the Product Manager. Admins cannot submit purchase requests."
      );
      router.push(productManagerHref(category, selectedGame.slug));
      return;
    }

    const categoryName = displayCategoryName(category, categoryInfo ?? undefined);

    const notes = [
      `Product Request: ${product.title}`,
      `Game: ${selectedGame.name}`,
      `Category: ${categoryName}`,
      `Price: SGD${Number(product.price ?? 0).toFixed(2)}`,
      `Delivery: ${product.delivery_time || "Manual review"}`,
      `Image URL: ${product.image_url || "N/A"}`,
      `Video URL: ${product.video_url || "N/A"}`,
      "",
      "Description:",
      product.description || "N/A",
      "",
      "Tags:",
      product.tags?.join(", ") || "None",
    ].join("\n");

    const { error } = await supabase.from("order_requests").insert({
      user_id: user.id,
      game: selectedGame.slug,
      service_type: `${selectedGame.name} ${categoryLabels[category]}`,
      current_rank: product.title,
      target_rank: `SGD${Number(product.price ?? 0).toFixed(2)}`,
      notes,
      status: "pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Request submitted. Admin will review it soon.");
    router.push("/dashboard");
  }

  const filteredProducts = products
    .filter((product) => {
      const text = [
        product.title,
        product.description,
        product.tags?.join(" "),
        product.price?.toString(),
        product.delivery_time,
        product.game,
      ]
        .join(" ")
        .toLowerCase();

      return (
        text.includes(search.toLowerCase()) &&
        matchesPrice(product) &&
        matchesMarketType(product)
      );
    })
    .sort((a, b) => {
      if (sort === "lowest") {
        return Number(a.price ?? 0) - Number(b.price ?? 0);
      }

      if (sort === "highest") {
        return Number(b.price ?? 0) - Number(a.price ?? 0);
      }

      return 0;
    });

  const pageTitle =
    category === "market" ? "Top-Up" : displayCategoryName(category, categoryInfo ?? undefined);

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <nav className="border-b border-zinc-900 bg-[#0b0b10]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/games" className="text-2xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <Link href="/games" className="hover:text-white">
              Games
            </Link>

            <Link
              href={gameHref("/services", selectedGameSlug)}
              className="hover:text-white"
            >
              Services
            </Link>

            <Link
              href={gameHref("/accounts", selectedGameSlug)}
              className={
                category === "accounts" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Accounts
            </Link>

            {categories.some((item) => item.slug === "pins") && (
              <Link
                href={gameHref("/pins", selectedGameSlug)}
                className={
                  category === "pins" ? "text-yellow-300" : "hover:text-white"
                }
              >
                Pins
              </Link>
            )}

            <Link
              href={gameHref("/offers", selectedGameSlug)}
              className={
                category === "offers" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Offers
            </Link>

            <Link
              href={gameHref("/market", selectedGameSlug)}
              className={
                category === "market" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Top-Up
            </Link>

            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>

            {isAdmin && (
              <>
                <Link href="/admin" className="text-zinc-300 hover:text-white">
                  Orders Admin
                </Link>

                <Link
                  href={`/admin/products?category=${category}&game=${selectedGameSlug}`}
                  className="text-yellow-300 hover:text-white"
                >
                  Product Manager
                </Link>
              </>
            )}
          </div>

          <Link
            href={
              isAdmin
                ? `/admin/products?category=${category}&game=${selectedGameSlug}`
                : "/dashboard"
            }
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            {isAdmin ? "Product Manager" : "My Dashboard"}
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.12),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.10),_transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <h2 className="text-2xl font-bold">Filters</h2>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
              <p className="text-sm text-zinc-500">Selected Game</p>
              <p className="mt-1 font-bold text-yellow-300">
                {selectedGameName}
              </p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {selectedGameDescription}
              </p>

              <Link
                href="/games"
                className="mt-4 inline-flex rounded-xl border border-yellow-400/40 px-4 py-2 text-sm font-bold text-yellow-300 hover:bg-yellow-400/10"
              >
                Change Game
              </Link>
            </div>

            {category === "market" && (
              <div className="mt-8 border-t border-zinc-800 pt-6">
                <h3 className="font-bold">Top-Up Type</h3>

                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  {marketTypes.map((type) => (
                    <FilterButton
                      key={type}
                      text={type}
                      active={marketTypeFilter === type}
                      onClick={() => setMarketTypeFilter(type)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="font-bold">Price (SGD)</h3>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <input
                  className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Min."
                  value={minPrice}
                  onChange={(e) => {
                    setMinPrice(e.target.value);
                    setQuickPrice("");
                  }}
                />

                <input
                  className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Max."
                  value={maxPrice}
                  onChange={(e) => {
                    setMaxPrice(e.target.value);
                    setQuickPrice("");
                  }}
                />
              </div>

              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <FilterButton
                  text="SGD0 - SGD70"
                  active={quickPrice === "0-70"}
                  onClick={() => setQuickPrice("0-70")}
                />

                <FilterButton
                  text="SGD70 - SGD200"
                  active={quickPrice === "70-200"}
                  onClick={() => setQuickPrice("70-200")}
                />

                <FilterButton
                  text="SGD200 - SGD400"
                  active={quickPrice === "200-400"}
                  onClick={() => setQuickPrice("200-400")}
                />

                <FilterButton
                  text="SGD400+"
                  active={quickPrice === "400+"}
                  onClick={() => setQuickPrice("400+")}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="font-bold">Search</h3>

              <input
                className="mt-4 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {(search ||
                quickPrice ||
                minPrice ||
                maxPrice ||
                marketTypeFilter !== "All") && (
                <button
                  onClick={() => {
                    setSearch("");
                    setQuickPrice("");
                    setMinPrice("");
                    setMaxPrice("");
                    setMarketTypeFilter("All");
                  }}
                  className="mt-4 w-full rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
                >
                  Clear filters
                </button>
              )}
            </div>
          </aside>

          <section>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-bold text-yellow-300">
                  {selectedGameName}
                </p>

                <h1 className="mt-2 text-4xl font-bold">
                  {category === "market" ? "Top-Up" : title || pageTitle}
                </h1>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  {categoryInfo?.description || subtitle}
                </p>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}

                {!loading && !categoryAllowed && (
                  <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
                    This category is not enabled for {selectedGameName}.
                  </div>
                )}

                {category === "market" && categoryAllowed && (
                  <div className="mt-4 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-200">
                    Top-up products can be requested through the dashboard or
                    contacted through WhatsApp. Do not submit account passwords,
                    email access, 2FA codes, or recovery details.
                  </div>
                )}

                {isAdmin && categoryAllowed && (
                  <div className="mt-4 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-200">
                    Admin mode: requests are disabled here. Use Product Manager
                    to add, edit, hide, or delete listings for {selectedGameName}.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {isAdmin && categoryAllowed && (
                  <Link
                    href={productManagerHref(category, selectedGameSlug)}
                    className="rounded-xl bg-yellow-400 px-5 py-3 text-center text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    {addListingLabels[category]}
                  </Link>
                )}

                <select
                  className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="lowest">Lowest Price</option>
                  <option value="highest">Highest Price</option>
                </select>
              </div>
            </div>

            {categoryAllowed && (
              <>
                <div className="mt-8">
                  <input
                    className="w-full max-w-xl rounded-xl bg-zinc-800 p-4 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder={searchPlaceholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="mr-1 text-sm font-semibold text-zinc-300">
                    Popular searches:
                  </span>

                  {popularSearches[category].map((item) => (
                    <button
                      key={item}
                      onClick={() => setSearch(item)}
                      className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <p className="mt-8 text-sm text-zinc-500">
                  {loading
                    ? "Loading listings..."
                    : `${filteredProducts.length} item(s) found`}
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={category}
                      gameLabel={selectedGameName}
                      isAdmin={isAdmin}
                      selectedGameSlug={selectedGameSlug}
                      onOpen={() => setSelectedProduct(product)}
                      onRequest={() => requestProduct(product)}
                    />
                  ))}

                  {!loading && filteredProducts.length === 0 && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-400">
                      <p>No listings found for {selectedGameName}.</p>

                      {isAdmin && (
                        <Link
                          href={productManagerHref(category, selectedGameSlug)}
                          className="mt-4 inline-flex rounded-xl bg-yellow-400 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-300"
                        >
                          {addListingLabels[category]}
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {category === "market" && (
                  <TopUpInstructions
                    gameName={selectedGameName}
                    categoryInfo={categoryInfo}
                  />
                )}
              </>
            )}
          </section>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          category={category}
          gameLabel={selectedGameName}
          selectedGameSlug={selectedGameSlug}
          isAdmin={isAdmin}
          onClose={() => setSelectedProduct(null)}
          onRequest={() => requestProduct(selectedProduct)}
        />
      )}
    </main>
  );
}

function ProductCard({
  product,
  category,
  gameLabel,
  isAdmin,
  selectedGameSlug,
  onOpen,
  onRequest,
}: {
  product: Product;
  category: ProductCategory;
  gameLabel: string;
  isAdmin: boolean;
  selectedGameSlug: string;
  onOpen: () => void;
  onRequest: () => void;
}) {
  const whatsappUrl = buildWhatsAppUrl(product, gameLabel);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90">
      <button
        type="button"
        onClick={onOpen}
        className="relative block h-52 w-full bg-zinc-950 text-left"
      >
        {product.video_url ? (
          <video
            src={product.video_url}
            className="h-full w-full object-cover"
            muted
          />
        ) : product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            {categoryIcons[category]}
          </div>
        )}

        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
          View details
        </div>

        {category !== "accounts" &&
          category !== "market" &&
          product.rank_icon_url && (
            <img
              src={product.rank_icon_url}
              alt="Icon"
              className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-950 object-cover p-1"
            />
          )}
      </button>

      <div className="p-5">
        <div className="flex justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-yellow-300">{gameLabel}</p>
            <h3 className="mt-1 font-bold leading-6">{product.title}</h3>

            <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
              {product.description || "No description provided."}
            </p>
          </div>

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-2xl">
            {categoryIcons[category]}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(product.tags ?? []).slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs text-zinc-500">
              {product.delivery_time || "Manual review"}
            </p>

            <p className="mt-1 text-2xl font-bold text-yellow-300">
              SGD{Number(product.price ?? 0).toFixed(2)}
            </p>
          </div>

          {isAdmin ? (
            <div className="flex flex-col gap-2">
              <Link
                href={productManagerHref(category, selectedGameSlug)}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-center text-sm font-bold text-white hover:bg-zinc-700"
              >
                Manage
              </Link>

              <Link
                href={productManagerHref(category, selectedGameSlug)}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-center text-sm font-bold text-black hover:bg-yellow-300"
              >
                Add
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={onOpen}
                className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
              >
                Details
              </button>

              <button
                onClick={onRequest}
                className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
              >
                Request
              </button>

              {category === "market" && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-green-500 px-4 py-2 text-center text-sm font-bold text-black hover:bg-green-400"
                >
                  WhatsApp
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductDetailsModal({
  product,
  category,
  gameLabel,
  selectedGameSlug,
  isAdmin,
  onClose,
  onRequest,
}: {
  product: Product;
  category: ProductCategory;
  gameLabel: string;
  selectedGameSlug: string;
  isAdmin: boolean;
  onClose: () => void;
  onRequest: () => void;
}) {
  const whatsappUrl = buildWhatsAppUrl(product, gameLabel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 p-5">
          <div>
            <p className="text-sm text-zinc-500">
              {gameLabel} • {categoryLabels[category]}
            </p>
            <h2 className="text-2xl font-bold">{product.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Close
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
              {product.video_url ? (
                <video
                  src={product.video_url}
                  className="max-h-[520px] w-full object-contain"
                  controls
                />
              ) : product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="max-h-[520px] w-full object-contain"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-7xl">
                  {categoryIcons[category]}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <div className="rounded-xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Game</p>
              <p className="mt-1 font-semibold text-yellow-300">{gameLabel}</p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-400">Price</p>
              <p className="text-3xl font-bold text-yellow-300">
                SGD{Number(product.price ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="mt-5 rounded-xl bg-zinc-950 p-4">
              <p className="text-sm text-zinc-500">Delivery / Collection</p>
              <p className="mt-1 font-semibold">
                {product.delivery_time || "Manual review"}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-zinc-300">
                Full Description
              </p>

              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">
                {product.description || "No description provided."}
              </p>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-zinc-300">Tags</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(product.tags ?? []).length > 0 ? (
                  product.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No tags.</p>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {isAdmin ? (
                <Link
                  href={productManagerHref(category, selectedGameSlug)}
                  className="rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-bold text-black hover:bg-yellow-300"
                >
                  Manage This Listing
                </Link>
              ) : (
                <>
                  <button
                    onClick={onRequest}
                    className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    Request Purchase
                  </button>

                  {category === "market" && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-green-500 px-4 py-3 text-center text-sm font-bold text-black hover:bg-green-400"
                    >
                      Contact on WhatsApp
                    </a>
                  )}
                </>
              )}

              <button
                onClick={onClose}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
              >
                Back to Listings
              </button>
            </div>

            <p className="mt-5 text-xs leading-5 text-zinc-500">
              Do not share account passwords, email passwords, 2FA codes, or
              recovery details through the site.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopUpInstructions({
  gameName,
  categoryInfo,
}: {
  gameName: string;
  categoryInfo: CategoryRow | null;
}) {
  const title = categoryInfo?.instructions_title || `${gameName} Top-Up Instructions`;

  const body =
    categoryInfo?.instructions_body ||
    `Enter the required account information correctly before submitting your top-up request. Admin will review and process it after confirmation.`;

  return (
    <section className="mt-12 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-2xl font-black">Top-up instructions</h2>

      <p className="mt-5 text-sm leading-7 text-zinc-300">
        <span className="font-bold text-red-300">{body}</span>
      </p>

      <h3 className="mt-8 text-xl font-bold">{title}</h3>

      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800">
        <InstructionRow
          label="Applicable Platform"
          value="Mobile game"
          muted={false}
        />

        <InstructionRow
          label="Applicable Server"
          value={categoryInfo?.applicable_server || "Global / Manual review"}
          muted
        />

        <InstructionRow
          label="Top-Up Method"
          value={categoryInfo?.top_up_method || "Manual Top-Up"}
          muted={false}
        />

        <InstructionRow
          label="Required Information"
          value={categoryInfo?.required_information || "Player ID / User ID"}
          highlight
          muted
        />

        <InstructionRow
          label="Delivery Time"
          value={categoryInfo?.delivery_time || "Manual review"}
          muted={false}
        />
      </div>

      <div className="mt-8">
        <p className="text-lg font-bold text-red-300">Note:</p>

        <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm leading-7 text-zinc-400">
          <li>
            Please accurately fill in the required information to avoid mistakes
            in your purchase.
          </li>
          <li>
            Wrong player ID, server ID, UID, or tag may delay or fail the top-up.
          </li>
          <li>
            Never provide passwords, email access, 2FA codes, or recovery
            details.
          </li>
        </ol>
      </div>
    </section>
  );
}

function InstructionRow({
  label,
  value,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 border-b border-zinc-800 last:border-b-0 md:grid-cols-2 ${
        muted ? "bg-zinc-900/60" : "bg-zinc-950"
      }`}
    >
      <div className="border-r border-zinc-800 px-4 py-4 font-bold text-zinc-100">
        {label}
      </div>

      <div
        className={`px-4 py-4 ${
          highlight ? "font-bold text-red-300" : "text-zinc-300"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FilterButton({
  text,
  active,
  onClick,
}: {
  text: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 text-left"
    >
      <span
        className={`h-4 w-4 rounded-full border-2 ${
          active ? "border-yellow-400 bg-yellow-400" : "border-white"
        }`}
      />

      <span className={active ? "text-yellow-300" : "text-zinc-300"}>
        {text}
      </span>
    </button>
  );
}