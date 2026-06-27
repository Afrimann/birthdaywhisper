"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface Props {
  username: string;
  initialFollowing: boolean;
}

export default function FollowButton({ username, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);

  const toggle = useMutation({
    mutationFn: (isFollowing: boolean) =>
      fetch(`/api/follow/${username}`, {
        method: isFollowing ? "DELETE" : "POST",
      }).then((r) => r.json()),
    onMutate: (isFollowing) => {
      setFollowing(!isFollowing);
      return { prev: isFollowing };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) setFollowing(ctx.prev);
    },
  });

  return (
    <button
      onClick={() => toggle.mutate(following)}
      disabled={toggle.isPending}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
        following
          ? "border-[rgba(242,193,78,0.3)] bg-[rgba(242,193,78,0.08)] text-gold hover:bg-[rgba(251,113,133,0.08)] hover:border-rose-400/30 hover:text-rose-400"
          : "border-[rgba(242,193,78,0.2)] bg-transparent text-stone hover:border-[rgba(242,193,78,0.4)] hover:text-cream"
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
