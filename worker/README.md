# T.A.N.V.I.R. assistant — Cloudflare Worker

The portfolio chatbot currently answers from a local keyword matcher in
`script.js`. That works offline and costs nothing, but it is not an LLM.

This Worker turns it into a real one **without putting your API key in the
browser**. The key lives as a Worker secret; the page only ever calls your
Worker.

## Deploy (about 5 minutes)

```bash
npm install -g wrangler
wrangler login
cd worker
wrangler secret put ANTHROPIC_API_KEY   # paste your key when prompted
wrangler deploy
```

`wrangler deploy` prints a URL such as
`https://tanvir-assistant.<your-subdomain>.workers.dev`.

## Connect the site

In `script.js`, set:

```js
const CHAT_API = 'https://tanvir-assistant.<your-subdomain>.workers.dev';
```

Leave it as `null` and the page keeps using the offline keyword matcher, so the
site never breaks if the Worker is down or you run out of credit.

## Notes

- `ALLOWED_ORIGIN` in `wrangler.toml` restricts who can call the Worker. Set it
  to your real domain so other sites cannot spend your credits.
- There is a simple per-IP rate limit. For anything heavier, add
  Cloudflare Rate Limiting or a KV-backed counter.
- The system prompt is in `worker.js`. Keep it factual — it is the part that
  makes the assistant genuinely useful to a recruiter.
