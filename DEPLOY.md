# Deploying

This app runs as a **single long-running Node server** (not serverless), because the vector store
is in memory. Any host that runs `npm start` on a persistent instance works. Two easy free options:

## Option A — Render (free, no credit card)

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Go to <https://dashboard.render.com> → **New → Blueprint**, and select this repo. Render reads
   `render.yaml` and configures the service automatically.
3. When prompted, set the environment variable **`GEMINI_API_KEY`** to your key.
4. Deploy. You'll get a public `*.onrender.com` URL.

> Note: Render's free instances **sleep after ~15 minutes of inactivity**, so the first request
> after idle takes ~30–60s to wake. Fine for a demo; mention it in the walkthrough.

## Option B — Railway (no sleep; may require a card for verification)

1. <https://railway.app> → **New Project → Deploy from GitHub repo** → select this repo.
2. Railway auto-detects Next.js (Nixpacks); no config needed.
3. Add the variable **`GEMINI_API_KEY`** in the service settings.
4. Deploy → public URL under **Settings → Networking → Generate Domain**.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | yes | Free key from <https://aistudio.google.com/apikey> |
| `GENERATION_MODEL` | no | defaults to `gemini-2.5-flash-lite` |
| `SIMILARITY_FLOOR` | no | abstention threshold, defaults to `0.55` |

## Caveats for a deployed demo
- **In-memory store**: sources are held in the running instance (mirrored to a JSON file). A restart
  or redeploy clears them — just re-upload during the demo. This is intentional; the README explains
  the scale-up path.
- **Free-tier model quota** is shared across everyone hitting the deployed URL, so the app retries on
  rate-limit (429). For a heavily-used demo, set your own higher-quota key.
