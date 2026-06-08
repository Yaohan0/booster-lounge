"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type ProductCategory = "accounts" | "pins" | "offers";

type Product = {
  id: string;
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
    "Pins",
    "Starter",
  ],
};

const categoryLabels: Record<ProductCategory, string> = {
  accounts: "Account Purchase",
  pins: "Exclusive Pins",
  offers: "Special Offer",
};

const categoryIcons: Record<ProductCategory, string> = {
  accounts: "🎮",
  pins: "📌",
  offers: "🔥",
};

export default function MarketplacePage({
  category,
  title,
  subtitle,
  searchPlaceholder,
}: MarketplacePageProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [quickPrice, setQuickPrice] = useState("");

  useEffect(() => {
    async function loadMarketplace() {
      setLoading(true);

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

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setProducts((data ?? []) as Product[]);
      setLoading(false);
    }

    loadMarketplace();
  }, [category, supabase]);

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

  async function requestProduct(product: Product) {
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
      alert("Admins manage listings from the admin panel. Admins cannot submit purchase requests.");
      router.push("/admin");
      return;
    }

    const notes = [
      `Product Request: ${product.title}`,
      `Category: ${category}`,
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
      service_type: categoryLabels[category],
      current_rank: product.title,
      target_rank: `SGD${Number(product.price ?? 0).toFixed(2)}`,
      notes,
      status: "pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Request submitted. Admin will review this listing soon.");
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
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase()) && matchesPrice(product);
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

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <nav className="border-b border-zinc-900 bg-[#0b0b10]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <Link href="/services" className="hover:text-white">
              Services
            </Link>

            <Link
              href="/accounts"
              className={
                category === "accounts" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Accounts
            </Link>

            <Link
              href="/pins"
              className={
                category === "pins" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Pins
            </Link>

            <Link
              href="/offers"
              className={
                category === "offers" ? "text-yellow-300" : "hover:text-white"
              }
            >
              Offers
            </Link>

            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>

            {isAdmin && (
              <Link href="/admin" className="text-yellow-300 hover:text-white">
                Admin
              </Link>
            )}
          </div>

          <Link
            href={isAdmin ? "/admin" : "/dashboard"}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            {isAdmin ? "Admin Panel" : "My Dashboard"}
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.12),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.10),_transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
            <h2 className="text-2xl font-bold">Filters</h2>

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
              <h3 className="font-bold">Delivery Time</h3>

              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <FilterButton
                  text="Manual review"
                  active={search === "Manual review"}
                  onClick={() => setSearch("Manual review")}
                />

                <FilterButton
                  text="Instant after approval"
                  active={search === "Instant after approval"}
                  onClick={() => setSearch("Instant after approval")}
                />

                <FilterButton
                  text="1 day"
                  active={search === "1 day"}
                  onClick={() => setSearch("1 day")}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="font-bold">
                {category === "accounts"
                  ? "Rank / Account"
                  : category === "pins"
                  ? "Pin Type"
                  : "Offer Type"}
              </h3>

              <input
                className="mt-4 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder={
                  category === "accounts"
                    ? "Search rank/account"
                    : category === "pins"
                    ? "Search pin"
                    : "Search offer"
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {(search || quickPrice || minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setQuickPrice("");
                    setMinPrice("");
                    setMaxPrice("");
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
                <h1 className="text-4xl font-bold">{title}</h1>
                <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>

                {isAdmin && (
                  <div className="mt-4 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-200">
                    Admin mode: marketplace requests are disabled. Use the admin panel to add,
                    edit, hide, or delete listings.
                  </div>
                )}
              </div>

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
                  isAdmin={isAdmin}
                  onRequest={() => requestProduct(product)}
                />
              ))}

              {!loading && filteredProducts.length === 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-400">
                  No listings found.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ProductCard({
  product,
  category,
  isAdmin,
  onRequest,
}: {
  product: Product;
  category: ProductCategory;
  isAdmin: boolean;
  onRequest: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/90">
      <div className="relative h-44 bg-zinc-950">
        {product.video_url ? (
          <video
            src={product.video_url}
            className="h-full w-full object-cover"
            controls
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

        {category !== "accounts" && product.rank_icon_url && (
          <img
            src={product.rank_icon_url}
            alt="Icon"
            className="absolute bottom-3 left-3 h-12 w-12 rounded-xl border border-zinc-700 bg-zinc-950 object-cover p-1"
          />
        )}
      </div>

      <div className="p-5">
        <div className="flex justify-between gap-4">
          <div>
            <h3 className="font-bold leading-6">{product.title}</h3>

            <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
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
            <Link
              href="/admin"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
            >
              Manage
            </Link>
          ) : (
            <button
              onClick={onRequest}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Request
            </button>
          )}
        </div>
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