import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
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
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(242,193,78,0.13) 0%, transparent 65%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <div style={{ fontSize: 96, marginBottom: 28 }}>🎂</div>

        <div
          style={{
            fontSize: 26,
            fontWeight: 600,
            color: "#F2C14E",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 22,
          }}
        >
          BirthdayWhisper
        </div>

        <div
          style={{
            fontSize: 58,
            fontWeight: 700,
            color: "#F4F1EA",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: 22,
            maxWidth: 920,
          }}
        >
          The messages they&apos;ll never expect.
        </div>

        <div
          style={{
            fontSize: 26,
            color: "#9A968C",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Secret birthday messages — sealed until your special day.
        </div>
      </div>
    ),
    { ...size }
  );
}
