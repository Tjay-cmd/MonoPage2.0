"use client";

import { useState, useEffect, useRef } from "react";

interface UserImage {
  name: string;
  url: string;
  size?: number;
  createdAt?: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<UserImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      const res = await fetch("/api/editor/images");
      const data = await res.json();
      if (data.images) setImages(data.images);
    } catch {
      setError("Failed to load images");
    }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/editor/images", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      await loadImages();
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(name: string) {
    try {
      const res = await fetch("/api/editor/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.name !== name));
      }
    } catch {
      setError("Failed to delete image");
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Images</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload images here. The AI website builder will use them when you ask it
        to add images to your site. Name your files descriptively (e.g.
        &quot;logo.png&quot;, &quot;hero-background.jpg&quot;) so the AI knows
        which image to use.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`mb-8 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <div className="space-y-2">
          <p className="text-gray-600">
            {uploading ? "Uploading..." : "Drag and drop an image here, or"}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            Choose File
          </button>
          <p className="text-xs text-gray-400">
            PNG, JPG, GIF, WebP, SVG. Max 5MB.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <p className="text-sm text-gray-500">
          No images uploaded yet. Upload images and the AI will be able to add
          them to your website.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.name}
              className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p
                  className="text-xs font-medium text-gray-700 truncate"
                  title={img.name}
                >
                  {img.name}
                </p>
              </div>
              {/* Overlay actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => copyUrl(img.url)}
                  className="px-3 py-1.5 bg-white text-gray-800 rounded text-xs font-medium hover:bg-gray-100"
                  title="Copy URL"
                >
                  Copy URL
                </button>
                <button
                  onClick={() => deleteImage(img.name)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
