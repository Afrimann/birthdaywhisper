import { createAvatar } from "@dicebear/core";
import { personas, thumbs } from "@dicebear/collection";
import type { Options as PersonasOptions } from "@dicebear/personas";

export type AvatarGender = "MASCULINE" | "FEMININE";

interface GiftAvatar {
  seed: string;
  gender: AvatarGender;
  hair: NonNullable<PersonasOptions["hair"]>[number];
  facialHairProbability: number;
}

// Curated so each seed renders a stable, recognizably masculine- or
// feminine-presenting avatar via personas' hair/facialHair options —
// DiceBear seeds alone don't imply gender, the style options do.
export const GIFT_AVATARS: GiftAvatar[] = [
  { seed: "gift-m-1", gender: "MASCULINE", hair: "shortCombover", facialHairProbability: 60 },
  { seed: "gift-m-2", gender: "MASCULINE", hair: "buzzcut",       facialHairProbability: 60 },
  { seed: "gift-m-3", gender: "MASCULINE", hair: "fade",          facialHairProbability: 40 },
  { seed: "gift-m-4", gender: "MASCULINE", hair: "sideShave",     facialHairProbability: 60 },
  { seed: "gift-m-5", gender: "MASCULINE", hair: "bald",          facialHairProbability: 50 },
  { seed: "gift-m-6", gender: "MASCULINE", hair: "mohawk",        facialHairProbability: 30 },
  { seed: "gift-f-1", gender: "FEMININE",  hair: "long",          facialHairProbability: 0 },
  { seed: "gift-f-2", gender: "FEMININE",  hair: "curlyBun",      facialHairProbability: 0 },
  { seed: "gift-f-3", gender: "FEMININE",  hair: "bobCut",        facialHairProbability: 0 },
  { seed: "gift-f-4", gender: "FEMININE",  hair: "pigtails",      facialHairProbability: 0 },
  { seed: "gift-f-5", gender: "FEMININE",  hair: "straightBun",   facialHairProbability: 0 },
  { seed: "gift-f-6", gender: "FEMININE",  hair: "extraLong",     facialHairProbability: 0 },
];

export function avatarDataUri(seed: string): string {
  const avatar = GIFT_AVATARS.find((a) => a.seed === seed) ?? GIFT_AVATARS[0];
  return createAvatar(personas, {
    seed: avatar.seed,
    hair: [avatar.hair],
    facialHairProbability: avatar.facialHairProbability,
  }).toDataUri();
}

// Deterministic per-user fallback avatar (no uploaded photo) — seed with a
// stable identifier (user id) so it doesn't reshuffle on every render, and
// tint it with the site's own palette instead of dicebear's defaults so it
// doesn't clash with everything around it.
export function fallbackAvatarDataUri(seed: string): string {
  return createAvatar(thumbs, {
    seed,
    backgroundColor: ["E3A97F", "D68A5F", "E4E6D3", "E8DFCF", "F0DFCF"],
    shapeColor: ["C1613D", "6F7A4A", "86432A", "57603A"],
  }).toDataUri();
}
