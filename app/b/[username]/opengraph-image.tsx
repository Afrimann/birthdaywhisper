import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user
    .findUnique({ where: { username }, select: { displayName: true } })
    .catch(() => null);

  const name = user?.displayName ?? "Someone special";
  const firstName = name.split(" ")[0];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B0B0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Gold glow blob */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(242,193,78,0.12) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Cake emoji */}
        <div style={{ fontSize: 80, marginBottom: 24 }}>🎂</div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#F4F1EA",
            textAlign: "center",
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          Leave {firstName} a birthday whisper
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 26,
            color: "#9A968C",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          Sealed until their birthday · Only they can open it
        </div>

        {/* Brand */}
        <div
          style={{
            fontSize: 22,
            color: "#F2C14E",
            fontWeight: 600,
            letterSpacing: 2,
          }}
        >
          BirthdayWhisper
        </div>
      </div>
    ),
    { ...size }
  );
}
