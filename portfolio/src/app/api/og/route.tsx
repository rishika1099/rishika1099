import { ImageResponse } from "next/og";

export const runtime = "nodejs";

// Dynamic Open Graph card: /api/og?title=...&label=... renders a branded,
// pastel preview image so shared links look lovely.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") ?? "Rishika Mamidibathula").slice(0, 140);
  const label = (url.searchParams.get("label") ?? "rishika-m.netlify.app").slice(0, 60);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundImage:
            "linear-gradient(135deg, #f7b7c9 0%, #f6d99b 30%, #cdeac0 60%, #cfe8f3 82%, #e6d7f5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#4a4a5e", fontSize: 30, fontWeight: 700 }}>
          <span
            style={{
              display: "flex",
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#c77dba",
            }}
          />
          <span>Rishika Mamidibathula</span>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 70 ? 60 : 78,
            fontWeight: 800,
            color: "#3a3a4e",
            lineHeight: 1.12,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#5a5a70", fontSize: 28, fontWeight: 600 }}>
          <span
            style={{
              display: "flex",
              padding: "8px 20px",
              background: "rgba(255,255,255,0.7)",
              borderRadius: 999,
            }}
          >
            {label}
          </span>
          <span>✦</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
