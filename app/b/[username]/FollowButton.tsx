"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface Props {
  username: string;
  initialFollowing: boolean;
}

export default function FollowButton({ username, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${username}`, {
        method: following ? "DELETE" : "POST",
      });
      if (res.ok) setFollowing((f) => !f);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] ${
        following
          ? "border-[rgba(242,193,78,0.3)] bg-[rgba(242,193,78,0.08)] text-gold hover:bg-[rgba(251,113,133,0.08)] hover:border-rose-400/30 hover:text-rose-400"
          : "border-[rgba(242,193,78,0.2)] bg-transparent text-stone hover:border-[rgba(242,193,78,0.4)] hover:text-cream"
      }`}
    >
      {loading ? (
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
