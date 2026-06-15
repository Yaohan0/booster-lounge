"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type ImageUploadFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  bucket = "listing-images",
  folder = "uploads",
}: ImageUploadFieldProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function uploadImage(file: File) {
    setErrorMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be below 5MB.");
      return;
    }

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const filePath = `${folder}/${Date.now()}-${cleanName}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setUploading(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="text-lg font-bold text-white">{label}</h3>

      <div className="mt-4 flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800">
        {value ? (
          <img
            src={value}
            alt={label}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-5xl">🛒</div>
            <p className="mt-3 text-sm text-zinc-400">No image selected</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) uploadImage(file);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-4 w-full rounded-2xl bg-zinc-800 px-4 py-4 text-left text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Browse..."}
      </button>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL"
        className="mt-4 w-full rounded-2xl border border-zinc-800 bg-zinc-800 px-4 py-4 text-white outline-none placeholder:text-zinc-500 focus:border-yellow-400"
      />

      {errorMessage && (
        <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
      )}
    </div>
  );
}