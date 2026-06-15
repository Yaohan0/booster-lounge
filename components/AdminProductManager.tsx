"use client";

import ImageUploadField from "@/components/ImageUploadField";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  image_url: string | null;
  badge: string | null;
  sort_order: number | null;
  is_active: boolean;
};

type CategoryRow = {
  id: string;
  game_slug: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
};

type Product = {
  id: string;
  game: string | null;
  category: string;
  title: string;
  description: string | null;
  price: number | null;
  tags: string[] | null;
  image_url: string | null;
  video_url: string | null;
  rank_icon_url: string | null;
  delivery_time: string | null;
  is_active: boolean | null;
  created_at: string;
};

type ProductForm = {
  game: string;
  category: string;
  market_type: string;
  title: string;
  description: string;
  price: string;
  tags: string;
  image_url: string;
  video_url: string;
  rank_icon_url: string;
  delivery_time: string;
  is_active: boolean;
};

const emptyForm: ProductForm = {
  game: "",
  category: "",
  market_type: "Finger Sleeves",
  title: "",
  description: "",
  price: "",
  tags: "",
  image_url: "",
  video_url: "",
  rank_icon_url: "",
  delivery_time: "Manual review",
  is_active: true,
};

const marketTypes = ["In-game Items", "Finger Sleeves", "Keychains"];

const categoryIcons: Record<string, string> = {
  accounts: "🎮",
  pins: "📌",
  offers: "🔥",
  market: "🛒",
  services: "⚡",
};

function getCategoryIcon(category: string) {
  return categoryIcons[category] ?? "📦";
}

function inferMarketType(tags: string[] | null) {
  const values = tags ?? [];

  if (values.some((tag) => tag.toLowerCase() === "in-game items")) {
    return "In-game Items";
  }

  if (values.some((tag) => tag.toLowerCase() === "keychains")) {
    return "Keychains";
  }

  return "Finger Sleeves";
}

function shouldUseRankIcon(category: string) {
  return category !== "accounts" && category !== "market";
}

export default function AdminProductManager() {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();

  const [games, setGames] = useState<GameRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState("");

  const [activeGameSlug, setActiveGameSlug] = useState(
    searchParams.get("game") ?? ""
  );
  const [activeCategorySlug, setActiveCategorySlug] = useState(
    searchParams.get("category") ?? ""
  );

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const currentGame = games.find((game) => game.slug === activeGameSlug);

  const availableCategories = categories
    .filter((category) => category.game_slug === activeGameSlug)
    .sort((a, b) => (a.sort_order ?? 10) - (b.sort_order ?? 10));

  const currentCategory = categories.find(
    (category) =>
      category.game_slug === activeGameSlug &&
      category.slug === activeCategorySlug
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (gameError) {
      alert(gameError.message);
      setLoading(false);
      return;
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("game_categories")
      .select("*")
      .order("game_slug", { ascending: true })
      .order("sort_order", { ascending: true });

    if (categoryError) {
      alert(categoryError.message);
      setLoading(false);
      return;
    }

    const { data: productData, error: productError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (productError) {
      alert(productError.message);
      setLoading(false);
      return;
    }

    const loadedGames = (gameData ?? []) as GameRow[];
    const loadedCategories = (categoryData ?? []) as CategoryRow[];

    const urlGame = searchParams.get("game");
    const urlCategory = searchParams.get("category");

    const firstGame = loadedGames[0]?.slug ?? "";
    const nextGameSlug =
      loadedGames.find((game) => game.slug === urlGame)?.slug ?? firstGame;

    const categoriesForGame = loadedCategories.filter(
      (category) => category.game_slug === nextGameSlug
    );

    const firstCategory = categoriesForGame[0]?.slug ?? "";
    const nextCategorySlug =
      categoriesForGame.find((category) => category.slug === urlCategory)
        ?.slug ?? firstCategory;

    setGames(loadedGames);
    setCategories(loadedCategories);
    setProducts((productData ?? []) as Product[]);

    setActiveGameSlug(nextGameSlug);
    setActiveCategorySlug(nextCategorySlug);

    setForm({
      ...emptyForm,
      game: nextGameSlug,
      category: nextCategorySlug,
    });

    updateUrl(nextGameSlug, nextCategorySlug);
    setLoading(false);
  }

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setProducts((data ?? []) as Product[]);
    setLoading(false);
  }

  function updateUrl(nextGame: string, nextCategory: string) {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (nextGame) {
      url.searchParams.set("game", nextGame);
    }

    if (nextCategory) {
      url.searchParams.set("category", nextCategory);
    }

    window.history.replaceState({}, "", url.toString());
  }

  function updateForm<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function getCategoryName(categorySlug: string) {
    return (
      categories.find(
        (category) =>
          category.game_slug === activeGameSlug && category.slug === categorySlug
      )?.name ?? categorySlug
    );
  }

  function getCategoryDescription(categorySlug: string) {
    return (
      categories.find(
        (category) =>
          category.game_slug === activeGameSlug && category.slug === categorySlug
      )?.description ?? "Create and manage listings for this category."
    );
  }

  function parseTags(tags: string, category: string) {
    const baseTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (category === "market") {
      const withoutDuplicateMarketType = baseTags.filter(
        (tag) =>
          tag.toLowerCase() !== form.market_type.toLowerCase() &&
          tag.toLowerCase() !== "market"
      );

      return ["Market", form.market_type, ...withoutDuplicateMarketType];
    }

    return baseTags;
  }

  function resetForm(categoryOverride?: string, gameOverride?: string) {
    const nextGame = gameOverride ?? activeGameSlug;
    const nextCategory = categoryOverride ?? activeCategorySlug;

    setForm({
      ...emptyForm,
      game: nextGame,
      category: nextCategory,
    });

    setEditingId("");
  }

  function changeActiveGame(gameSlug: string) {
    const categoriesForGame = categories.filter(
      (category) => category.game_slug === gameSlug
    );

    const nextCategory =
      categoriesForGame.find((category) => category.slug === activeCategorySlug)
        ?.slug ??
      categoriesForGame[0]?.slug ??
      "";

    setActiveGameSlug(gameSlug);
    setActiveCategorySlug(nextCategory);
    setSearch("");

    setForm((prev) => ({
      ...prev,
      game: gameSlug,
      category: nextCategory,
      rank_icon_url: shouldUseRankIcon(nextCategory) ? prev.rank_icon_url : "",
    }));

    updateUrl(gameSlug, nextCategory);
  }

  function changeActiveCategory(categorySlug: string) {
    setActiveCategorySlug(categorySlug);
    setSearch("");

    setForm((prev) => ({
      ...prev,
      category: categorySlug,
      rank_icon_url: shouldUseRankIcon(categorySlug) ? prev.rank_icon_url : "",
    }));

    updateUrl(activeGameSlug, categorySlug);
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!form.game) {
      alert("Select a game first.");
      return;
    }

    if (!form.category) {
      alert("Select a category first.");
      return;
    }

    if (!form.title.trim()) {
      alert("Product title is required.");
      return;
    }

    if (!form.description.trim()) {
      alert("Description is required.");
      return;
    }

    if (!form.price.trim()) {
      alert("Price is required.");
      return;
    }

    const price = Number(form.price);

    if (Number.isNaN(price) || price < 0) {
      alert("Enter a valid price.");
      return;
    }

    const payload = {
      game: form.game,
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      price,
      tags: parseTags(form.tags, form.category),
      image_url: form.image_url.trim() || null,
      video_url: form.video_url.trim() || null,
      rank_icon_url: shouldUseRankIcon(form.category)
        ? form.rank_icon_url.trim() || null
        : null,
      delivery_time: form.delivery_time.trim() || "Manual review",
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("products").insert(payload);

      if (error) {
        alert(error.message);
        return;
      }
    }

    resetForm(form.category, form.game);
    await loadProducts();
  }

  function startEdit(product: Product) {
    const productGame = product.game ?? activeGameSlug;
    const productCategory = product.category;

    setEditingId(product.id);
    setActiveGameSlug(productGame);
    setActiveCategorySlug(productCategory);

    setForm({
      game: productGame,
      category: productCategory,
      market_type: inferMarketType(product.tags),
      title: product.title,
      description: product.description ?? "",
      price: String(product.price ?? 0),
      tags:
        product.tags
          ?.filter(
            (tag) =>
              tag.toLowerCase() !== "market" &&
              tag.toLowerCase() !== "in-game items" &&
              tag.toLowerCase() !== "finger sleeves" &&
              tag.toLowerCase() !== "keychains"
          )
          .join(", ") ?? "",
      image_url: product.image_url ?? "",
      video_url: product.video_url ?? "",
      rank_icon_url: shouldUseRankIcon(productCategory)
        ? product.rank_icon_url ?? ""
        : "",
      delivery_time: product.delivery_time ?? "Manual review",
      is_active: product.is_active ?? true,
    });

    updateUrl(productGame, productCategory);

    document.getElementById("product-manager")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function toggleProduct(product: Product) {
    const { error } = await supabase
      .from("products")
      .update({
        is_active: !(product.is_active ?? true),
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  async function deleteProduct(product: Product) {
    const confirmed = confirm(
      `Delete "${product.title}" permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadProducts();
  }

  const filteredProducts = products.filter((product) => {
    const text = [
      product.title,
      product.description,
      product.tags?.join(" "),
      product.category,
      product.game,
      product.price?.toString(),
      product.delivery_time,
    ]
      .join(" ")
      .toLowerCase();

    return (
      (product.game ?? "") === activeGameSlug &&
      product.category === activeCategorySlug &&
      text.includes(search.toLowerCase())
    );
  });

  function productCount(categorySlug: string) {
    return products.filter(
      (product) =>
        (product.game ?? "") === activeGameSlug &&
        product.category === categorySlug
    ).length;
  }

  return (
    <div
      id="product-manager"
      className="mt-8 scroll-mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6"
    >
      <AdminNav />

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-bold">Product Manager</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Add, edit, delete, hide, and upload images for each game's listings.
          </p>
        </div>

        <button
          onClick={loadInitialData}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-zinc-300">
            Manage Game
          </span>

          <select
            className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
            value={activeGameSlug}
            onChange={(e) => changeActiveGame(e.target.value)}
          >
            {games.map((game) => (
              <option key={game.id} value={game.slug}>
                {game.name}
              </option>
            ))}
          </select>
        </label>

        <p className="mt-3 text-sm text-zinc-500">
          {currentGame?.description || "Select a game to manage its listings."}
        </p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        {availableCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => changeActiveCategory(category.slug)}
            className={`rounded-2xl border p-4 text-left ${
              activeCategorySlug === category.slug
                ? "border-yellow-400 bg-yellow-400 text-black"
                : "border-zinc-800 bg-zinc-950 text-white hover:border-zinc-700"
            }`}
          >
            <div className="text-2xl">{getCategoryIcon(category.slug)}</div>
            <p className="mt-2 font-bold">{category.name}</p>
            <p
              className={`mt-1 text-xs ${
                activeCategorySlug === category.slug
                  ? "text-black/70"
                  : "text-zinc-500"
              }`}
            >
              {productCount(category.slug)} listing(s)
            </p>
          </button>
        ))}

        {availableCategories.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400 md:col-span-4">
            No categories found for this game. Add categories in Admin Catalog.
          </div>
        )}
      </div>

      <form
        onSubmit={saveProduct}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
      >
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-bold">
              {editingId
                ? `Edit ${getCategoryName(form.category)} Listing`
                : `Add ${getCategoryName(form.category)} Listing`}
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              {currentGame?.name || form.game} •{" "}
              {currentCategory?.description ||
                getCategoryDescription(form.category)}
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={() => resetForm()}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Game</span>

            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.game}
              onChange={(e) => {
                const nextGame = e.target.value;
                changeActiveGame(nextGame);
              }}
            >
              {games.map((game) => (
                <option key={game.id} value={game.slug}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Category
            </span>

            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.category}
              onChange={(e) => changeActiveCategory(e.target.value)}
            >
              {availableCategories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          {form.category === "market" && (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-300">
                Market Type
              </span>

              <select
                className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                value={form.market_type}
                onChange={(e) => updateForm("market_type", e.target.value)}
              >
                {marketTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Title</span>

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="e.g. 90K Trophy Account"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Price SGD
            </span>

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 4.99"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Delivery / Collection
            </span>

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Ready stock / Preorder / Manual review"
              value={form.delivery_time}
              onChange={(e) => updateForm("delivery_time", e.target.value)}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-300">
              Description
            </span>

            <textarea
              className="min-h-28 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Describe the listing clearly."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-300">
              Extra Tags, comma-separated
            </span>

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Ready Stock, Max Rank, Limited"
              value={form.tags}
              onChange={(e) => updateForm("tags", e.target.value)}
            />
          </label>

          <div className="md:col-span-2">
            <ImageUploadField
              label="Listing Image"
              value={form.image_url}
              onChange={(url) => updateForm("image_url", url)}
              folder={`listings/${form.game || "unknown"}/${
                form.category || "uncategorized"
              }`}
              placeholderIcon={getCategoryIcon(form.category)}
            />
          </div>

          {shouldUseRankIcon(form.category) && (
            <div className="md:col-span-2">
              <ImageUploadField
                label="Optional Icon Image"
                value={form.rank_icon_url}
                onChange={(url) => updateForm("rank_icon_url", url)}
                folder={`rank-icons/${form.game || "unknown"}/${
                  form.category || "uncategorized"
                }`}
                placeholderIcon="🏆"
                previewClassName="h-32"
              />
            </div>
          )}

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-300">
              Video URL
            </span>

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="https://...mp4"
              value={form.video_url}
              onChange={(e) => updateForm("video_url", e.target.value)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-xl bg-zinc-800 p-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => updateForm("is_active", e.target.checked)}
            />

            <span className="text-sm font-semibold text-zinc-300">
              Active listing
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300">
            {editingId ? "Save Changes" : "Add Listing"}
          </button>

          <button
            type="button"
            onClick={() => resetForm()}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold text-white hover:bg-zinc-900"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="mt-6">
        <input
          className="w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder={`Search ${
            currentGame?.name || "selected game"
          } ${getCategoryName(activeCategorySlug).toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <p className="mt-4 text-sm text-zinc-500">
          {loading
            ? "Loading products..."
            : `${filteredProducts.length} ${
                currentGame?.name || "game"
              } ${getCategoryName(activeCategorySlug).toLowerCase()} listing(s)`}
        </p>

        <div className="mt-4 grid gap-4">
          {filteredProducts.length === 0 && !loading && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-400">
              No listings found.
            </div>
          )}

          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
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
                      <div className="flex h-full w-full items-center justify-center text-3xl">
                        {getCategoryIcon(product.category)}
                      </div>
                    )}

                    {shouldUseRankIcon(product.category) &&
                      product.rank_icon_url && (
                        <img
                          src={product.rank_icon_url}
                          alt="Icon"
                          className="absolute bottom-1 left-1 h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-950 object-cover p-1"
                        />
                      )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">{product.title}</h4>

                      <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-semibold text-yellow-300">
                        {games.find((game) => game.slug === product.game)
                          ?.name ?? product.game}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          product.is_active
                            ? "bg-green-400/10 text-green-300"
                            : "bg-red-400/10 text-red-300"
                        }`}
                      >
                        {product.is_active ? "active" : "hidden"}
                      </span>
                    </div>

                    <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                      {product.description || "No description"}
                    </p>

                    <p className="mt-2 text-sm font-bold text-yellow-300">
                      SGD{Number(product.price ?? 0).toFixed(2)}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {product.delivery_time || "Manual review"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(product.tags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => startEdit(product)}
                    className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-semibold hover:bg-zinc-700"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => toggleProduct(product)}
                    className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
                  >
                    {product.is_active ? "Hide" : "Show"}
                  </button>

                  <button
                    onClick={() => deleteProduct(product)}
                    className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminNav() {
  return (
    <nav className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <Link href="/" className="text-xl font-bold text-yellow-400">
        Booster Lounge
      </Link>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/admin" className="text-zinc-300 hover:text-white">
          Admin Orders
        </Link>

        <Link href="/admin/products" className="text-yellow-300">
          Products
        </Link>

        <Link href="/admin/catalog" className="text-zinc-300 hover:text-white">
          Catalog
        </Link>

        <Link href="/admin/users" className="text-zinc-300 hover:text-white">
          Users
        </Link>

        <Link href="/dashboard" className="text-zinc-300 hover:text-white">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}