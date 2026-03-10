import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const SITE = "https://gitroast.princepal.dev";

  // Fetch basic GitHub user for name (lightweight, no roast computation)
  let name = username;
  let bio = "Get your AI threat level scored 0–10";
  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: { "Accept": "application/vnd.github.v3+json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const user = await res.json();
      name = user.name || username;
      bio = user.bio || bio;
    }
  } catch { /* use defaults */ }

  const title = `${name} (@${username}) — GitRoast`;
  const description = `Will AI replace ${name}? Brutal honest score 0–10 based on their real GitHub profile.`;
  const ogImageUrl = `${SITE}/api/og?username=${encodeURIComponent(username)}&name=${encodeURIComponent(name)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/roast/${username}`,
      siteName: "GitRoast",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} AI threat score — GitRoast`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      site: "@prince_twets",
    },
  };
}

export default function RoastLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
