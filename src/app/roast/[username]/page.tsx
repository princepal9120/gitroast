"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface SubScore {
  score: number;
  description: string;
}

interface RoastData {
  username: string;
  name: string;
  bio: string | null;
  avatarUrl: string;
  overallScore: number;
  threatTitle: string;
  mainRoast: string;
  subScores: {
    technicalSkills: SubScore;
    aiAdaptability: SubScore;
    careerMoat: SubScore;
    marketPositioning: SubScore;
  };
}

function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round(current * 10) / 10);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <>{display.toFixed(1)}</>;
}

function ProgressBar({ score, delay = 0 }: { score: number; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(score * 10), delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const color = score >= 8.5 ? "bg-red-500" : score >= 7 ? "bg-orange-500" : "bg-yellow-500";

  return (
    <div className="h-1.5 bg-gray-200 w-full">
      <div
        className={`h-full ${color} transition-all duration-1000 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 18);
    return () => clearInterval(timer);
  }, [text]);

  return <>{displayed}</>;
}

const SUB_SCORE_LABELS: Record<string, string> = {
  technicalSkills: "TECHNICAL SKILLS",
  aiAdaptability: "AI ADAPTABILITY",
  careerMoat: "CAREER MOAT",
  marketPositioning: "MARKET POSITIONING",
};

export default function RoastPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [data, setData] = useState<RoastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const fetchRoast = async () => {
      try {
        const res = await fetch("/api/roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || "Failed to roast");
        } else {
          setData(json);
          setTimeout(() => setShowContent(true), 300);
        }
      } catch {
        setError("Network error — try again");
      } finally {
        setLoading(false);
      }
    };

    fetchRoast();
  }, [username]);

  const shareText = data
    ? `I got roasted by AI. My threat score: ${data.overallScore}/10 — "${data.threatTitle}" 💀\n\nGet yours at gitroast-inky.vercel.app`
    : "Get your AI threat level at GitRoast";

  const shareOnX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://gitroast-inky.vercel.app")}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-sm uppercase tracking-widest text-gray-400 mb-4 animate-pulse">
            SCANNING YOUR CAREER...
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center">
        <div className="text-center max-w-sm px-6">
          <p className="font-mono text-sm uppercase tracking-widest text-red-500 mb-4">ERROR</p>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="border border-gray-900 text-gray-900 px-6 py-2 text-sm font-mono uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.overallScore >= 8.5 ? "text-red-500" : "text-orange-500";

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <header className="border-b border-gray-200 bg-[#F8F4ED]">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="font-display font-bold text-lg tracking-tight hover:opacity-70 transition-opacity">
            GitRoast
          </button>
          <span className="bg-orange-500 text-white text-xs font-mono px-2 py-1 rounded-sm font-semibold tracking-wider">v2.0</span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-8">
        {/* Profile */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center font-bold text-lg rounded-sm">
            {data.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900">{data.name}</p>
            <p className="text-sm text-gray-400 font-mono">{data.bio || "Software Engineer"}</p>
          </div>
        </div>

        {/* Main card */}
        <div
          className={`border border-gray-200 bg-white p-8 mb-6 transition-all duration-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          {/* Score */}
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-gray-400 text-center mb-4">AI THREAT LEVEL</p>
          <div className={`text-center mb-1`}>
            <span className={`font-display font-black text-8xl ${scoreColor}`}>
              {showContent ? <AnimatedScore target={data.overallScore} /> : "0.0"}
            </span>
          </div>
          <p className={`text-center font-mono text-xs text-gray-400 mb-4`}>/ 10</p>

          {/* Progress bar under score */}
          <div className="mb-6">
            <ProgressBar score={data.overallScore} delay={600} />
          </div>

          {/* Threat title */}
          <p className={`text-center font-mono font-bold tracking-[0.15em] text-lg ${scoreColor} mb-6`}>
            {data.threatTitle}
          </p>

          {/* Main roast */}
          <div className="border-l-4 border-red-500 pl-4 mb-8">
            <p className="text-gray-700 leading-relaxed text-sm">
              {showContent ? <TypewriterText text={data.mainRoast} /> : ""}
            </p>
          </div>

          {/* Sub scores */}
          <div className="space-y-6">
            {Object.entries(data.subScores).map(([key, val], i) => {
              const subColor = val.score >= 8.5 ? "text-red-500" : val.score >= 7 ? "text-orange-500" : "text-yellow-500";
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono uppercase tracking-widest text-gray-500">{SUB_SCORE_LABELS[key]}</span>
                    <span className={`font-mono font-bold text-sm ${subColor}`}>{val.score}/10</span>
                  </div>
                  <ProgressBar score={val.score} delay={800 + i * 200} />
                  <p className="text-xs text-gray-400 mt-1.5">{val.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className={`space-y-3 transition-all duration-500 delay-300 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => router.push("/")}
            className="w-full border border-gray-900 text-gray-900 py-3 text-sm font-mono uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors"
          >
            Judge Another
          </button>

          <p className="text-center text-xs text-gray-400 font-mono py-1">Share your fate.</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={shareOnX}
              className="bg-gray-900 text-white py-3 text-sm font-mono uppercase tracking-widest hover:bg-gray-700 transition-colors"
            >
              SHARE ON X
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="border border-gray-900 text-gray-900 py-3 text-sm font-mono uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-colors"
            >
              SHARE ON LINKEDIN
            </button>
          </div>
        </div>

        {/* CTA Banner */}
        <div className={`mt-8 bg-gray-900 text-white p-8 text-center transition-all duration-500 delay-500 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-orange-400 mb-3">TIRED OF BEING REPLACEABLE?</p>
          <h3 className="font-display font-bold text-xl mb-2">Learn to Build AI Agents</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Stop being the API glue. Start building the agents that replace others.
          </p>
          <a
            href="https://github.com/princepal9120"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-orange-500 text-orange-400 px-6 py-2.5 text-sm font-mono uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-colors"
          >
            START BUILDING →
          </a>
        </div>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center mt-8">
        <p className="text-xs font-mono text-gray-400 tracking-wider uppercase">GitRoast — Powered by Groq + GitHub API</p>
      </footer>
    </div>
  );
}
