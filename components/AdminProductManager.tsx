"use client";

import { useEffect, useMemo, useState } from "react";
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
  created_at: string;
};

type ProductForm = {
  category: ProductCategory;
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
  category: "accounts",
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

const categoryLabels: Record<ProductCategory, string> = {
  accounts: "Accounts",
  pins: "Pins",
  offers: "Offers",
};

const categoryIcons: Record<ProductCategory, string> = {
  accounts: "🎮",
  pins: "📌",
  offers: "🔥",
};

export default function AdminProductManager() {
  const supabase = useMemo(() => createClient(), []);

  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<ProductCategory>("accounts");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingRankIcon, setUploadingRankIcon] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

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

  function updateForm<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function parseTags(tags: string) {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      category: activeCategory,
    });
    setEditingId("");
  }

  function cleanFileName(fileName: string) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-");
  }

  async function uploadProductFile(
    file: File,
    targetField: "image_url" | "rank_icon_url"
  ) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    const maxSizeMb = 5;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      alert(`Image is too large. Keep it under ${maxSizeMb}MB.`);
      return;
    }

    if (targetField === "image_url") {
      setUploadingImage(true);
    } else {
      setUploadingRankIcon(true);
    }

    const safeName = cleanFileName(file.name);
    const folder = targetField === "image_url" ? "listing-images" : "rank-icons";
    const filePath = `${folder}/${form.category}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      alert(uploadError.message);

      if (targetField === "image_url") {
        setUploadingImage(false);
      } else {
        setUploadingRankIcon(false);
      }

      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    updateForm(targetField, data.publicUrl);

    if (targetField === "image_url") {
      setUploadingImage(false);
    } else {
      setUploadingRankIcon(false);
    }
  }

  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Product title is required.");
      return;
    }

    const payload = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price || 0),
      tags: parseTags(form.tags),
      image_url: form.image_url.trim() || null,
      video_url: form.video_url.trim() || null,
      rank_icon_url: form.rank_icon_url.trim() || null,
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

    resetForm();
    await loadProducts();
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setActiveCategory(product.category);

    setForm({
      category: product.category,
      title: product.title,
      description: product.description ?? "",
      price: String(product.price ?? 0),
      tags: product.tags?.join(", ") ?? "",
      image_url: product.image_url ?? "",
      video_url: product.video_url ?? "",
      rank_icon_url: product.rank_icon_url ?? "",
      delivery_time: product.delivery_time ?? "Manual review",
      is_active: product.is_active ?? true,
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
      product.price?.toString(),
    ]
      .join(" ")
      .toLowerCase();

    return (
      product.category === activeCategory &&
      text.includes(search.toLowerCase())
    );
  });

  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h2 className="text-xl font-bold">Product Manager</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Add, edit, delete, hide, and upload images for accounts, pins, and
            offers.
          </p>
        </div>

        <button
          onClick={loadProducts}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(["accounts", "pins", "offers"] as ProductCategory[]).map(
          (category) => (
            <button
              key={category}
              onClick={() => {
                setActiveCategory(category);
                setForm((prev) => ({
                  ...prev,
                  category,
                }));
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                activeCategory === category
                  ? "bg-yellow-400 text-black"
                  : "bg-zinc-800 text-white hover:bg-zinc-700"
              }`}
            >
              {categoryLabels[category]}
            </button>
          )
        )}
      </div>

      <form
        onSubmit={saveProduct}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
      >
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h3 className="font-bold">
              {editingId ? "Edit Listing" : "Add New Listing"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Upload images from your computer or paste image/video URLs.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Category
            </span>
            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.category}
              onChange={(e) =>
                updateForm("category", e.target.value as ProductCategory)
              }
            >
              <option value="accounts">Accounts</option>
              <option value="pins">Pins</option>
              <option value="offers">Offers</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">Title</span>
            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="e.g. Mythic I Account • 90K Trophies"
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
              placeholder="e.g. 29.99"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-zinc-300">
              Delivery Time
            </span>
            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Manual review"
              value={form.delivery_time}
              onChange={(e) => updateForm("delivery_time", e.target.value)}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-300">
              Description
            </span>
            <textarea
              className="min-h-24 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Describe the account, pins, or offer."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </label>

          <label className="grid gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-zinc-300">
              Tags, comma-separated
            </span>
            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Mythic, 90K, Account, Fast"
              value={form.tags}
              onChange={(e) => updateForm("tags", e.target.value)}
            />
          </label>

          <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <span className="text-sm font-semibold text-zinc-300">
              Listing Image
            </span>

            {form.image_url ? (
              <img
                src={form.image_url}
                alt="Listing preview"
                className="h-40 w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-40 w-full items-center justify-center rounded-xl bg-zinc-800 text-4xl">
                {categoryIcons[form.category]}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="rounded-xl bg-zinc-800 p-3 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadProductFile(file, "image_url");
              }}
            />

            <input
              className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Or paste image URL"
              value={form.image_url}
              onChange={(e) => updateForm("image_url", e.target.value)}
            />

            {uploadingImage && (
              <p className="text-sm text-yellow-300">Uploading image...</p>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
            <span className="text-sm font-semibold text-zinc-300">
              Rank Icon Image
            </span>

            {form.rank_icon_url ? (
              <img
                src={form.rank_icon_url}
                alt="Rank icon preview"
                className="h-20 w-20 rounded-xl border border-zinc-700 bg-zinc-950 object-cover p-1"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                🏆
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              className="rounded-xl bg-zinc-800 p-3 text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadProductFile(file, "rank_icon_url");
              }}
            />

            <input
              className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Or paste rank icon URL"
              value={form.rank_icon_url}
              onChange={(e) => updateForm("rank_icon_url", e.target.value)}
            />

            {uploadingRankIcon && (
              <p className="text-sm text-yellow-300">Uploading rank icon...</p>
            )}
          </div>

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
            onClick={resetForm}
            className="rounded-xl border border-zinc-700 px-5 py-3 font-bold text-white hover:bg-zinc-900"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="mt-6">
        <input
          className="w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder={`Search ${categoryLabels[activeCategory].toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <p className="mt-4 text-sm text-zinc-500">
          {loading
            ? "Loading products..."
            : `${filteredProducts.length} ${categoryLabels[
                activeCategory
              ].toLowerCase()} listing(s)`}
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
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
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
                        {categoryIcons[product.category]}
                      </div>
                    )}

                    {product.rank_icon_url && (
                      <img
                        src={product.rank_icon_url}
                        alt="Rank icon"
                        className="absolute bottom-1 left-1 h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-950 object-cover p-1"
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold">{product.title}</h4>

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

                    <p className="mt-2 text-sm text-zinc-400">
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