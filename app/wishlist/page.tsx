"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Plus, Trash2, ExternalLink, Loader2, Eye, EyeOff, Pencil, Check, X } from "lucide-react";
import Link from "next/link";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  priceRange: string | null;
  isPurchased: boolean;
  sortOrder: number;
}

interface WishlistData {
  items: WishlistItem[];
  showWishlist: boolean;
}

interface FormState {
  title: string;
  description: string;
  url: string;
  priceRange: string;
}

const emptyForm: FormState = { title: "", description: "", url: "", priceRange: "" };

async function fetchWishlist(): Promise<WishlistData> {
  const r = await fetch("/api/wishlist");
  if (!r.ok) throw new Error(`Failed to load wishlist (${r.status})`);
  return r.json();
}

export default function WishlistPage() {
  const qc = useQueryClient();

  const { data, isPending, error } = useQuery<WishlistData>({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const toggleVisibility = useMutation({
    mutationFn: (showWishlist: boolean) =>
      fetch("/api/wishlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showWishlist }),
      }).then((r) => r.json()),
    onMutate: async (showWishlist) => {
      await qc.cancelQueries({ queryKey: ["wishlist"] });
      const prev = qc.getQueryData<WishlistData>(["wishlist"]);
      qc.setQueryData<WishlistData>(["wishlist"], (old) =>
        old ? { ...old, showWishlist } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(["wishlist"], ctx?.prev);
    },
  });

  const addItem = useMutation({
    mutationFn: (f: FormState) =>
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Failed to add item");
        return json;
      }),
    onSuccess: (result) => {
      qc.setQueryData<WishlistData>(["wishlist"], (old) =>
        old ? { ...old, items: [...old.items, result.item] } : old
      );
      setForm(emptyForm);
      setAddOpen(false);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/wishlist/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["wishlist"] });
      const prev = qc.getQueryData<WishlistData>(["wishlist"]);
      qc.setQueryData<WishlistData>(["wishlist"], (old) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== id) } : old
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(["wishlist"], ctx?.prev);
    },
  });

  const saveEdit = useMutation({
    mutationFn: ({ id, f }: { id: string; f: FormState }) =>
      fetch(`/api/wishlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      }).then((r) => r.json()),
    onSuccess: (result) => {
      qc.setQueryData<WishlistData>(["wishlist"], (old) =>
        old
          ? { ...old, items: old.items.map((i) => (i.id === result.item.id ? result.item : i)) }
          : old
      );
      setEditId(null);
    },
  });

  const startEdit = (item: WishlistItem) => {
    setEditId(item.id);
    setEditForm({
      title: item.title,
      description: item.description ?? "",
      url: item.url ?? "",
      priceRange: item.priceRange ?? "",
    });
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-rose-400 text-sm mb-4">{error.message}</p>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["wishlist"] })}
            className="text-gold hover:text-gold-bright text-sm underline touch-manipulation"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const items = data?.items ?? [];
  const showWishlist = data?.showWishlist ?? false;

  return (
    <div className="min-h-screen bg-canvas text-cream">
      <nav className="border-b border-[rgba(242,193,78,0.08)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="text-gold w-5 h-5" />
          <span className="font-fraunces text-lg font-bold text-cream tracking-tight">Wishlist</span>
        </div>
        <Link href="/dashboard" className="text-stone hover:text-cream text-sm transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <main className="max-w-lg mx-auto px-6 py-10 space-y-6">

        {/* Visibility toggle */}
        <div className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-cream font-medium text-sm">Show on my birthday page</p>
            <p className="text-stone text-xs mt-0.5">
              {showWishlist
                ? "Visitors can see your wishlist and claim items."
                : "Your wishlist is hidden from visitors."}
            </p>
          </div>
          <button
            onClick={() => toggleVisibility.mutate(!showWishlist)}
            disabled={toggleVisibility.isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all touch-manipulation ${
              showWishlist
                ? "bg-[rgba(242,193,78,0.15)] border border-[rgba(242,193,78,0.3)] text-gold"
                : "bg-pitch border border-[rgba(255,255,255,0.08)] text-stone hover:text-cream"
            }`}
          >
            {showWishlist ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showWishlist ? "Visible" : "Hidden"}
          </button>
        </div>

        {/* Items list */}
        <div className="space-y-3">
          {items.length === 0 && !addOpen && (
            <div className="glass rounded-2xl p-10 text-center">
              <Star className="w-8 h-8 text-gold opacity-40 mx-auto mb-3" />
              <p className="text-stone text-sm">No items yet — add things you&apos;d love!</p>
            </div>
          )}

          {items.map((item) =>
            editId === item.id ? (
              <div key={item.id} className="glass rounded-2xl p-5 space-y-3">
                <input
                  autoFocus
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Item name *"
                  className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                />
                <input
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                />
                <div className="flex gap-2">
                  <input
                    value={editForm.url}
                    onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="Link (optional)"
                    className="flex-1 bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                  />
                  <input
                    value={editForm.priceRange}
                    onChange={(e) => setEditForm((f) => ({ ...f, priceRange: e.target.value }))}
                    placeholder="Price (optional)"
                    className="w-28 bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setEditId(null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone hover:text-cream text-sm transition-colors touch-manipulation"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={() => saveEdit.mutate({ id: editId!, f: editForm })}
                    disabled={saveEdit.isPending || !editForm.title.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gold hover:bg-gold-bright disabled:opacity-50 text-canvas text-sm font-medium rounded-xl transition-all touch-manipulation"
                  >
                    {saveEdit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div key={item.id} className="glass rounded-2xl p-5 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-cream font-medium text-sm truncate">{item.title}</p>
                    {item.isPurchased && (
                      <span className="text-xs bg-[rgba(74,222,128,0.12)] border border-[rgba(74,222,128,0.25)] text-green-400 px-2 py-0.5 rounded-full">
                        Claimed
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-stone text-xs mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {item.priceRange && (
                      <span className="text-gold text-xs font-medium">{item.priceRange}</span>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-stone hover:text-gold text-xs transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> View link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 text-stone hover:text-cream rounded-lg transition-colors touch-manipulation"
                    aria-label="Edit item"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteItem.mutate(item.id)}
                    disabled={deleteItem.isPending}
                    className="p-2 text-stone hover:text-rose-400 rounded-lg transition-colors touch-manipulation"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          )}

          {/* Add form */}
          {addOpen ? (
            <div className="glass rounded-2xl p-5 space-y-3 animate-fade-rise">
              <p className="text-cream font-medium text-sm">New item</p>
              <input
                autoFocus
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && addItem.mutate(form)}
                placeholder="Item name *"
                maxLength={120}
                className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
              />
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description (optional)"
                className="w-full bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
              />
              <div className="flex gap-2">
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="Link (optional)"
                  className="flex-1 bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                />
                <input
                  value={form.priceRange}
                  onChange={(e) => setForm((f) => ({ ...f, priceRange: e.target.value }))}
                  placeholder="~$50"
                  className="w-24 bg-[rgba(11,11,13,0.8)] border border-pitch focus:border-[rgba(242,193,78,0.45)] rounded-xl px-4 py-2.5 text-cream placeholder-ghost outline-none text-sm"
                />
              </div>
              {addItem.error && (
                <p className="text-rose-400 text-xs">{(addItem.error as Error).message}</p>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setAddOpen(false); setForm(emptyForm); addItem.reset(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-stone hover:text-cream text-sm transition-colors touch-manipulation"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={() => addItem.mutate(form)}
                  disabled={addItem.isPending || !form.title.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gold hover:bg-gold-bright disabled:opacity-50 text-canvas text-sm font-medium rounded-xl transition-all touch-manipulation"
                >
                  {addItem.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </button>
              </div>
            </div>
          ) : (
            items.length < 20 && (
              <button
                onClick={() => setAddOpen(true)}
                className="w-full flex items-center justify-center gap-2 border border-dashed border-[rgba(242,193,78,0.2)] hover:border-[rgba(242,193,78,0.4)] text-stone hover:text-gold rounded-2xl p-4 text-sm transition-all touch-manipulation"
              >
                <Plus className="w-4 h-4" /> Add item
              </button>
            )
          )}
        </div>

        {items.length >= 20 && (
          <p className="text-ghost text-xs text-center">Maximum 20 items reached.</p>
        )}
      </main>
    </div>
  );
}
