import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// Use nodejs runtime for reliable image rendering
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "developer";
  const name = searchParams.get("name") || username;
  const score = searchParams.get("score") || "?";
  const title = searchParams.get("title") || "AI THREAT UNKNOWN";
  const avatarUrl = `https://github.com/${username}.png?size=120`;

  const scoreNum = parseFloat(score);
  const scoreColor =
    scoreNum >= 8.5 ? "#EF4444" : scoreNum >= 7.0 ? "#F97316" : scoreNum >= 5.0 ? "#EAB308" : "#22C55E";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#F8F4ED",
          display: "flex",
          flexDirection: "column",
          fontFamily: "serif",
          position: "relative",
          border: "1px solid #E5E7EB",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "32px 64px 0",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>
            GitRoast
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "white",
              background: "#F97316",
              padding: "4px 10px",
              letterSpacing: "0.1em",
            }}
          >
            v2.0
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "32px 64px",
            gap: "60px",
          }}
        >
          {/* Left: Avatar + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              width={140}
              height={140}
              style={{
                width: "140px",
                height: "140px",
                objectFit: "cover",
                border: "3px solid #111111",
              }}
              alt={name}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111111" }}>{name}</div>
              <div style={{ fontSize: 16, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>
                @{username}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "2px", height: "280px", background: "#E5E7EB" }} />

          {/* Right: Score + title + roast label */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Label */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#9CA3AF",
                letterSpacing: "0.2em",
                fontFamily: "monospace",
              }}
            >
              AI THREAT LEVEL
            </div>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: 120, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
                {score}
              </span>
              <span style={{ fontSize: 32, color: "#9CA3AF", fontFamily: "monospace" }}>/10</span>
            </div>

            {/* Score bar */}
            <div style={{ width: "100%", height: "6px", background: "#E5E7EB", display: "flex" }}>
              <div
                style={{
                  width: `${Math.min(100, scoreNum * 10)}%`,
                  height: "6px",
                  background: scoreColor,
                }}
              />
            </div>

            {/* Threat title */}
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: scoreColor,
                letterSpacing: "0.08em",
                fontFamily: "monospace",
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px 32px",
            borderTop: "1px solid #E5E7EB",
            paddingTop: "20px",
          }}
        >
          <span style={{ fontSize: 14, color: "#9CA3AF", fontFamily: "monospace", letterSpacing: "0.1em" }}>
            WILL AI REPLACE YOU?
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#111111",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            gitroast.princepal.dev
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
