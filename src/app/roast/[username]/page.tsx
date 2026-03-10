"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface SubScore {
  score: number;
  description: string;
}

interface RoastData {
  username: string;
  name: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  followers: number;
  publicRepos: number;
  totalStars: number;
  avatarUrl: string;
  isEnhanced: boolean;
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
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const username = params.username as string;
  const useAuth = searchParams.get("auth") === "1";
  const [data, setData] = useState<RoastData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    // If expecting auth, wait for session to load
    if (useAuth && session === undefined) return;
    fetched.current = true;

    const fetchRoast = async () => {
      try {
        const body: { username: string; accessToken?: string } = { username };
        // Pass OAuth token if user is authenticated and roasting their own profile
        if (useAuth && session?.accessToken) {
          body.accessToken = session.accessToken;
        }

        const res = await fetch("/api/roast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
  }, [username, useAuth, session]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const SITE_URL = "https://gitroast.princepal.dev";
  const profileUrl = `${SITE_URL}/roast/${data?.username || username}`;

  // X/Twitter — native, lowercase, challenge format that spreads
  const xShareText = data ? [
    `ai just roasted my github 💀`,
    ``,
    `score: ${data.overallScore}/10`,
    `verdict: "${data.threatTitle}"`,
    ``,
    `bet you're higher. find out:`,
    profileUrl,
  ].join("\n") : "";

  // LinkedIn — professional framing, insight angle
  const linkedInShareText = data ? [
    `I ran my GitHub through an AI replaceability analyzer.`,
    ``,
    `Score: ${data.overallScore}/10`,
    `Verdict: "${data.threatTitle}"`,
    ``,
    `${data.mainRoast.slice(0, 120)}...`,
    ``,
    `Curious where you stand in the AI era?`,
    profileUrl,
  ].join("\n") : "";

  const shareOnX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(xShareText)}`, "_blank");
    setShowShareModal(false);
  };

  const shareOnLinkedIn = () => {
    // LinkedIn sharing with pre-filled text
    const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}&summary=${encodeURIComponent(linkedInShareText)}`;
    window.open(liUrl, "_blank");
    setShowShareModal(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
        {/* Profile — real GitHub card */}
        <div className={`border p-5 mb-6 ${data.isEnhanced ? "border-orange-300 bg-orange-50" : "border-gray-200 bg-white"}`}>
          {data.isEnhanced && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-orange-200">
              <span className="text-xs font-mono uppercase tracking-widest text-orange-600 font-bold">🔒 ENHANCED ANALYSIS — PRIVATE REPOS INCLUDED</span>
            </div>
          )}
          <div className="flex items-start gap-4">
            {/* Real avatar */}
            <div className="w-16 h-16 rounded-sm overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
              <Image
                src={data.avatarUrl}
                alt={data.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900 text-lg leading-tight">{data.name}</p>
                  <p className="text-sm text-gray-400 font-mono">@{data.username}</p>
                </div>
                <a
                  href={`https://github.com/${data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-gray-400 hover:text-gray-700 border border-gray-200 px-2 py-1 whitespace-nowrap transition-colors"
                >
                  GitHub ↗
                </a>
              </div>
              {data.bio && (
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{data.bio}</p>
              )}
              {/* Stats row */}
              <div className="flex flex-wrap gap-4 mt-3">
                {data.company && (
                  <span className="text-xs text-gray-400 font-mono">{data.company}</span>
                )}
                {data.location && (
                  <span className="text-xs text-gray-400 font-mono">📍 {data.location}</span>
                )}
                <span className="text-xs text-gray-400 font-mono">
                  <span className="text-gray-700 font-semibold">{data.followers.toLocaleString()}</span> followers
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  <span className="text-gray-700 font-semibold">{data.publicRepos}</span> repos
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  <span className="text-gray-700 font-semibold">{data.totalStars.toLocaleString()}</span> stars
                </span>
              </div>
            </div>
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
            onClick={() => setShowShareModal(true)}
            className="w-full bg-gray-900 text-white py-4 text-sm font-mono uppercase tracking-widest hover:bg-gray-700 transition-colors font-bold"
          >
            💀 SHARE YOUR VERDICT
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full border border-gray-300 text-gray-500 py-3 text-sm font-mono uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            Judge Another Profile
          </button>
        </div>

        {/* Share Modal */}
        {showShareModal && data && (
          <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
            <div className="bg-[#F8F4ED] w-full max-w-md border border-gray-200" onClick={(e) => e.stopPropagation()}>
              {/* Score preview card inside modal */}
              <div className="bg-gray-900 text-white p-6 text-center">
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="w-12 h-12 overflow-hidden border-2 border-gray-600">
                    <Image src={data.avatarUrl} alt={data.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold text-sm">{data.name}</div>
                    <div className="text-gray-400 font-mono text-xs">@{data.username}</div>
                  </div>
                </div>
                <div className={`text-5xl font-black mb-1 ${data.overallScore >= 8.5 ? "text-red-400" : data.overallScore >= 7 ? "text-orange-400" : "text-yellow-400"}`}>
                  {data.overallScore}/10
                </div>
                <div className={`font-mono font-bold text-sm tracking-widest mb-2 ${data.overallScore >= 8.5 ? "text-red-400" : data.overallScore >= 7 ? "text-orange-400" : "text-yellow-400"}`}>
                  {data.threatTitle}
                </div>
                <div className="text-gray-400 text-xs font-mono">gitroast.princepal.dev</div>
              </div>

              <div className="p-5 space-y-3">
                <p className="text-xs font-mono uppercase tracking-widest text-gray-400 text-center mb-4">SHARE YOUR VERDICT</p>

                {/* X share — preview the tweet text */}
                <div className="border border-gray-200 bg-white p-3 mb-1">
                  <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Post on X →</p>
                  <p className="text-gray-700 text-sm whitespace-pre-line font-mono leading-relaxed">{xShareText}</p>
                </div>
                <button
                  onClick={shareOnX}
                  className="w-full bg-gray-900 text-white py-3 text-sm font-mono uppercase tracking-widest hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  POST ON X / TWITTER
                </button>

                {/* LinkedIn */}
                <button
                  onClick={shareOnLinkedIn}
                  className="w-full border border-[#0077B5] text-[#0077B5] py-3 text-sm font-mono uppercase tracking-widest hover:bg-[#0077B5] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  SHARE ON LINKEDIN
                </button>

                {/* Copy link */}
                <button
                  onClick={copyLink}
                  className="w-full border border-gray-200 text-gray-600 py-3 text-sm font-mono uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-colors"
                >
                  {copied ? "✓ LINK COPIED!" : "🔗 COPY LINK"}
                </button>

                <button onClick={() => setShowShareModal(false)} className="w-full text-xs text-gray-400 font-mono py-2 hover:text-gray-700 transition-colors">
                  close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="border-t border-gray-200 py-6 text-center mt-8">
        <p className="text-xs font-mono text-gray-400 tracking-wider uppercase">GitRoast — Powered by Groq + GitHub API</p>
      </footer>
    </div>
  );
}
