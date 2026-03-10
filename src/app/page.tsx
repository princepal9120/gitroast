"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Real GitHub profiles — pre-scored with savage but accurate roast lines
const FEATURED_PROFILES = [
  {
    username: "torvalds",
    name: "Linus Torvalds",
    role: "Creator · Linux & Git",
    score: 1.2,
    roast: "Your code runs on every server AI uses to replace other developers. You ARE the infrastructure. Genuinely untouchable.",
  },
  {
    username: "karpathy",
    name: "Andrej Karpathy",
    role: "AI Researcher · OpenAI, Tesla",
    score: 1.3,
    roast: "You wrote the textbook on neural networks, then went to build the exact thing replacing everyone else. Poetic, really.",
  },
  {
    username: "rauchg",
    name: "Guillermo Rauch",
    role: "CEO · Vercel",
    score: 1.8,
    roast: "Made deploying so easy that juniors ship to prod before they know what prod means. You're the landlord of the modern web.",
  },
  {
    username: "yyx990803",
    name: "Evan You",
    role: "Creator · Vue.js",
    score: 1.5,
    roast: "Built a whole framework because he wanted React without the Facebook smell. It worked. 200k GitHub stars say so.",
  },
  {
    username: "sindresorhus",
    name: "Sindre Sorhus",
    role: "OSS · 1,000+ packages",
    score: 2.1,
    roast: "1,000+ npm packages and AI still can't replicate his taste. You've been installing his work without knowing his name.",
  },
  {
    username: "mojombo",
    name: "Tom Preston-Werner",
    role: "Co-founder · GitHub",
    score: 1.8,
    roast: "Co-built the platform everyone uses to pretend they're productive. You literally can't replace the person who made your profile exist.",
  },
  {
    username: "gaearon",
    name: "Dan Abramov",
    role: "React Core Team",
    score: 2.3,
    roast: "Invented useEffect and spent 5 years writing essays explaining why everyone used it wrong. The essay still applies to you.",
  },
  {
    username: "kamranahmedse",
    name: "Kamran Ahmed",
    role: "Creator · Developer Roadmap",
    score: 2.4,
    roast: "Built the Roadmap because developers were too lost to find a path. Now AI just tells them what to learn anyway.",
  },
  {
    username: "donnemartin",
    name: "Donne Martin",
    role: "System Design Primer",
    score: 2.8,
    roast: "Made System Design Primer because nobody could explain it clearly. 200k stars later, AI still references your repo.",
  },
  {
    username: "tj",
    name: "TJ Holowaychuk",
    role: "Creator · Express, Koa",
    score: 1.9,
    roast: "Built Express, Koa, and half of Node.js ecosystem then disappeared to write Go. The most productive ghost in tech history.",
  },
  {
    username: "wesbos",
    name: "Wes Bos",
    role: "Educator · JavaScript",
    score: 3.8,
    roast: "Turned teaching JavaScript into a 7-figure business before AI could do it for free. Timing is a real skill.",
  },
  {
    username: "steven-tey",
    name: "Steven Tey",
    role: "Founder · Dub.co",
    score: 3.2,
    roast: "Building so deep in the Vercel ecosystem that his entire portfolio is a Next.js demo. Beautiful, but also a single point of failure.",
  },
];

// Shown in the social proof avatar strip (all 20)
const ALL_PROFILES_STRIP = [
  "torvalds","karpathy","rauchg","yyx990803","sindresorhus","gaearon",
  "kamranahmedse","donnemartin","tj","wesbos","kentcdodds","paulirish",
  "mojombo","steven-tey","JakeWharton","florinpop17","kennethreitz","trevnorris",
];

function scoreColor(score: number) {
  if (score >= 8.5) return "text-red-500";
  if (score >= 7.0) return "text-orange-500";
  if (score >= 5.0) return "text-yellow-600";
  return "text-green-600";
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const clean = username
      .replace(/^https?:\/\//i, "")
      .replace(/^github\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/$/, "")
      .trim();
    if (!clean) return;
    setLoading(true);
    router.push(`/roast/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-[#F8F4ED]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-tight">GitRoast</span>
          <span className="bg-orange-500 text-white text-xs font-mono px-2 py-1 rounded-sm font-semibold tracking-wider">v2.0</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6">
        {/* Hero */}
        <div className="pt-16 pb-12 text-center">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-500 mb-6">GITROAST</p>
          <h1 className="font-display text-6xl sm:text-7xl font-black leading-[1.0] tracking-tight text-[#111111] mb-8">
            WILL AI<br />REPLACE YOU?
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto mb-10">
            Drop your GitHub username. We&apos;ll calculate exactly how fucked you are in the AI economy. Brutally honest. Zero filter.
          </p>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex border border-gray-900 bg-white">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="github.com/username"
                className="flex-1 px-4 py-3.5 bg-transparent text-gray-900 placeholder-gray-400 text-base outline-none font-mono"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="bg-gray-900 text-white px-6 py-3.5 text-sm font-bold tracking-widest uppercase hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
              >
                {loading ? "LOADING..." : "JUDGE ME"}
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-400 font-mono mb-8">
            Go to your GitHub profile → copy your username from the URL
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {ALL_PROFILES_STRIP.slice(0, 10).map((u) => (
                <div key={u} className="w-7 h-7 rounded-full border-2 border-[#F8F4ED] overflow-hidden bg-gray-200">
                  <Image
                    src={`https://github.com/${u}.png?size=28`}
                    alt={u}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-mono">+2,847 developers judged</span>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { num: "01", label: "DROP YOUR\nGITHUB" },
            { num: "02", label: "AI READS\nYOUR REPOS" },
            { num: "03", label: "GET YOUR\nTHREAT LEVEL" },
          ].map((step) => (
            <div key={step.num} className="border border-gray-200 bg-white p-6 text-center">
              <div className="text-2xl font-bold font-mono text-gray-800 mb-2">{step.num}</div>
              <div className="text-xs font-mono tracking-widest text-gray-500 uppercase leading-relaxed whitespace-pre-line">{step.label}</div>
            </div>
          ))}
        </div>

        {/* Featured Profiles */}
        <div className="mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 text-center mb-2">ALREADY JUDGED</p>
          <p className="text-center text-xs text-gray-400 font-mono mb-8">Click any card to see their full roast</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURED_PROFILES.map((profile) => (
              <button
                key={profile.username}
                onClick={() => router.push(`/roast/${profile.username}`)}
                className="border border-gray-200 bg-white p-5 text-left hover:border-gray-400 transition-colors group w-full"
              >
                {/* Profile header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <Image
                      src={`https://github.com/${profile.username}.png?size=80`}
                      alt={profile.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{profile.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">@{profile.username} · {profile.role}</div>
                  </div>
                  <div className={`font-bold font-mono text-lg flex-shrink-0 ${scoreColor(profile.score)} text-right`}>
                    <span className="text-xs text-gray-300">~</span>{profile.score}
                  </div>
                </div>

                {/* Roast */}
                <p className="text-gray-500 text-sm leading-relaxed">
                  &ldquo;{profile.roast}&rdquo;
                </p>

                {/* Hover CTA */}
                <p className="text-xs font-mono text-gray-300 group-hover:text-orange-400 mt-3 transition-colors tracking-wider uppercase">
                  See full roast →
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center">
        <p className="text-xs font-mono text-gray-400 tracking-wider uppercase">GitRoast — Powered by Groq + GitHub API</p>
      </footer>
    </div>
  );
}
