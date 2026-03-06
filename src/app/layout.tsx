import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitRoast — Will AI Replace You?",
  description: "Drop your GitHub username. We'll calculate exactly how fucked you are in the AI economy. Brutally honest. Zero filter.",
  openGraph: {
    title: "GitRoast — Will AI Replace You?",
    description: "Get your AI threat level scored 0–10 with a brutal roast of your GitHub profile.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitRoast — Will AI Replace You?",
    description: "Get your AI threat level scored 0–10 with a brutal roast of your GitHub profile.",
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
        {children}
      </body>
    </html>
  );
}
