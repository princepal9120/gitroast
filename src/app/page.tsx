"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

const FEATURED_PROFILES = [
  { username: "torvalds", name: "Linus Torvalds", role: "Creator · Linux & Git", roast: "Your code runs on every server AI uses to replace other developers. You ARE the infrastructure." },
  { username: "karpathy", name: "Andrej Karpathy", role: "AI Researcher · OpenAI, Tesla", roast: "You wrote the textbook on neural networks, then went to build the exact thing replacing everyone else." },
  { username: "rauchg", name: "Guillermo Rauch", role: "CEO · Vercel", roast: "Made deploying so easy that juniors ship to prod before they know what prod means. You're the landlord." },
  { username: "yyx990803", name: "Evan You", role: "Creator · Vue.js", roast: "Built a whole framework because he wanted React without the Facebook smell. 200k stars say it worked." },
  { username: "sindresorhus", name: "Sindre Sorhus", role: "OSS · 1,000+ packages", roast: "1,000+ npm packages and AI still can't replicate his taste. You install his work without knowing his name." },
  { username: "mojombo", name: "Tom Preston-Werner", role: "Co-founder · GitHub", roast: "Co-built the platform everyone uses to pretend they're productive. You can't replace the person who made profiles exist." },
  { username: "gaearon", name: "Dan Abramov", role: "React Core Team", roast: "Invented useEffect and spent 5 years writing essays explaining why everyone used it wrong." },
  { username: "kamranahmedse", name: "Kamran Ahmed", role: "Creator · Developer Roadmap", roast: "Built the Roadmap because developers were too lost to find a path. Now AI tells them what to learn anyway." },
  { username: "donnemartin", name: "Donne Martin", role: "System Design Primer", roast: "Made System Design Primer because nobody could explain it clearly. 200k stars later, AI still references your repo." },
  { username: "tj", name: "TJ Holowaychuk", role: "Creator · Express, Koa", roast: "Built Express, Koa, half of Node.js ecosystem then disappeared to write Go. Most productive ghost in tech." },
  { username: "wesbos", name: "Wes Bos", role: "Educator · JavaScript", roast: "Turned teaching JavaScript into a 7-figure business before AI could do it for free. Timing is a real skill." },
  { username: "steven-tey", name: "Steven Tey", role: "Founder · Dub.co", roast: "Building so deep in the Vercel ecosystem that his entire portfolio is a Next.js demo. Single point of failure." },
];

const ALL_PROFILES_STRIP = [
  "torvalds","karpathy","rauchg","yyx990803","sindresorhus","gaearon",
  "kamranahmedse","donnemartin","tj","wesbos","kentcdodds","paulirish",
  "mojombo","steven-tey","JakeWharton","florinpop17","kennethreitz","trevnorris",
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const clean = username.replace(/^https?:\/\//i, "").replace(/^github\.com\//i, "").replace(/^@/, "").replace(/\/$/, "").trim();
    if (!clean) return;
    setLoading(true);
    router.push(`/roast/${clean}`);
  };

  const handleRoastMe = () => {
    if (session?.githubUsername) {
      setLoading(true);
      router.push(`/roast/${session.githubUsername}?auth=1`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-[#F8F4ED]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-tight">GitRoast</span>
          <div className="flex items-center gap-3">
            {status === "authenticated" && session ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-gray-200">
                  <Image src={`https://github.com/${session.githubUsername}.png?size=28`} alt="you" width={28} height={28} unoptimized />
                </div>
                <span className="text-xs font-mono text-gray-600">@{session.githubUsername}</span>
                <button onClick={() => signOut()} className="text-xs text-gray-400 hover:text-gray-700 font-mono transition-colors">sign out</button>
              </div>
            ) : (
              <button
                onClick={() => signIn("github")}
                className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 text-xs font-mono text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Sign in with GitHub
              </button>
            )}
            <span className="bg-orange-500 text-white text-xs font-mono px-2 py-1 rounded-sm font-semibold tracking-wider">v2.0</span>
          </div>
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

          {/* Auth CTA — show if logged in */}
          {status === "authenticated" && session?.githubUsername && (
            <div className="mb-6 border border-orange-200 bg-orange-50 p-4 text-center">
              <p className="text-xs font-mono text-orange-600 uppercase tracking-widest mb-3">
                LOGGED IN AS @{session.githubUsername} — FULL ACCESS ENABLED
              </p>
              <button
                onClick={handleRoastMe}
                disabled={loading}
                className="bg-gray-900 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? "LOADING..." : "ROAST MY FULL PROFILE (incl. private repos) →"}
              </button>
            </div>
          )}

          {/* Manual username input */}
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

          {/* Sign in prompt */}
          {status !== "authenticated" && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-xs text-gray-400 font-mono">or</span>
              <button
                onClick={() => signIn("github")}
                className="text-xs font-mono text-orange-500 hover:text-orange-700 underline transition-colors"
              >
                sign in with GitHub for private repo analysis →
              </button>
            </div>
          )}

          <p className="text-xs text-gray-400 font-mono mb-8">
            Go to your GitHub profile → copy your username from the URL
          </p>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex -space-x-2">
              {ALL_PROFILES_STRIP.slice(0, 10).map((u) => (
                <div key={u} className="w-7 h-7 rounded-full border-2 border-[#F8F4ED] overflow-hidden bg-gray-200">
                  <Image src={`https://github.com/${u}.png?size=28`} alt={u} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-mono">+2,847 developers judged</span>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { num: "01", label: "SIGN IN WITH\nGITHUB (OPTIONAL)" },
            { num: "02", label: "AI READS\nYOUR REPOS" },
            { num: "03", label: "GET YOUR\nTHREAT LEVEL" },
          ].map((step) => (
            <div key={step.num} className="border border-gray-200 bg-white p-6 text-center">
              <div className="text-2xl font-bold font-mono text-gray-800 mb-2">{step.num}</div>
              <div className="text-xs font-mono tracking-widest text-gray-500 uppercase leading-relaxed whitespace-pre-line">{step.label}</div>
            </div>
          ))}
        </div>

        {/* What you unlock with OAuth */}
        <div className="mb-12 border border-gray-200 bg-white p-6">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 mb-4">SIGN IN FOR DEEPER ANALYSIS</p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🔒", title: "Private repos", desc: "Your secret projects. We read them all." },
              { icon: "📝", title: "Private commits", desc: "Your real commit history, not just public." },
              { icon: "📊", title: "Full contribution graph", desc: "How consistent are you really?" },
              { icon: "🎯", title: "Accurate threat score", desc: "Based on your complete GitHub history." },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-lg flex-shrink-0">{f.icon}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{f.title}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          {status !== "authenticated" && (
            <button
              onClick={() => signIn("github")}
              className="mt-5 w-full flex items-center justify-center gap-2 border border-gray-900 bg-gray-900 text-white py-3 text-sm font-mono uppercase tracking-widest hover:bg-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              Connect GitHub — Unlock Full Roast
            </button>
          )}
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <Image src={`https://github.com/${profile.username}.png?size=80`} alt={profile.name} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 truncate">{profile.name}</div>
                    <div className="text-xs text-gray-400 font-mono truncate">@{profile.username} · {profile.role}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs font-mono text-gray-300 border border-gray-200 px-2 py-0.5 uppercase tracking-wider">click to judge</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">&ldquo;{profile.roast}&rdquo;</p>
                <p className="text-xs font-mono text-gray-300 group-hover:text-orange-400 mt-3 transition-colors tracking-wider uppercase">See full roast →</p>
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
