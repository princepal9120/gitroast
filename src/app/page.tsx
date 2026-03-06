"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RECENTLY_JUDGED = [
  { role: "Full Stack Dev", yoe: 4, score: 8.4, roast: "You built 47 CRUD apps and called it experience." },
  { role: "Product Manager", yoe: 3, score: 8.1, roast: "You turned 'being in meetings' into a fucking career path." },
  { role: "ML Engineer", yoe: 2, score: 9.1, roast: "You fine-tuned a model on 200 samples. That's just vibes with math." },
  { role: "Frontend Dev", yoe: 7, score: 7.8, roast: "v0 does your entire sprint before you finish your standup." },
  { role: "Data Analyst", yoe: 5, score: 8.4, roast: "Your entire career is a for-loop that Claude runs for fun." },
  { role: "DevOps Engineer", yoe: 5, score: 6.3, roast: "Kubernetes admin in 2026 is just a glorified YAML editor." },
  { role: "Backend Engineer", yoe: 3, score: 7.9, roast: "Your entire value prop is knowing which Stack Overflow answer to copy." },
  { role: "QA Engineer", yoe: 4, score: 7.5, roast: "You find bugs manually. That's like washing dishes by hand in 2026." },
];

function ScoreColor(score: number) {
  if (score >= 8.5) return "text-red-500";
  if (score >= 7.0) return "text-orange-500";
  return "text-yellow-500";
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    const clean = username.replace("github.com/", "").replace("https://", "").replace("http://", "").replace("@", "").trim();
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
              {["bg-orange-400", "bg-blue-400", "bg-green-400", "bg-purple-400", "bg-red-400", "bg-yellow-400", "bg-pink-400", "bg-teal-400"].map((c, i) => (
                <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-[#F8F4ED]`} />
              ))}
            </div>
            <span className="text-sm text-gray-500 font-mono">+2,847 developers judged</span>
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-16">
          {[
            { num: "01", label: "DROP YOUR\nGITHUB" },
            { num: "02", label: "AI SCANS\nYOUR CODE" },
            { num: "03", label: "GET YOUR\nTHREAT LEVEL" },
          ].map((step) => (
            <div key={step.num} className="border border-gray-200 bg-white p-6 text-center">
              <div className="text-2xl font-bold font-mono text-gray-800 mb-2">{step.num}</div>
              <div className="text-xs font-mono tracking-widest text-gray-500 uppercase leading-relaxed whitespace-pre-line">{step.label}</div>
            </div>
          ))}
        </div>

        {/* Recently Judged */}
        <div className="mb-16">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 text-center mb-8">RECENTLY JUDGED</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {RECENTLY_JUDGED.map((item, i) => (
              <div key={i} className="border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-sm text-gray-900">{item.role}, {item.yoe} YOE</span>
                  <span className={`font-bold font-mono text-lg ${ScoreColor(item.score)}`}>{item.score}</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed">&ldquo;{item.roast}&rdquo;</p>
              </div>
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
