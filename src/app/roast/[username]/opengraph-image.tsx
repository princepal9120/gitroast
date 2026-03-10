import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GitRoast — AI Threat Score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ username: string }>;
}

async function getRoastData(username: string) {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://gitroast.princepal.dev";
    const res = await fetch(`${baseUrl}/api/roast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
      next: { revalidate: 3600 }, // cache 1 hour
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function OGImage({ params }: Props) {
  const { username } = await params;
  const data = await getRoastData(username);

  const score = data?.overallScore ?? "?";
  const title = data?.threatTitle ?? "AI THREAT UNKNOWN";
  const name = data?.name ?? username;
  const avatarUrl = `https://github.com/${username}.png?size=120`;

  const scoreNum = typeof score === "number" ? score : parseFloat(score);
  const scoreColor =
    scoreNum >= 8.5 ? "#EF4444" : scoreNum >= 7.0 ? "#F97316" : scoreNum >= 5.0 ? "#EAB308" : "#22C55E";
  const scoreStr = typeof score === "number" ? score.toFixed(1) : String(score);

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
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "32px 64px 0" }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>GitRoast</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "white", background: "#F97316", padding: "4px 10px", letterSpacing: "0.1em" }}>
            v2.0
          </span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "32px 64px", gap: "60px" }}>
          {/* Left: Avatar + name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              width={140}
              height={140}
              style={{ width: "140px", height: "140px", objectFit: "cover", border: "3px solid #111111" }}
              alt={name}
            />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111111" }}>{name}</div>
              <div style={{ fontSize: 16, color: "#9CA3AF", fontFamily: "monospace", marginTop: 2 }}>@{username}</div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: "2px", height: "280px", background: "#E5E7EB" }} />

          {/* Right: Score */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.2em", fontFamily: "monospace" }}>
              AI THREAT LEVEL
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: 120, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{scoreStr}</span>
              <span style={{ fontSize: 32, color: "#9CA3AF", fontFamily: "monospace" }}>/10</span>
            </div>
            <div style={{ width: "100%", height: "6px", background: "#E5E7EB", display: "flex" }}>
              <div style={{ width: `${Math.min(100, scoreNum * 10)}%`, height: "6px", background: scoreColor }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor, letterSpacing: "0.08em", fontFamily: "monospace", lineHeight: 1.2 }}>
              {title}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 64px 32px", borderTop: "1px solid #E5E7EB" }}>
          <span style={{ fontSize: 14, color: "#9CA3AF", fontFamily: "monospace", letterSpacing: "0.1em" }}>WILL AI REPLACE YOU?</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111111", fontFamily: "monospace" }}>gitroast.princepal.dev</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
