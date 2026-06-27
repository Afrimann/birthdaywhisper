---
description: TanStack React Query patterns for this project — how to fetch, mutate, and cache data in client components alongside Next.js App Router server components.
---

# TanStack React Query — BirthdayWhisper Conventions

## Setup (already done)
- `@tanstack/react-query` is installed.
- `QueryProvider` wraps the app in `app/layout.tsx` via `app/_components/QueryProvider.tsx`.
- Default `staleTime` is 60 s, `retry` is 1.

---

## When to use React Query vs server components

| Scenario | Use |
|---|---|
| Initial page data (SEO matters, no interactivity) | Server component + `prisma` directly |
| Data that changes after user interaction (optimistic UI, polling) | `useQuery` in a client component |
| POST / PATCH / DELETE with loading + error state | `useMutation` |
| Data shared between sibling client components | `useQuery` with same key (auto-deduped) |

Rule of thumb: **prefer server components for first paint; reach for `useQuery` only when the data needs to update without a full navigation.**

---

## Fetching pattern

```tsx
"use client";
import { useQuery } from "@tanstack/react-query";

interface WishlistItem { id: string; title: string; /* ... */ }

function useWishlist() {
  return useQuery<{ items: WishlistItem[]; showWishlist: boolean }>({
    queryKey: ["wishlist"],
    queryFn: () => fetch("/api/wishlist").then((r) => r.json()),
  });
}

export default function WishlistPage() {
  const { data, isPending, error } = useWishlist();
  if (isPending) return <Spinner />;
  if (error) return <p>Failed to load.</p>;
  return <ul>{data.items.map(/* ... */)}</ul>;
}
```

**Key conventions:**
- Put the `useQuery` call inside a named hook (`useWishlist`, `useNotifications`, etc.) — not inline in the component.
- `queryKey` must be an array. Use `["resource"]` for collections, `["resource", id]` for single items.
- Always call `.then((r) => r.json())` — never `await r.json()` inside an async `queryFn` (keeps it concise).

---

## Mutation pattern

```tsx
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function AddItemForm() {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: (title: string) =>
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      }).then((r) => r.json()),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return (
    <button
      onClick={() => add.mutate("New item")}
      disabled={add.isPending}
    >
      {add.isPending ? "Adding…" : "Add"}
    </button>
  );
}
```

**Key conventions:**
- Always `invalidateQueries` in `onSuccess` to keep the cache fresh.
- Use `add.isPending` (not `add.isLoading`) — that name changed in v5.
- For optimistic updates, use `onMutate` + `onError` to rollback; only do this for high-frequency UX (reactions, claim toggles).

---

## Optimistic update pattern (reactions / claim toggle)

```tsx
const qc = useQueryClient();

const claim = useMutation({
  mutationFn: (id: string) =>
    fetch(`/api/wishlist/${id}/claim`, { method: "POST" }).then((r) => r.json()),

  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: ["wishlist"] });
    const prev = qc.getQueryData(["wishlist"]);
    qc.setQueryData(["wishlist"], (old: { items: WishlistItem[] }) => ({
      ...old,
      items: old.items.map((i) => (i.id === id ? { ...i, isPurchased: true } : i)),
    }));
    return { prev };
  },
  onError: (_err, _id, ctx) => {
    qc.setQueryData(["wishlist"], ctx?.prev);
  },
  onSettled: () => {
    qc.invalidateQueries({ queryKey: ["wishlist"] });
  },
});
```

---

## Key naming conventions for this project

| Data | Query key |
|---|---|
| Owner's wishlist | `["wishlist"]` |
| Notifications | `["notifications"]` |
| Following list | `["following"]` |
| User profile | `["profile"]` |
| Public birthday page | `["birthday", username]` |

---

## What NOT to do
- Do **not** create a `QueryClient` in a module-level singleton — the `QueryProvider` component already handles this correctly using `useState` to avoid shared state across requests.
- Do **not** use `useQuery` in server components — they can't use hooks.
- Do **not** use `queryKey: "wishlist"` (string) — must be `["wishlist"]` (array).
- Do **not** mix `useQuery` and manual `useState` for the same data slice.
