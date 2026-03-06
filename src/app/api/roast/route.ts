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
  size: number;
  open_issues_count: number;
  topics: string[];
  has_pages: boolean;
  default_branch: string;
}

interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    commits?: { message: string }[];
    action?: string;
  };
}

async function fetchWithFallback(url: string, headers: HeadersInit): Promise<Response> {
  const res = await fetch(url, { headers });
  return res;
}

async function getReadme(fullName: string, headers: HeadersInit): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/readme`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    // Strip badges, links, HTML — keep first 600 chars of meaningful content
    return content
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, 600);
  } catch {
    return null;
  }
}

async function getRecentCommits(fullName: string, headers: HeadersInit): Promise<string[]> {
  try {
    const res = await fetch(`https://api.github.com/repos/${fullName}/commits?per_page=10`, { headers });
    if (!res.ok) return [];
    const commits = await res.json();
    return commits.map((c: { commit: { message: string } }) => c.commit.message.split("\n")[0]).slice(0, 8);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    const headers: HeadersInit = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "GitRoast/2.0",
    };
    if (process.env.GITHUB_TOKEN) {
      (headers as Record<string, string>)["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    // Fetch core data in parallel
    const [userRes, reposRes, eventsRes] = await Promise.all([
      fetchWithFallback(`https://api.github.com/users/${username}`, headers),
      fetchWithFallback(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=50`, headers),
      fetchWithFallback(`https://api.github.com/users/${username}/events/public?per_page=30`, headers),
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
      return NextResponse.json({ error: "GitHub API error" }, { status: 502 });
    }

    const user: GitHubUser = await userRes.json();
    const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
    const events: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

    // Analyze repos
    const ownRepos = repos.filter((r) => !r.fork);
    const forkRepos = repos.filter((r) => r.fork);
    const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Language frequency
    const languageCount: Record<string, number> = {};
    ownRepos.forEach((r) => {
      if (r.language) languageCount[r.language] = (languageCount[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang, count]) => `${lang} (${count} repos)`);

    // Suspicious repo names — tutorial hell, portfolio spam, etc.
    const suspiciousPatterns = [
      /tutorial/i, /practice/i, /learning/i, /learn-/i, /todo/i, /test-/i,
      /demo/i, /example/i, /sample/i, /hello-world/i, /first-/i, /beginner/i,
      /course/i, /bootcamp/i, /assignment/i, /homework/i, /clone/i, /copy/i,
    ];
    const suspiciousRepos = ownRepos
      .filter((r) => suspiciousPatterns.some((p) => p.test(r.name) || p.test(r.description || "")))
      .map((r) => r.name);

    // Stale repos (not pushed in 1+ year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const staleRepos = ownRepos.filter((r) => new Date(r.pushed_at) < oneYearAgo).length;

    // Account age
    const accountAgeYears = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    // Last activity
    const lastEvent = events[0];
    const daysSinceActive = lastEvent
      ? Math.floor((Date.now() - new Date(lastEvent.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Recent commit messages from events
    const commitMessages: string[] = [];
    events.forEach((e) => {
      if (e.type === "PushEvent" && e.payload.commits) {
        e.payload.commits.forEach((c) => {
          if (commitMessages.length < 10) commitMessages.push(c.message.split("\n")[0]);
        });
      }
    });

    // Top repos by stars + most recent
    const topByStars = [...ownRepos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 3);
    const mostRecent = ownRepos.filter((r) => !topByStars.find((t) => t.name === r.name)).slice(0, 2);
    const reposToAnalyze = [...topByStars, ...mostRecent].slice(0, 4);

    // Fetch READMEs and commits for top repos
    const repoDetails = await Promise.all(
      reposToAnalyze.map(async (repo) => {
        const [readme, commits] = await Promise.all([
          getReadme(repo.full_name, headers),
          getRecentCommits(repo.full_name, headers),
        ]);
        return {
          name: repo.name,
          description: repo.description,
          language: repo.language,
          stars: repo.stargazers_count,
          readme: readme?.slice(0, 400) || null,
          commits: commits.slice(0, 5),
          topics: repo.topics,
          daysSincePush: Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)),
        };
      })
    );

    // All repo names for pattern analysis
    const allRepoNames = ownRepos.slice(0, 30).map((r) => r.name);

    // Build the savage prompt
    const prompt = `You are the most savage, brutally honest AI career roaster on the internet. Your job: destroy this developer's career self-image using SPECIFIC details from their actual GitHub profile. Every line must reference something REAL about them — not generic advice.

== PROFILE DATA ==
Username: ${user.login}
Name: ${user.name || user.login}
Bio: ${user.bio || "(no bio — already suspicious)"}
Account age: ${accountAgeYears} years
Location: ${user.location || "unspecified"}
Company: ${user.company || "none"}
Website: ${user.blog || "none"}
Hireable flag: ${user.hireable === null ? "not set" : user.hireable}

== REPO STATS ==
Total repos: ${user.public_repos} (${ownRepos.length} own, ${forkRepos.length} forks)
Total stars (own): ${totalStars}
Avg stars/repo: ${ownRepos.length > 0 ? (totalStars / ownRepos.length).toFixed(2) : 0}
Stale repos (1+ year): ${staleRepos} out of ${ownRepos.length}
Days since last activity: ${daysSinceActive}
Top languages: ${topLanguages.join(", ") || "None"}

== ALL REPO NAMES (find patterns, roast them) ==
${allRepoNames.join(", ")}

== SUSPICIOUS REPOS (tutorial/learning/todo/demo) ==
${suspiciousRepos.length > 0 ? suspiciousRepos.join(", ") : "None detected"}

== TOP PROJECTS (analyze these hard) ==
${repoDetails.map((r) => `
REPO: ${r.name} (${r.stars}⭐, ${r.language || "unknown lang"}, ${r.daysSincePush}d ago)
Description: ${r.description || "(no description)"}
Topics: ${r.topics?.join(", ") || "none"}
README preview: ${r.readme || "(no README — peak laziness)"}
Recent commits: ${r.commits.length > 0 ? r.commits.map((c) => `"${c}"`).join(", ") : "(no commits found)"}
`).join("\n---\n")}

== RECENT COMMIT MESSAGES ==
${commitMessages.length > 0 ? commitMessages.map((m) => `"${m}"`).join("\n") : "(no recent commits — either dead or on private repos)"}

== ROASTING INSTRUCTIONS ==
- Reference SPECIFIC repo names, commit messages, README content
- If there are tutorial/learning repos, CALL THEM OUT by name
- If commit messages are lazy ("fix", "update", "asdf"), roast them
- If they have 0-star repos after years of coding, roast that
- If they have tons of forks vs original work, roast that
- If their README is empty or generic, roast that
- If they haven't pushed in months, roast that
- Be ruthless about the gap between how many repos they have vs the quality
- Make them laugh AND feel attacked at the same time
- DO NOT be generic. Every sentence must be specific to THIS person.

Return ONLY valid JSON (no markdown, no backticks):
{
  "overallScore": 7.2,
  "threatTitle": "GLORIFIED TUTORIAL COMPLETIONIST",
  "mainRoast": "3-4 sentences of specific, savage roast referencing their actual repos, commit messages, and profile...",
  "subScores": {
    "technicalSkills": { "score": 6.5, "description": "One line referencing their actual languages/projects" },
    "aiAdaptability": { "score": 5.0, "description": "One line about their readiness for the AI era based on what they've built" },
    "careerMoat": { "score": 8.1, "description": "One line about their uniqueness/differentiation" },
    "marketPositioning": { "score": 7.3, "description": "One line about their market value based on their work" }
  }
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "";

    let roastData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      roastData = JSON.parse(jsonMatch[0]);
    } catch {
      // Specific fallback using real data
      const topRepoName = repoDetails[0]?.name || "unnamed project";
      roastData = {
        overallScore: 7.5,
        threatTitle: "PROFESSIONAL REPO HOARDER",
        mainRoast: `${user.public_repos} repos, ${totalStars} total stars, and your most impressive project is called "${topRepoName}". You've been on GitHub for ${accountAgeYears} years and the best thing you've shipped is ${suspiciousRepos[0] ? `"${suspiciousRepos[0]}"` : "a fork of someone else's work"}. AI doesn't need to replace you — your own GitHub history is doing that.`,
        subScores: {
          technicalSkills: { score: 6.5, description: `${topLanguages[0]?.split(" ")[0] || "Unknown"} skills with ${totalStars} total stars to show for it.` },
          aiAdaptability: { score: 5.5, description: "Nothing in your repos screams 'I've thought about AI replacing me.'" },
          careerMoat: { score: 7.0, description: `${ownRepos.length} original repos and none of them have a moat.` },
          marketPositioning: { score: 7.5, description: `${user.followers} followers in ${accountAgeYears} years. The market has spoken.` },
        },
      };
    }

    return NextResponse.json({
      username: user.login,
      name: user.name || user.login,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      ...roastData,
    });
  } catch (err) {
    console.error("Roast API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
