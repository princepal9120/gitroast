import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GitRoast — AI Threat Score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function OGImage({ params }: Props) {
  const { username } = await params;
  const avatarUrl = `https://github.com/${username}.png?size=200`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#F8F4ED",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
          position: "relative",
        }}
      >
        {/* Top label */}
        <div style={{ position: "absolute", top: 40, left: 64, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: "#111111", letterSpacing: "-0.02em" }}>GitRoast</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "white", background: "#F97316", padding: "3px 8px", letterSpacing: "0.1em" }}>v2.0</span>
        </div>

        {/* Center: Avatar + question */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
          {/* Avatar */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarUrl}
            width={140}
            height={140}
            style={{ width: 140, height: 140, objectFit: "cover", border: "4px solid #111111" }}
            alt={username}
          />
          {/* Username */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#111111" }}>@{username}</span>
          </div>

          {/* Big question */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#111111", lineHeight: 1.0, letterSpacing: "-0.02em" }}>WILL AI</span>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#F97316", lineHeight: 1.0, letterSpacing: "-0.02em" }}>REPLACE YOU?</span>
          </div>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 0, border: "2px solid #111111", padding: "12px 28px" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#111111", letterSpacing: "0.15em", fontFamily: "monospace" }}>
              FIND OUT AT GITROAST.PRINCEPAL.DEV
            </span>
          </div>
        </div>

        {/* Bottom watermark */}
        <div style={{ position: "absolute", bottom: 32, right: 64 }}>
          <span style={{ fontSize: 13, color: "#9CA3AF", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            gitroast.princepal.dev
          </span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
