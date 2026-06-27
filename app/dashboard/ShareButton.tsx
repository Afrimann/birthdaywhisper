"use client";
import { Share2 } from "lucide-react";

interface Props {
  url: string;
  title?: string;
}

export default function ShareButton({ url, title = "BirthdayWhisper" }: Props) {
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url).catch(() => null);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 flex items-center justify-center gap-2 border border-[rgba(242,193,78,0.15)] hover:border-[rgba(242,193,78,0.4)] text-stone hover:text-cream text-sm py-2.5 rounded-xl transition-all min-h-[44px]"
    >
      <Share2 className="w-4 h-4" /> Share
    </button>
  );
}
