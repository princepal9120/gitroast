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
}

interface GitHubRepo {
  name: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  description: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

    // Fetch GitHub data
    const headers: HeadersInit = { "Accept": "application/vnd.github.v3+json" };
    if (process.env.GITHUB_TOKEN) {
      (headers as Record<string, string>)["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=30`, { headers }),
    ]);

    if (!userRes.ok) {
      if (userRes.status === 404) return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
      return NextResponse.json({ error: "GitHub API error" }, { status: 502 });
    }

    const user: GitHubUser = await userRes.json();
    const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];

    // Analyze repos
    const ownRepos = repos.filter((r) => !r.fork);
    const totalStars = ownRepos.reduce((sum, r) => sum + r.stargazers_count, 0);
    const languageCount: Record<string, number> = {};
    ownRepos.forEach((r) => {
      if (r.language) languageCount[r.language] = (languageCount[r.language] || 0) + 1;
    });
    const topLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    const accountAgeYears = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365)
    );

    const prompt = `You are a brutal, savage career roaster. Analyze this GitHub developer profile and roast them. Be accurate, specific, and absolutely merciless. Reference actual details from their profile. Don't hold back.

Developer Profile:
- Username: ${user.login}
- Name: ${user.name || user.login}
- Bio: ${user.bio || "No bio (already a red flag)"}
- Public repos: ${user.public_repos} (own: ${ownRepos.length})
- Total stars: ${totalStars}
- Followers: ${user.followers}
- Top languages: ${topLanguages.join(", ") || "None (no code, just vibes)"}
- Account age: ${accountAgeYears} years
- Avg stars per repo: ${ownRepos.length > 0 ? (totalStars / ownRepos.length).toFixed(1) : 0}

Return ONLY valid JSON (no markdown, no backticks, no explanation):
{
  "overallScore": 7.2,
  "threatTitle": "GLORIFIED API GLUE",
  "mainRoast": "2-3 sentence brutal, specific roast mentioning their actual stats and languages...",
  "subScores": {
    "technicalSkills": { "score": 6.5, "description": "One savage line about their technical depth" },
    "aiAdaptability": { "score": 5.0, "description": "One savage line about how ready they are for the AI era" },
    "careerMoat": { "score": 8.1, "description": "One savage line about their unique value" },
    "marketPositioning": { "score": 7.3, "description": "One savage line about their market relevance" }
  }
}

Rules:
- overallScore is 0-10 (higher = more replaceable by AI)
- threatTitle is 2-4 words ALL CAPS, sardonic label for their career (e.g., "PROFESSIONAL YAML MONKEY", "STACK OVERFLOW MIDDLEMAN", "JUPYTER NOTEBOOK JOCKEY")
- Be specific to THEIR stats, not generic
- Savage but clever, not just mean`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || "";
    
    let roastData;
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      roastData = JSON.parse(jsonMatch[0]);
    } catch {
      // Fallback roast
      roastData = {
        overallScore: 7.5,
        threatTitle: "PROFESSIONAL REPO HOARDER",
        mainRoast: `With ${user.public_repos} repos and ${totalStars} total stars, you've been putting in work — just not the kind that impresses anyone. ${topLanguages[0] || "Code"} skills in 2026 are table stakes, and the table is being cleared by AI.`,
        subScores: {
          technicalSkills: { score: 6.5, description: "Quantity over quality is still just quantity." },
          aiAdaptability: { score: 5.5, description: "Your GitHub shows code, not AI augmentation." },
          careerMoat: { score: 7.0, description: "Open source presence but no clear specialization." },
          marketPositioning: { score: 7.5, description: "Another developer in a market flooded with developers." },
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
