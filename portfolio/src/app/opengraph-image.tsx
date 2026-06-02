import { ImageResponse } from "next/og";

export const alt = "Rishika Mamidibathula — Data Scientist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Statically generated at build time and cached, so this costs no per-request
// function invocations. It gives every shared link a soft pastel preview card.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #cfe8f3 0%, #e6d7f5 45%, #ffd9c0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* decorative soft blooms */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 90,
            width: 180,
            height: 180,
            borderRadius: 999,
            background: "rgba(247,183,201,0.55)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 220,
            width: 110,
            height: 110,
            borderRadius: 999,
            background: "rgba(191,233,214,0.6)",
            display: "flex",
          }}
        />

        <div style={{ display: "flex", fontSize: 30, color: "#6f6f86", letterSpacing: 1 }}>
          rishika-m.netlify.app
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 92,
            fontWeight: 800,
            color: "#4a4a5e",
            lineHeight: 1.05,
          }}
        >
          Rishika Mamidibathula
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 40,
            color: "#4a4a5e",
            opacity: 0.85,
          }}
        >
          Data Scientist · LLM systems · causal inference · NYC
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 28,
            color: "#6f6f86",
          }}
        >
          projects, writing, poems & photography
        </div>
      </div>
    ),
    { ...size },
  );
}
