"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface Props {
  username: string;
  initialFollowing: boolean;
}

export default function FollowButton({ username, initialFollowing }: Props) {
  const qc = useQueryClient();
  const queryKey = ["following", username];

  // No GET /api/follow endpoint exists — the server component already
  // resolved this once, so seed the cache with it instead of refetching.
  const { data: following } = useQuery({
    queryKey,
    queryFn: () => initialFollowing,
    initialData: initialFollowing,
    staleTime: Infinity,
  });

  const toggle = useMutation({
    mutationFn: (isFollowing: boolean) =>
      fetch(`/api/follow/${username}`, {
        method: isFollowing ? "DELETE" : "POST",
      }).then((r) => r.json()),
    onMutate: async (isFollowing) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<boolean>(queryKey);
      qc.setQueryData(queryKey, !isFollowing);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(queryKey, ctx?.prev);
    },
  });

  return (
    <button
      onClick={() => toggle.mutate(following)}
      disabled={toggle.isPending}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
        following
          ? "border-[rgba(193,97,61,0.3)] bg-[rgba(193,97,61,0.08)] text-accent-500 hover:bg-[rgba(251,113,133,0.08)] hover:border-rose-400/30 hover:text-rose-400"
          : "border-[rgba(193,97,61,0.2)] bg-transparent text-accent-700 hover:border-[rgba(193,97,61,0.4)] hover:text-accent-900"
      }`}
    >
      {toggle.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {following ? "Following" : "Follow birthday"}
    </button>
  );
}
