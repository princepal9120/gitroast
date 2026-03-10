import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "developer";
  const name = searchParams.get("name") || username;

  // Fetch avatar as base64 for reliable rendering in edge
  let avatarSrc = "";
  try {
    const avatarRes = await fetch(`https://github.com/${username}.png?size=200`);
    if (avatarRes.ok) {
      const buf = await avatarRes.arrayBuffer();
      const b64 = Buffer.from(buf).toString("base64");
      avatarSrc = `data:image/jpeg;base64,${b64}`;
    }
  } catch { /* use placeholder */ }

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
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div style={{ position: "absolute", top: 40, left: 64, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "#111111" }}>GitRoast</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "white", background: "#F97316", padding: "3px 8px", letterSpacing: "0.1em" }}>v2.0</span>
        </div>

        {/* Avatar + name */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginBottom: 32 }}>
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              width={130}
              height={130}
              style={{ width: 130, height: 130, objectFit: "cover", border: "4px solid #111111" }}
              alt={name}
            />
          ) : (
            <div style={{ width: 130, height: 130, background: "#111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 56, color: "white", fontWeight: 900 }}>
                {(name.charAt(0) || "G").toUpperCase()}
              </span>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#111111" }}>{name}</span>
            <span style={{ fontSize: 16, color: "#9CA3AF", fontFamily: "monospace" }}>@{username}</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, marginBottom: 32 }}>
          <span style={{ fontSize: 68, fontWeight: 900, color: "#111111", lineHeight: 1.0 }}>WILL AI</span>
          <span style={{ fontSize: 68, fontWeight: 900, color: "#F97316", lineHeight: 1.0 }}>REPLACE YOU?</span>
        </div>

        {/* CTA box */}
        <div style={{ display: "flex", border: "2px solid #111111", padding: "12px 32px" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111111", letterSpacing: "0.12em", fontFamily: "monospace" }}>
            FIND OUT AT GITROAST.PRINCEPAL.DEV
          </span>
        </div>

        {/* Bottom right */}
        <span style={{ position: "absolute", bottom: 36, right: 64, fontSize: 13, color: "#9CA3AF", fontFamily: "monospace" }}>
          gitroast.princepal.dev
        </span>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
