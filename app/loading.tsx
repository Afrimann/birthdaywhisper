import { Gift } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-[rgba(212,83,126,0.12)] border-t-[rgba(212,83,126,0.7)] animate-spin" />
        <Gift className="absolute w-5 h-5 text-accent-500 opacity-50 animate-lantern" />
      </div>
    </div>
  );
}
