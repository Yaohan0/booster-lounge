"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Product = {
  id: string;
  category: string;
  title: string;
  description: string | null;
  price: number | null;
  tags: string[] | null;
  image_url: string | null;
  delivery_time: string | null;
};

type MarketplacePageProps = {
  category: "accounts" | "pins";
  title: string;
  subtitle: string;
  searchPlaceholder: string;
};

const popularSearches = {
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

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

      setProducts(data ?? []);
      setLoading(false);
    }

    loadProducts();
  }, [category, supabase]);

  async function requestProduct(product: Product) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const notes = [
      `Product Request: ${product.title}`,
      `Category: ${category}`,
      `Price: SGD${Number(product.price ?? 0).toFixed(2)}`,
      `Delivery: ${product.delivery_time || "Manual review"}`,
      "",
      "Description:",
      product.description || "N/A",
      "",
      "Tags:",
      product.tags?.join(", ") || "None",
    ].join("\n");

    const { error } = await supabase.from("order_requests").insert({
      user_id: user.id,
      service_type: category === "accounts" ? "Account Purchase" : "Exclusive Pins",
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
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search.toLowerCase());
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
              Boosting
            </Link>
            <Link
              href="/accounts"
              className={category === "accounts" ? "text-yellow-300" : "hover:text-white"}
            >
              Accounts
            </Link>
            <Link
              href="/pins"
              className={category === "pins" ? "text-yellow-300" : "hover:text-white"}
            >
              Exclusive Pins
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Login
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
                  className="rounded-xl bg-zinc-800 p-3 text-sm outline-none"
                  placeholder="Min."
                />
                <input
                  className="rounded-xl bg-zinc-800 p-3 text-sm outline-none"
                  placeholder="Max."
                />
              </div>

              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <FilterText text="SGD0 - SGD70" />
                <FilterText text="SGD70 - SGD200" />
                <FilterText text="SGD200 - SGD400" />
                <FilterText text="SGD400+" />
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="font-bold">Delivery Time</h3>

              <div className="mt-5 space-y-3 text-sm text-zinc-300">
                <FilterText text="Manual review" />
                <FilterText text="Instant after approval" />
                <FilterText text="1 day" />
              </div>
            </div>

            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="font-bold">
                {category === "accounts" ? "Rank" : "Pin Type"}
              </h3>

              <input
                className="mt-4 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none"
                placeholder={category === "accounts" ? "Search rank" : "Search pin"}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </aside>

          <section>
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
              <div>
                <h1 className="text-4xl font-bold">{title}</h1>
                <p className="mt-3 max-w-2xl text-zinc-400">{subtitle}</p>
              </div>

              <select
                className="rounded-xl bg-zinc-800 p-3 text-sm outline-none"
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
  onRequest,
}: {
  product: Product;
  category: "accounts" | "pins";
  onRequest: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5">
      <div className="flex justify-between gap-4">
        <div>
          <h3 className="font-bold leading-6">{product.title}</h3>

          <p className="mt-3 line-clamp-2 text-sm text-zinc-400">
            {product.description || "No description provided."}
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-800 text-3xl">
          {category === "accounts" ? "🎮" : "📌"}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(product.tags ?? []).slice(0, 4).map((tag) => (
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

        <button
          onClick={onRequest}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
        >
          Request
        </button>
      </div>
    </div>
  );
}

function FilterText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-4 rounded-full border-2 border-white" />
      <span>{text}</span>
    </div>
  );
}