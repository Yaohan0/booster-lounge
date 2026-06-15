"use client";

import ImageUploadField from "@/components/ImageUploadField";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  tag_label: string | null;
  tag_placeholder: string | null;
  image_url: string | null;
  badge: string | null;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
};

type CategoryRow = {
  id: string;
  game_slug: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
};

const requiredCategories = [
  {
    slug: "accounts",
    name: "Accounts",
    description: "Account listings for this game.",
    sort_order: 1,
  },
  {
    slug: "pins",
    name: "Pins",
    description: "Pins and small collectible listings.",
    sort_order: 2,
  },
  {
    slug: "offers",
    name: "Offers",
    description: "Bundles, promotions, and special offers.",
    sort_order: 3,
  },
  {
    slug: "market",
    name: "Market",
    description: "Market products and game items.",
    sort_order: 4,
  },
];

function makeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminCatalogPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [games, setGames] = useState<GameRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const [selectedGameSlug, setSelectedGameSlug] = useState("");

  const [gameName, setGameName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [tagLabel, setTagLabel] = useState("Player ID");
  const [tagPlaceholder, setTagPlaceholder] = useState("Enter player ID");
  const [imageUrl, setImageUrl] = useState("");
  const [badge, setBadge] = useState("");
  const [sortOrder, setSortOrder] = useState("10");

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGameName, setEditGameName] = useState("");
  const [editGameSlug, setEditGameSlug] = useState("");
  const [editShortName, setEditShortName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTagLabel, setEditTagLabel] = useState("");
  const [editTagPlaceholder, setEditTagPlaceholder] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("10");

  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categorySortOrder, setCategorySortOrder] = useState("10");

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategorySortOrder, setEditCategorySortOrder] = useState("10");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkAdmin() {
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

      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [router, supabase]);

  useEffect(() => {
    if (isAdmin) {
      loadCatalog();
    }
  }, [isAdmin]);

  async function loadCatalog() {
    setErrorMessage("");

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (gameError) {
      setErrorMessage(gameError.message);
      return;
    }

    const { data: categoryData, error: categoryError } = await supabase
      .from("game_categories")
      .select("*")
      .order("game_slug", { ascending: true })
      .order("sort_order", { ascending: true });

    if (categoryError) {
      setErrorMessage(categoryError.message);
      return;
    }

    const loadedGames = (gameData ?? []) as GameRow[];

    setGames(loadedGames);
    setCategories((categoryData ?? []) as CategoryRow[]);

    if (!selectedGameSlug && loadedGames.length > 0) {
      setSelectedGameSlug(loadedGames[0].slug);
    }
  }

  function updateGameName(value: string) {
    setGameName(value);

    if (!gameSlug.trim()) {
      setGameSlug(makeSlug(value));
    }
  }

  function updateCategoryName(value: string) {
    setCategoryName(value);

    if (!categorySlug.trim()) {
      setCategorySlug(makeSlug(value));
    }
  }

  function startEditGame(game: GameRow) {
    setEditingGameId(game.id);
    setEditGameName(game.name);
    setEditGameSlug(game.slug);
    setEditShortName(game.short_name ?? "");
    setEditDescription(game.description ?? "");
    setEditTagLabel(game.tag_label ?? "Player ID");
    setEditTagPlaceholder(game.tag_placeholder ?? "Enter player ID");
    setEditImageUrl(game.image_url ?? "");
    setEditBadge(game.badge ?? "");
    setEditSortOrder(String(game.sort_order ?? 10));
  }

  function cancelEditGame() {
    setEditingGameId(null);
    setEditGameName("");
    setEditGameSlug("");
    setEditShortName("");
    setEditDescription("");
    setEditTagLabel("");
    setEditTagPlaceholder("");
    setEditImageUrl("");
    setEditBadge("");
    setEditSortOrder("10");
  }

  function startEditCategory(category: CategoryRow) {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
    setEditCategorySlug(category.slug);
    setEditCategoryDescription(category.description ?? "");
    setEditCategorySortOrder(String(category.sort_order ?? 10));
  }

  function cancelEditCategory() {
    setEditingCategoryId(null);
    setEditCategoryName("");
    setEditCategorySlug("");
    setEditCategoryDescription("");
    setEditCategorySortOrder("10");
  }

  async function addGame(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanName = gameName.trim();
    const cleanSlug = makeSlug(gameSlug || gameName);

    if (!cleanName || !cleanSlug) {
      setErrorMessage("Game name and slug are required.");
      return;
    }

    setLoading(true);

    const { error: gameError } = await supabase.from("games").insert({
      slug: cleanSlug,
      name: cleanName,
      short_name: shortName.trim() || null,
      description: description.trim() || null,
      tag_label: tagLabel.trim() || "Player ID",
      tag_placeholder: tagPlaceholder.trim() || "Enter player ID",
      image_url: imageUrl.trim() || null,
      badge: badge.trim() || null,
      sort_order: Number(sortOrder) || 10,
      is_active: true,
    });

    if (gameError) {
      setLoading(false);
      setErrorMessage(gameError.message);
      return;
    }

    const categoryRows = requiredCategories.map((category) => ({
      game_slug: cleanSlug,
      slug: category.slug,
      name: category.name,
      description: category.description,
      sort_order: category.sort_order,
      is_active: true,
    }));

    const { error: categoryError } = await supabase
      .from("game_categories")
      .insert(categoryRows);

    setLoading(false);

    if (categoryError) {
      setErrorMessage(categoryError.message);
      return;
    }

    setMessage(
      `Added ${cleanName}. Accounts, Pins, Offers, and Market were created automatically.`
    );

    setGameName("");
    setGameSlug("");
    setShortName("");
    setDescription("");
    setTagLabel("Player ID");
    setTagPlaceholder("Enter player ID");
    setImageUrl("");
    setBadge("");
    setSortOrder("10");
    setSelectedGameSlug(cleanSlug);

    await loadCatalog();
  }

  async function saveGame(game: GameRow) {
    setMessage("");
    setErrorMessage("");

    const oldSlug = game.slug;
    const cleanName = editGameName.trim();
    const cleanSlug = makeSlug(editGameSlug || editGameName);

    if (!cleanName || !cleanSlug) {
      setErrorMessage("Game name and slug are required.");
      return;
    }

    setLoading(true);

    const { error: gameError } = await supabase
      .from("games")
      .update({
        slug: cleanSlug,
        name: cleanName,
        short_name: editShortName.trim() || null,
        description: editDescription.trim() || null,
        tag_label: editTagLabel.trim() || "Player ID",
        tag_placeholder: editTagPlaceholder.trim() || "Enter player ID",
        image_url: editImageUrl.trim() || null,
        badge: editBadge.trim() || null,
        sort_order: Number(editSortOrder) || 10,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    if (gameError) {
      setLoading(false);
      setErrorMessage(gameError.message);
      return;
    }

    if (oldSlug !== cleanSlug) {
      await supabase
        .from("products")
        .update({ game: cleanSlug })
        .eq("game", oldSlug);

      await supabase
        .from("order_requests")
        .update({ game: cleanSlug })
        .eq("game", oldSlug);

      await supabase
        .from("orders")
        .update({ game: cleanSlug })
        .eq("game", oldSlug);

      await supabase
        .from("game_categories")
        .update({ game_slug: cleanSlug })
        .eq("game_slug", oldSlug);
    }

    setLoading(false);
    setMessage(`Updated ${cleanName}.`);
    setSelectedGameSlug(cleanSlug);
    cancelEditGame();
    await loadCatalog();
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanGameSlug = selectedGameSlug.trim();
    const cleanName = categoryName.trim();
    const cleanSlug = makeSlug(categorySlug || categoryName);

    if (!cleanGameSlug) {
      setErrorMessage("Select a game first.");
      return;
    }

    if (!cleanName || !cleanSlug) {
      setErrorMessage("Category name and slug are required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("game_categories").insert({
      game_slug: cleanGameSlug,
      slug: cleanSlug,
      name: cleanName,
      description: categoryDescription.trim() || null,
      sort_order: Number(categorySortOrder) || 10,
      is_active: true,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(`Added category ${cleanName}.`);
    setCategoryName("");
    setCategorySlug("");
    setCategoryDescription("");
    setCategorySortOrder("10");

    await loadCatalog();
  }

  async function saveCategory(category: CategoryRow) {
    setMessage("");
    setErrorMessage("");

    const oldSlug = category.slug;
    const cleanName = editCategoryName.trim();
    const cleanSlug = makeSlug(editCategorySlug || editCategoryName);
    const cleanSortOrder = Number(editCategorySortOrder) || 10;

    if (!cleanName || !cleanSlug) {
      setErrorMessage("Category name and slug are required.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("game_categories")
      .update({
        slug: cleanSlug,
        name: cleanName,
        description: editCategoryDescription.trim() || null,
        sort_order: cleanSortOrder,
      })
      .eq("id", category.id);

    if (error) {
      setLoading(false);
      setErrorMessage(error.message);
      return;
    }

    if (oldSlug !== cleanSlug) {
      await supabase
        .from("products")
        .update({ category: cleanSlug })
        .eq("game", category.game_slug)
        .eq("category", oldSlug);
    }

    setLoading(false);
    setMessage(`Updated category ${cleanName}.`);
    cancelEditCategory();
    await loadCatalog();
  }

  async function toggleGame(game: GameRow) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("games")
      .update({
        is_active: !game.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadCatalog();
  }

  async function toggleCategory(category: CategoryRow) {
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("game_categories")
      .update({
        is_active: !category.is_active,
      })
      .eq("id", category.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadCatalog();
  }

  async function deleteCategory(category: CategoryRow) {
    const confirmed = window.confirm(
      `Delete category "${category.name}" from ${category.game_slug}? Products in this category will not be deleted, but may no longer appear correctly.`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("game_categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Category deleted.");
    await loadCatalog();
  }

  const selectedGameCategories = categories.filter(
    (category) => category.game_slug === selectedGameSlug
  );

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] text-white">
        Checking admin access...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
        <section className="max-w-md rounded-3xl border border-red-400/30 bg-red-400/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-300">Access denied</h1>
          <p className="mt-3 text-sm text-red-100">
            Only admins can manage games and categories.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080b] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <nav className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin" className="text-zinc-300 hover:text-white">
              Admin Orders
            </Link>

            <Link
              href="/admin/products"
              className="text-zinc-300 hover:text-white"
            >
              Products
            </Link>

            <Link href="/admin/catalog" className="text-yellow-300">
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

        <header className="mb-8">
          <p className="text-sm font-semibold text-yellow-300">Admin Catalog</p>
          <h1 className="mt-2 text-4xl font-black">Games and Categories</h1>
          <p className="mt-3 max-w-2xl text-zinc-400">
            Add games manually, upload images, control badges, and manage game
            categories without editing code.
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-bold">Add Game</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Add a game once here. It can then appear in your navbar dropdown
              and product manager.
            </p>

            <form onSubmit={addGame} className="mt-6 grid gap-4">
              <TextField
                label="Game Name"
                value={gameName}
                onChange={updateGameName}
                placeholder="e.g. Brawl Stars"
              />

              <TextField
                label="Slug"
                value={gameSlug}
                onChange={(value) => setGameSlug(makeSlug(value))}
                placeholder="e.g. brawl_stars"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Short Name"
                  value={shortName}
                  onChange={setShortName}
                  placeholder="e.g. BS"
                />

                <TextField
                  label="Sort Order"
                  value={sortOrder}
                  onChange={setSortOrder}
                  placeholder="e.g. 10"
                />
              </div>

              <TextAreaField
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Short description for this game."
              />

              <ImageUploadField
                label="Game Image"
                value={imageUrl}
                onChange={setImageUrl}
                folder="games"
                placeholderIcon="🎮"
                previewClassName="h-52"
              />

              <TextField
                label="Badge"
                value={badge}
                onChange={setBadge}
                placeholder="e.g. NEW, POPULAR, HOT"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Tag Label"
                  value={tagLabel}
                  onChange={setTagLabel}
                  placeholder="e.g. Player ID"
                />

                <TextField
                  label="Tag Placeholder"
                  value={tagPlaceholder}
                  onChange={setTagPlaceholder}
                  placeholder="e.g. Enter player ID"
                />
              </div>

              <button
                disabled={loading}
                className="mt-2 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add game"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-bold">Add Category</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Add extra categories to a game. Accounts, Pins, Offers, and Market
              are auto-created when a new game is added.
            </p>

            <form onSubmit={addCategory} className="mt-6 grid gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-zinc-300">
                  Select Game
                </span>

                <select
                  className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                  value={selectedGameSlug}
                  onChange={(e) => setSelectedGameSlug(e.target.value)}
                >
                  {games.map((game) => (
                    <option key={game.id} value={game.slug}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </label>

              <TextField
                label="Category Name"
                value={categoryName}
                onChange={updateCategoryName}
                placeholder="e.g. Skins"
              />

              <TextField
                label="Category Slug"
                value={categorySlug}
                onChange={(value) => setCategorySlug(makeSlug(value))}
                placeholder="e.g. skins"
              />

              <TextAreaField
                label="Category Description"
                value={categoryDescription}
                onChange={setCategoryDescription}
                placeholder="Short description for this category."
              />

              <TextField
                label="Sort Order"
                value={categorySortOrder}
                onChange={setCategorySortOrder}
                placeholder="e.g. 10"
              />

              <button
                disabled={loading || !selectedGameSlug}
                className="mt-2 rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Saving..." : "Add category"}
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold">Existing Games</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Edit game image, badge, order, details, or active status.
              </p>
            </div>

            <button
              type="button"
              onClick={loadCatalog}
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {games.map((game) => {
              const isEditing = editingGameId === game.id;

              return (
                <div
                  key={game.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  {isEditing ? (
                    <div className="grid gap-4">
                      <TextField
                        label="Game Name"
                        value={editGameName}
                        onChange={setEditGameName}
                        placeholder="Game name"
                      />

                      <TextField
                        label="Slug"
                        value={editGameSlug}
                        onChange={(value) => setEditGameSlug(makeSlug(value))}
                        placeholder="game_slug"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <TextField
                          label="Short Name"
                          value={editShortName}
                          onChange={setEditShortName}
                          placeholder="Short name"
                        />

                        <TextField
                          label="Sort Order"
                          value={editSortOrder}
                          onChange={setEditSortOrder}
                          placeholder="10"
                        />
                      </div>

                      <TextAreaField
                        label="Description"
                        value={editDescription}
                        onChange={setEditDescription}
                        placeholder="Description"
                      />

                      <ImageUploadField
                        label="Game Image"
                        value={editImageUrl}
                        onChange={setEditImageUrl}
                        folder="games"
                        placeholderIcon="🎮"
                        previewClassName="h-52"
                      />

                      <TextField
                        label="Badge"
                        value={editBadge}
                        onChange={setEditBadge}
                        placeholder="e.g. NEW, POPULAR, HOT"
                      />

                      <TextField
                        label="Tag Label"
                        value={editTagLabel}
                        onChange={setEditTagLabel}
                        placeholder="Tag label"
                      />

                      <TextField
                        label="Tag Placeholder"
                        value={editTagPlaceholder}
                        onChange={setEditTagPlaceholder}
                        placeholder="Tag placeholder"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => saveGame(game)}
                          className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditGame}
                          className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                          {game.image_url ? (
                            <img
                              src={game.image_url}
                              alt={game.name}
                              className="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-zinc-800"
                            />
                          ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-black text-yellow-300">
                              {getInitials(game.name)}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="truncate text-xl font-bold">
                              {game.name}
                            </h3>

                            <p className="mt-1 truncate text-sm text-zinc-500">
                              {game.slug}
                            </p>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {game.badge && (
                                <span className="rounded-full bg-yellow-400/10 px-2 py-1 text-xs font-bold text-yellow-300">
                                  {game.badge}
                                </span>
                              )}

                              <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs font-bold text-zinc-400">
                                Order: {game.sort_order ?? 10}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                            game.is_active
                              ? "bg-green-400/10 text-green-300"
                              : "bg-red-400/10 text-red-300"
                          }`}
                        >
                          {game.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm text-zinc-400">
                        {game.description || "No description."}
                      </p>

                      <div className="mt-4 text-sm text-zinc-500">
                        <p>Tag label: {game.tag_label || "Player ID"}</p>
                        <p>Placeholder: {game.tag_placeholder || "-"}</p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => startEditGame(game)}
                          className="rounded-xl border border-yellow-400/40 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-400/10"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleGame(game)}
                          className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
                        >
                          {game.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-2xl font-bold">Categories</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Edit and manage categories for the selected game.
              </p>
            </div>

            <select
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              value={selectedGameSlug}
              onChange={(e) => setSelectedGameSlug(e.target.value)}
            >
              {games.map((game) => (
                <option key={game.id} value={game.slug}>
                  {game.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedGameCategories.map((category) => {
              const isEditing = editingCategoryId === category.id;

              return (
                <div
                  key={category.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                >
                  {isEditing ? (
                    <div className="grid gap-4">
                      <TextField
                        label="Category Name"
                        value={editCategoryName}
                        onChange={setEditCategoryName}
                        placeholder="Category name"
                      />

                      <TextField
                        label="Category Slug"
                        value={editCategorySlug}
                        onChange={(value) =>
                          setEditCategorySlug(makeSlug(value))
                        }
                        placeholder="category_slug"
                      />

                      <TextAreaField
                        label="Description"
                        value={editCategoryDescription}
                        onChange={setEditCategoryDescription}
                        placeholder="Category description"
                      />

                      <TextField
                        label="Sort Order"
                        value={editCategorySortOrder}
                        onChange={setEditCategorySortOrder}
                        placeholder="10"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => saveCategory(category)}
                          className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-300 disabled:opacity-60"
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditCategory}
                          className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold">{category.name}</h3>

                          <p className="mt-1 text-sm text-zinc-500">
                            {category.slug}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            category.is_active
                              ? "bg-green-400/10 text-green-300"
                              : "bg-red-400/10 text-red-300"
                          }`}
                        >
                          {category.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm text-zinc-400">
                        {category.description || "No description."}
                      </p>

                      <p className="mt-3 text-sm text-zinc-500">
                        Sort order: {category.sort_order ?? 0}
                      </p>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => startEditCategory(category)}
                          className="rounded-xl border border-yellow-400/40 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-400/10"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-800"
                        >
                          {category.is_active ? "Disable" : "Enable"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCategory(category)}
                          className="rounded-xl border border-red-400/40 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-400/10"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {selectedGameCategories.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-400">
                No categories found for this game.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>

      <input
        className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>

      <textarea
        className="mt-2 min-h-24 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}