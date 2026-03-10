import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "GitRoast — Will AI Replace You?",
  description: "Drop your GitHub username. We'll calculate exactly how fucked you are in the AI economy. Brutally honest. Zero filter.",
  metadataBase: new URL("https://gitroast.princepal.dev"),
  openGraph: {
    title: "GitRoast — Will AI Replace You?",
    description: "Get your AI threat level scored 0–10 with a brutal roast of your GitHub profile.",
    type: "website",
    url: "https://gitroast.princepal.dev",
    siteName: "GitRoast",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitRoast — Will AI Replace You?",
    description: "Get your AI threat level scored 0–10 with a brutal roast of your GitHub profile.",
    site: "@prince_twets",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F8F4ED]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
