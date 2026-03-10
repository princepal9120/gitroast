# GitRoast 💀

**Will AI replace you?** GitRoast analyzes your real GitHub profile and gives you a brutal 0–10 replaceability score — powered by your actual repos, commit history, and README content.

🔗 **Live:** [gitroast.princepal.dev](https://gitroast.princepal.dev)

---

## What It Does

- Fetches your GitHub profile, repos, commits, READMEs, and languages
- Computes an **algorithmic replaceability score** (0–10) based on real signals
- Writes a **brutal, specific roast** referencing your actual repo names and commit messages
- Breaks down sub-scores: Code Originality, Commit Quality, Project Depth, Tech Currency
- Supports **GitHub OAuth** for enhanced analysis including private repos

## Screenshots

> Drop yours here after cloning 👇

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **AI:** Groq (llama-3.1-8b-instant)
- **Auth:** NextAuth v5 (GitHub OAuth)
- **OG Images:** `next/og` (edge runtime)
- **Deployment:** Vercel

---

## Running Locally

### 1. Clone the repo

```bash
git clone https://github.com/princepal9120/gitroast.git
cd gitroast
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Required — AI roast generation
GROQ_API_KEY=your_groq_api_key

# Recommended — bumps GitHub API from 60 to 5000 req/hour
GITHUB_TOKEN=your_github_pat

# Required for GitHub OAuth login (optional feature)
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret

# Required for NextAuth session signing
AUTH_SECRET=your_random_secret   # generate: openssl rand -base64 32
```

**Getting the keys:**

| Key | Where to get it |
|-----|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) — free tier available |
| `GITHUB_TOKEN` | [github.com/settings/tokens](https://github.com/settings/tokens) — `public_repo` scope only |
| `GITHUB_CLIENT_ID/SECRET` | [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App |
| `AUTH_SECRET` | Run `openssl rand -base64 32` in your terminal |

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How Scoring Works

Scores are **100% algorithmic** — the AI only writes the roast text, never the numbers. This prevents the model from anchoring every profile to 7.2/10.

**Scoring signals:**

| Signal | Weight |
|--------|--------|
| Tutorial/boilerplate repo ratio | High |
| Zero-star repo ratio | Medium |
| Stale repo ratio (>1 year untouched) | Medium |
| Total GitHub stars | Bonus (up to +2pt) |
| Followers | Bonus |
| Deployed projects (has homepage) | Bonus |

Sub-scores: Code Originality, Commit Quality, Project Depth, Tech Currency.

---

## GitHub OAuth (Optional)

Without OAuth, the tool only sees your **public repos** (unauthenticated: 60 req/hr; with `GITHUB_TOKEN`: 5000 req/hr).

With OAuth login, users can authorize GitRoast to read their **private repos** for a more accurate (and more brutal) roast.

To enable OAuth, set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `AUTH_SECRET` in your env. The callback URL should be:

```
http://localhost:3000/api/auth/callback/github   # local
https://yourdomain.com/api/auth/callback/github  # production
```

---

## Deploying to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/princepal9120/gitroast)

1. Click the button above
2. Add your env vars in the Vercel dashboard
3. Deploy — done

---

## Project Structure

```
src/
  app/
    page.tsx                    # Landing page
    layout.tsx                  # Root layout + SessionProvider
    api/
      roast/route.ts            # Core scoring + roast generation API
      og/route.tsx              # Dynamic OG image (edge runtime)
      auth/[...nextauth]/       # NextAuth GitHub OAuth
    roast/[username]/
      layout.tsx                # Per-profile OG metadata
      page.tsx                  # Results page
  auth.ts                       # NextAuth config
  types/next-auth.d.ts          # Session type extensions
```

---

## Contributing

PRs welcome. Some ideas:

- [ ] Download score card as PNG
- [ ] Compare two profiles head-to-head
- [ ] Leaderboard of most replaceable devs
- [ ] Support for GitLab / Bitbucket profiles
- [ ] Model selector (use your own API key)

---

## License

MIT — built by [princepal.dev](https://princepal.dev)
