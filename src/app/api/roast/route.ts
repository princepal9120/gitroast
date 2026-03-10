import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  company: string | null;
  blog: string | null;
  location: string | null;
  hireable: boolean | null;
  twitter_username: string | null;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  description: string | null;
  updated_at: string;
  pushed_at: string;
  created_at: string;
  size: number;
  open_issues_count: number;
  topics: string[];
  has_pages: boolean;
  homepage: string | null;
  default_branch: string;
  watchers_count: number;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    commits?: { message: string }[];
    action?: string;
  };
}

async function getReadme(fullName: string, headers: HeadersInit): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    return content
      .replace(/!\[.*?\]\(.*?\)/g, "")   // remove images
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // keep link text
      .replace(/<[^>]+>/g, "")            // strip HTML
      .replace(/`{3}[\s\S]*?`{3}/g, "[code block]") // replace code blocks
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return null;
  }
}

async function getRecentCommits(fullName: string, headers: HeadersInit): Promise<string[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=8`, { headers });
    if (!res.ok) return [];
    const commits = await res.json();
    return commits.map((c: { commit: { message: string } }) => c.commit.message.split("\n")[0]).slice(0, 8);
  } catch {
    return [];
  }
}

async function getLanguages(fullName: string, headers: HeadersInit): Promise<Record<string, number>> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/languages`, { headers });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username, accessToken } = await req.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    // Auth priority: OAuth token (user) > env GITHUB_TOKEN (app) > unauthenticated
    const token = accessToken || process.env.GITHUB_TOKEN;
    const isOAuth = !!accessToken; // User's OAuth token = access to private repos

    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "GitRoast/2.0",
    };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    // Fetch core data in parallel
    // If authenticated with OAuth, use /user for private data, otherwise /users/{username}
    const userEndpoint = isOAuth ? "https://api.github.com/user" : `https://api.github.com/users/${username}`;
    const reposEndpoint = isOAuth
      ? `https://api.github.com/user/repos?sort=pushed&per_page=100&visibility=all&affiliation=owner`
      : `https://api.github.com/users/${username}/repos?sort=pushed&per_page=100`;
    const eventsEndpoint = isOAuth
      ? `https://api.github.com/users/${username}/events?per_page=50`
      : `https://api.github.com/users/${username}/events/public?per_page=50`;

    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetch(userEndpoint, { headers }),
      fetch(reposEndpoint, { headers }),
      fetch(eventsEndpoint, { headers }),
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) return NextResponse.json({ error: "GitHub user not found. Double-check the username." }, { status: 404 });
      if (userRes.status === 403) {
        const rateLimitRemaining = userRes.headers.get("x-ratelimit-remaining");
        if (rateLimitRemaining === "0") {
          return NextResponse.json({ error: "GitHub API rate limit hit. Try again in ~60 minutes, or the owner can add a GitHub token to fix this permanently." }, { status: 429 });
        }
      }
      const errBody = await userRes.text().catch(() => "");
      console.error("GitHub API error:", userRes.status, errBody.slice(0, 200));
      return NextResponse.json({ error: `GitHub API error (${userRes.status}). Try again in a moment.` }, { status: 502 });
    }

    const user: GitHubUser = await userRes.json();
    const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
    const events: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

    // === PROFILE README (highest priority) ===
    // This is the github.com/username/username repo — their profile page README
    const profileReadme = await getReadme(`${username}/${username}`, headers);

    // === REPO ANALYSIS ===
    const ownRepos = repos.filter((r) => !r.fork);
    const forkRepos = repos.filter((r) => r.fork);
    const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Language frequency across all repos
    const languageCount: Record<string, number> = {};
    ownRepos.forEach((r) => {
      if (r.language) languageCount[r.language] = (languageCount[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang, count]) => `${lang} (${count} repos)`);

    // Pattern detection
    const suspiciousPatterns = [
      /tutorial/i, /practice/i, /\blearn/i, /todo/i, /\btest\b/i,
      /demo/i, /example/i, /sample/i, /hello.world/i, /first.*/i,
      /course/i, /bootcamp/i, /assignment/i, /homework/i, /-clone$/i,
      /my-portfolio/i, /portfolio$/i, /playground/i, /experiment/i,
    ];
    const suspiciousRepos = ownRepos
      .filter((r) => suspiciousPatterns.some((p) => p.test(r.name) || p.test(r.description || "")))
      .map((r) => r.name);

    // Stars distribution
    const zeroStarRepos = ownRepos.filter((r) => r.stargazers_count === 0).length;
    const mostStarredRepos = [...ownRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5);

    // Stale repos (1+ year since push)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const staleRepos = ownRepos.filter((r) => new Date(r.pushed_at) < oneYearAgo);

    // Recent repos (last 3 months pushed)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentActivity = ownRepos.filter((r) => new Date(r.pushed_at) > threeMonthsAgo);

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyPushed30 = ownRepos.filter((r) => new Date(r.pushed_at) > thirtyDaysAgo);

    // Repos created in last 90 days (new project signal)
    const recentlyCreated90 = ownRepos.filter((r) => new Date(r.created_at) > threeMonthsAgo);

    // Push event count from events feed (consistency signal)
    const pushEventCount = events.filter((e) => e.type === "PushEvent").length;

    // Language diversity
    const uniqueLanguages = new Set(ownRepos.map((r) => r.language).filter(Boolean));
    const languageDiversityCount = uniqueLanguages.size;

    // Account age
    const accountAgeYears = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    // Last activity
    const lastEvent = events[0];
    const daysSinceActive = lastEvent
      ? Math.floor((Date.now() - new Date(lastEvent.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Commit messages from events
    const commitMessages: string[] = [];
    events.forEach((e) => {
      if (e.type === "PushEvent" && e.payload.commits) {
        e.payload.commits.forEach((c) => {
          if (commitMessages.length < 15) commitMessages.push(c.message.split("\n")[0]);
        });
      }
    });

    // Select repos for deep analysis:
    // - top 3 by stars
    // - 3 most recently pushed
    // - any with homepage (deployed projects)
    const topByStars = [...ownRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);
    const recentPushed = [...ownRepos].sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()).slice(0, 3);
    const deployedProjects = ownRepos.filter((r) => r.homepage && r.homepage.length > 0).slice(0, 2);

    const uniqueRepos = Array.from(
      new Map([...topByStars, ...recentPushed, ...deployedProjects].map((r) => [r.name, r])).values()
    ).slice(0, 7);

    // Deep fetch: README + commits + languages for selected repos
    const repoDetails = await Promise.all(
      uniqueRepos.map(async (repo) => {
        const [readme, commits, languages] = await Promise.all([
          getReadme(repo.full_name, headers),
          getRecentCommits(repo.full_name, headers),
          getLanguages(repo.full_name, headers),
        ]);
        const daysSincePush = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24));
        return {
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          homepage: repo.homepage,
          topics: repo.topics?.slice(0, 3) || [],
          daysSincePush,
          readme: readme ? readme.slice(0, 300) : null, // 300 chars max to save tokens
          commits: commits.slice(0, 4),
          languages: Object.keys(languages).slice(0, 3),
        };
      })
    );

    // All repo names + descriptions for pattern spotting
    // Limit to 25 repos and shorter format to save tokens
    const allRepoSummary = ownRepos.slice(0, 25).map((r) =>
      `${r.name} (${r.stargazers_count}⭐, ${r.language || "?"}, ${Math.floor((Date.now() - new Date(r.pushed_at).getTime()) / (1000 * 60 * 60 * 24))}d ago)`
    );

    // === ALGORITHMIC BASE SCORE (ensures genuine variance per profile) ===
    // Score = 0 (impossible to replace) → 10 (already replaced)
    let baseScore = 5.0;

    // === PENALIZE (more replaceable — pushes score UP) ===

    // Tutorial/learning repo ratio
    const tutorialRatio = ownRepos.length > 0 ? suspiciousRepos.length / ownRepos.length : 0;
    baseScore += tutorialRatio * 2.5; // up to +2.5

    // High % of zero-star repos (invisible to the internet)
    const zeroStarRatio = ownRepos.length > 0 ? zeroStarRepos / ownRepos.length : 0;
    baseScore += zeroStarRatio * 1.0; // up to +1.0

    // Stale repo ratio (abandoned = replaceable)
    const staleRatio = ownRepos.length > 0 ? staleRepos.length / ownRepos.length : 0;
    baseScore += staleRatio * 1.5; // up to +1.5 (increased from 0.8)

    // INACTIVITY — biggest signal, now properly weighted
    if (daysSinceActive > 14) baseScore += 0.3;   // 2 weeks quiet
    if (daysSinceActive > 30) baseScore += 0.5;   // month gone
    if (daysSinceActive > 90) baseScore += 0.8;   // 3 months = concerning
    if (daysSinceActive > 180) baseScore += 0.8;  // 6 months = almost gone
    if (daysSinceActive > 365) baseScore += 1.0;  // 1yr+ = ghost (total up to +3.4)

    // Long account but few stars → wasted years
    const expectedStarsForAge = accountAgeYears * 15;
    if (totalStars < expectedStarsForAge) {
      baseScore += Math.min(0.8, (expectedStarsForAge - totalStars) / expectedStarsForAge);
    }

    // Fork-heavy profile (follower, not builder)
    const forkRatio = repos.length > 0 ? forkRepos.length / repos.length : 0;
    if (forkRatio > 0.4) baseScore += 0.5;
    if (forkRatio > 0.6) baseScore += 0.5; // extra penalty for fork farms

    // Single-language developer (narrow moat)
    if (ownRepos.length > 5 && languageDiversityCount <= 1) baseScore += 0.5;

    // === REWARD (less replaceable — pushes score DOWN) ===

    // Real stars = real impact (calibrated: 250 = 1pt, 500 = 2pt max)
    const starBonus = Math.min(2.0, totalStars / 250);
    baseScore -= starBonus;

    // Deployed/live projects (shipping mentality) — boosted
    const deployedCount = ownRepos.filter((r) => r.homepage && r.homepage.length > 5).length;
    baseScore -= Math.min(1.5, deployedCount * 0.3); // was 0.6 max / 0.15 each

    // Follower traction
    if (user.followers > 100) baseScore -= 0.3;
    if (user.followers > 500) baseScore -= 0.4;
    if (user.followers > 2000) baseScore -= 0.6;

    // ACTIVE BUILDING RECENTLY — biggest positive signal (rewarding daily builders)
    // Repos pushed in last 30 days
    const recent30Bonus = Math.min(1.5, recentlyPushed30.length * 0.3);
    baseScore -= recent30Bonus; // up to -1.5 for 5+ repos active in last month

    // New projects created recently (experimentation)
    const newProjectBonus = Math.min(0.8, recentlyCreated90.length * 0.2);
    baseScore -= newProjectBonus; // up to -0.8

    // Push event density = consistency signal (how often are you actually committing)
    if (pushEventCount > 10) baseScore -= 0.3;
    if (pushEventCount > 25) baseScore -= 0.4;
    if (pushEventCount > 50) baseScore -= 0.5; // up to -1.2 total

    // High-signal languages (systems, infra, ML, specialized)
    const highSignalLangs = ["Rust", "Go", "Haskell", "Erlang", "C", "C++", "Zig", "CUDA", "Assembly", "Solidity"];
    const hasHighSignal = topLanguages.some((l) => highSignalLangs.some((h) => l.startsWith(h)));
    if (hasHighSignal) baseScore -= 0.5;

    // Language diversity (multi-language = harder to replace)
    if (languageDiversityCount >= 3) baseScore -= 0.2;
    if (languageDiversityCount >= 5) baseScore -= 0.3;

    // Has a personal website/blog (personal brand)
    if (user.blog && user.blog.length > 5) baseScore -= 0.2;

    // Clamp 1.5–9.8 and round to 1 decimal
    baseScore = Math.max(1.5, Math.min(9.8, baseScore));
    const baseScoreRounded = Math.round(baseScore * 10) / 10;

    // Notable developer flags (used in sub-scores + prompt)
    const isNotable = user.followers > 2000 || totalStars > 5000;
    const isVeryNotable = user.followers > 10000 || totalStars > 20000;
    const notableBoost = isVeryNotable ? 1.5 : isNotable ? 0.7 : 0;

    // Sub-score bases (each independently derived)
    const techBase = Math.max(1.5, Math.min(9.5, Math.round((
      5.0
      - starBonus * 0.7
      + tutorialRatio * 1.5
      + zeroStarRatio * 0.8
      - (hasHighSignal ? 1.0 : 0)
      - (languageDiversityCount >= 4 ? 0.4 : 0)
      - recent30Bonus * 0.5
      - notableBoost               // notable devs get tech skills bonus
    ) * 10) / 10));
    const aiBase = Math.max(1.5, Math.min(9.5, Math.round((
      5.5
      + staleRatio * 1.5
      + (daysSinceActive > 180 ? 1.2 : daysSinceActive > 90 ? 0.6 : 0)
      - (pushEventCount > 20 ? 0.8 : pushEventCount > 10 ? 0.4 : 0)
      - recent30Bonus * 0.6
      - starBonus * 0.3
      - notableBoost * 0.5
    ) * 10) / 10));
    const moatBase = Math.max(1.5, Math.min(9.5, Math.round((
      5.0
      + tutorialRatio * 2.0
      - starBonus * 0.5
      - (deployedCount > 1 ? 0.6 : 0)
      - (user.followers > 100 ? 0.3 : 0)
      - notableBoost * 1.2         // notable = real career moat
    ) * 10) / 10));
    const mktBase = Math.max(1.5, Math.min(9.5, Math.round((
      5.0
      - (user.followers > 100 ? 0.3 : 0)
      - (user.followers > 500 ? 0.4 : 0)
      - (user.blog ? 0.2 : 0)
      + (zeroStarRatio * 1.0)
      + (accountAgeYears > 3 && totalStars < 30 ? 0.8 : 0)
      - starBonus * 0.4
      - notableBoost * 1.0         // notable = strong market positioning
    ) * 10) / 10));

    // === BUILD PROMPT ===
    const prompt = `You are a brutally honest senior software engineer and tech career advisor. Your job: give this developer a REAL, HONEST assessment of their AI replaceability. Not generic cheerleading. Not hollow cruelty. Actual truth — the kind a mentor would give if they stopped sugarcoating.

Read everything below carefully. Reference SPECIFIC things you see. Be like a senior dev doing a real code review of someone's career.

${isVeryNotable ? `⚠️ VERY NOTABLE DEVELOPER: This person has ${user.followers.toLocaleString()} followers and ${totalStars.toLocaleString()} stars. They are a recognized industry figure. Their real work likely lives in organization repos (companies, OSS orgs), NOT just their personal profile. Do NOT call them a "repo hoarder" or "tutorial collector" — that would be embarrassing and factually wrong. Their personal repo count being low means they've been building at scale in orgs. Roast them on their actual positioning, legacy concerns, or real weaknesses — not on repo count.
` : isNotable ? `⚠️ NOTABLE DEVELOPER: ${user.followers.toLocaleString()} followers / ${totalStars.toLocaleString()} stars — this person has real community traction. Factor that into your assessment. Their moat is real. Roast specific weaknesses, not their overall profile.
` : ""}IMPORTANT — SCORING RULES:
The system has pre-computed algorithmic base scores from real data metrics. You MUST use these as anchors and adjust by ±1.5 max based on qualitative things you observe in READMEs and commits. Do NOT anchor everyone to 7.x.

ALGORITHMIC BASE SCORES (use as anchors, adjust ±1.5 max):
Active builder signals: ${recentlyPushed30.length} repos pushed last 30d, ${pushEventCount} push events, ${recentlyCreated90.length} new repos in 90d, inactive ${daysSinceActive}d.
- Overall replaceability: ${baseScoreRounded}/10
- Technical Skills: ${Math.round(techBase * 10) / 10}/10  
- AI Adaptability: ${Math.round(aiBase * 10) / 10}/10
- Career Moat: ${Math.round(moatBase * 10) / 10}/10
- Market Positioning: ${Math.round(mktBase * 10) / 10}/10

Your final scores should be CLOSE to these but can vary based on quality you read in the code/READMEs.

==================================================
GITHUB PROFILE README (their "About Me" — read this first)
==================================================
${profileReadme ? profileReadme.slice(0, 1200) : "(No profile README — they haven't bothered to introduce themselves on their own profile page)"}

==================================================
ACCOUNT INFO
==================================================
Username: ${user.login}
Name: ${user.name || user.login}
Bio: ${user.bio || "(no bio)"}
Account age: ${accountAgeYears} years on GitHub
Location: ${user.location || "unknown"}
Company: ${user.company || "none listed"}
Website/Blog: ${user.blog || "none"}
Twitter: ${user.twitter_username ? `@${user.twitter_username}` : "not linked"}
Hireable: ${user.hireable === true ? "yes (actively looking)" : user.hireable === false ? "no" : "not set"}
Followers: ${user.followers} | Following: ${user.following}

==================================================
REPO STATISTICS
==================================================
Total public repos: ${user.public_repos}
  Own repos: ${ownRepos.length}
  Forks: ${forkRepos.length}
Total stars on own work: ${totalStars}
Repos with 0 stars: ${zeroStarRepos} out of ${ownRepos.length}
Stale repos (1+ yr no push): ${staleRepos.length}
Active repos (last 3 months): ${recentActivity.length}
Active repos (last 30 days): ${recentlyPushed30.length}
New repos created (last 90 days): ${recentlyCreated90.length}
Push events in feed (consistency): ${pushEventCount}
Days since any GitHub activity: ${daysSinceActive}
Language count across repos: ${languageDiversityCount}
Top languages: ${topLanguages.join(", ") || "none"}

Most starred repos:
${mostStarredRepos.map((r) => `  ${r.name}: ${r.stargazers_count}⭐ — ${r.description || "no description"}`).join("\n")}

Likely tutorial/learning repos detected (by name pattern):
${suspiciousRepos.length > 0 ? suspiciousRepos.join(", ") : "none detected"}

==================================================
ALL REPOS (name, stars, language, last push)
==================================================
${allRepoSummary.join("\n")}

==================================================
DEEP ANALYSIS — TOP 7 REPOS (README + commits + languages)
==================================================
${repoDetails.map((r, i) => `
[${i + 1}] ${r.name} — ${r.stars}⭐ | ${r.language || "?"} | pushed ${r.daysSincePush}d ago
Description: ${r.description || "(none)"}
Homepage/Live: ${r.homepage || "(not deployed)"}
Topics: ${r.topics.join(", ") || "none"}
Languages in repo: ${r.languages.join(", ") || "unknown"}
README (first 800 chars):
${r.readme || "(no README — shipped without docs)"}

Recent commits:
${r.commits.length > 0 ? r.commits.map((c) => `  • "${c}"`).join("\n") : "  (no commits found)"}
`).join("\n---\n")}

==================================================
RECENT COMMIT MESSAGES (from public events)
==================================================
${commitMessages.length > 0 ? commitMessages.map((m) => `  • "${m}"`).join("\n") : "(no recent public commit activity)"}

==================================================
YOUR TASK — WRITE THE HONEST VERDICT
==================================================
Write like a senior engineer who's seen thousands of GitHub profiles. Be honest, specific, and a little savage — but grounded in facts you actually read above.

RULES:
- Reference their profile README claims vs reality. Call out the gap.
- Name actual repos, commit messages, specific patterns you saw.
- For notable developers (high followers/stars): roast their specific blind spots, not their overall status. Don't insult someone famous with wrong facts.
- The roast should feel like: "I read your whole GitHub. Here's what I actually think."
- No generic lines. Every sentence should only fit THIS person's profile.
- If they're truly exceptional, say so — then find the real weakness.

Scoring context (0-10, 10 = AI replaces them tomorrow):
- 1-3: Real specialist. Distinct output. Hard to replicate.
- 4-6: Competent but generic. Some real projects, some filler.
- 7-9: Mostly tutorial/CRUD work. Low moat. AI is coming for them.
- 9-10: Already functionally replaced. Just doesn't know it yet.

The scores are ALREADY DECIDED by the algorithm — do NOT include numbers in your response. Only write the text fields.

Return ONLY valid JSON (no markdown, no backticks):
{
  "threatTitle": "ALL CAPS, 2-5 words, sardonic job title that fits THIS profile specifically (e.g. 'GLORIFIED YAML MONKEY', 'REPO ABANDONMENT ARTIST', 'TUTORIAL SPEED RUN CHAMPION', 'INFRASTRUCTURE LEGACY LOCK-IN')",
  "mainRoast": "3-5 sentences. Name specific repos, README claims, commit patterns you actually read. Honest, a little savage, grounded in real data. No filler.",
  "subDescriptions": {
    "technicalSkills": "One sharp line referencing their actual stack, languages, and code quality signals you saw",
    "aiAdaptability": "One specific line — are they using AI tools? Building AI things? Or frozen in 2019?",
    "careerMoat": "One line about what makes them distinctive (or doesn't) based on their actual portfolio",
    "marketPositioning": "One line about market visibility — followers, deployed work, personal brand signals"
  }
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // 8b has separate daily limit from 70b
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "";

    // Scores are ALWAYS algorithmic — AI only provides text
    const topRepo = repoDetails[0];
    const fallbackDescriptions = {
      technicalSkills: `${topLanguages[0]?.split(" ")[0] || "Unknown"} as primary stack with ${zeroStarRepos} zero-star repos out of ${ownRepos.length}.`,
      aiAdaptability: `${daysSinceActive > 90 ? `${daysSinceActive} days inactive` : "Recent activity"} — AI-first thinking not visible in project choices.`,
      careerMoat: `${ownRepos.length} repos, ${deployedCount} deployed, ${totalStars} total stars — the moat is thin.`,
      marketPositioning: `${user.followers} followers after ${accountAgeYears} years — ${user.followers < 50 ? "flying completely under the radar" : "some traction but not breakout"}.`,
    };
    const fallbackTitle = tutorialRatio > 0.3 ? "TUTORIAL SPEED RUN CHAMPION" : staleRatio > 0.5 ? "REPO ABANDONMENT ARTIST" : totalStars < 10 ? "INVISIBLE TO THE INTERNET" : "GLORIFIED CODE ACCUMULATOR";
    const fallbackRoast = `${user.name || user.login} has been on GitHub for ${accountAgeYears} years and has ${totalStars} total stars across ${ownRepos.length} repos — that's ${(totalStars / Math.max(1, ownRepos.length)).toFixed(1)} stars per repo. ${topRepo ? `Their standout project "${topRepo.name}" ${topRepo.stars > 0 ? `has ${topRepo.stars} stars` : "has zero stars"}.` : ""} ${staleRepos.length > 5 ? `${staleRepos.length} repos haven't been touched in over a year.` : ""} ${suspiciousRepos.length > 3 ? `The tutorial graveyard (${suspiciousRepos.slice(0, 3).join(", ")}) speaks volumes.` : ""}`;

    let aiText: { threatTitle?: string; mainRoast?: string; subDescriptions?: Record<string, string> } = {};
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      aiText = JSON.parse(jsonMatch[0]);
    } catch {
      // use fallbacks below
    }

    const roastData = {
      overallScore: baseScoreRounded,
      threatTitle: aiText.threatTitle || fallbackTitle,
      mainRoast: aiText.mainRoast || fallbackRoast,
      subScores: {
        technicalSkills: {
          score: Math.round(techBase * 10) / 10,
          description: aiText.subDescriptions?.technicalSkills || fallbackDescriptions.technicalSkills,
        },
        aiAdaptability: {
          score: Math.round(aiBase * 10) / 10,
          description: aiText.subDescriptions?.aiAdaptability || fallbackDescriptions.aiAdaptability,
        },
        careerMoat: {
          score: Math.round(moatBase * 10) / 10,
          description: aiText.subDescriptions?.careerMoat || fallbackDescriptions.careerMoat,
        },
        marketPositioning: {
          score: Math.round(mktBase * 10) / 10,
          description: aiText.subDescriptions?.marketPositioning || fallbackDescriptions.marketPositioning,
        },
      },
    };

    return NextResponse.json({
      username: user.login,
      name: user.name || user.login,
      bio: user.bio,
      company: user.company,
      location: user.location,
      blog: user.blog,
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      avatarUrl: user.avatar_url,
      isEnhanced: isOAuth, // true = analyzed with private repo access
      ...roastData,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Roast API error:", msg);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
