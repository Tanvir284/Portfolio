import Anthropic from '@anthropic-ai/sdk';

/**
 * T.A.N.V.I.R. — portfolio assistant.
 *
 * The browser never sees the API key: the page calls this Worker, the Worker
 * calls Claude with a key stored as a Cloudflare secret.
 *
 *   wrangler secret put ANTHROPIC_API_KEY
 *   wrangler deploy
 */

const MODEL = 'claude-opus-5';
const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY_TURNS = 12;

// Best-effort per-isolate throttle. Cloudflare may run several isolates, so
// this is a speed bump, not a hard guarantee — add Cloudflare Rate Limiting
// or a KV counter if you need a real limit.
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 12 };
const hits = new Map();

/**
 * Keep this factual. Everything here is drawn from Tanvir's actual CV — an
 * assistant that invents credentials is worse than no assistant at all.
 */
const SYSTEM_PROMPT = `You are T.A.N.V.I.R., the assistant embedded in Md Tanvir Islam's portfolio site.
You answer questions from recruiters, hiring managers and fellow engineers.

ABOUT TANVIR
- Computer Science graduate specialising in Artificial Intelligence. Based in Dhaka, Bangladesh.
- B.Sc. in Computer Science and Engineering, Bangladesh University of Business and Technology (BUBT),
  Jan 2022 – Jan 2026, CGPA 3.36/4.00. Graduated.
- Research Assistant at InsightEdu (Jan 2026 – Feb 2026), AI research: worked across ML, DL, NLP and
  Transformer-based projects — dataset preprocessing, model training, evaluation and iterative
  experimentation with Python, PyTorch and Scikit-learn. Reviewed literature, reproduced
  state-of-the-art baselines, and drafted methodology and experimental-results sections.
- Currently seeking entry-level roles in Software Engineering, AI/ML, Data Analytics or IT.

PROJECTS
- MangoCare AI — full-stack web app classifying 8 mango leaf disease categories in real time with a
  fine-tuned DenseNet-121. Secure auth, diagnosis dashboard with confidence scores and treatment
  recommendations, REST API. Dockerised and deployed on Hugging Face Spaces.
  Stack: Python, Flask, PyTorch, DenseNet-121, Docker.
- Breast Lesion Segmentation & Classification — U-Net with a ResNet-50 backbone segmenting and
  classifying breast lesions from ultrasound images. 91% Dice coefficient, 7 percentage points above
  the baseline CNN. Stack: Python, TensorFlow, transfer learning.
- Concrete Compressive Strength Prediction — compared five regression models (Linear, Ridge, Random
  Forest, Gradient Boosting, XGBoost). Random Forest achieved the lowest RMSE at 4.2 MPa;
  water-cement ratio was the dominant predictor. Stack: Python, Scikit-learn, Pandas.
- E-Commerce Platform — full-stack system with catalogue, cart, order management and admin dashboard
  for 200+ SKUs. Secure auth and optimised SQL cut average page load time by 35%.
  Stack: PHP, MySQL, JavaScript, HTML/CSS.
- This portfolio — HTML/CSS/JavaScript with Three.js/WebGL, live GitHub API integration,
  TensorFlow.js object detection running in-browser.

SKILLS
- Languages: Python, SQL, JavaScript, Java, C++, C#
- AI/ML: PyTorch, TensorFlow, Scikit-learn, Transformers (Hugging Face), LLMs, NLP, Computer Vision, OpenCV
- Web/APIs: React.js, Node.js, Django, Flask, FastAPI, REST APIs, HTML, CSS, PHP
- Databases: MySQL, SQL Server, Oracle SQL, PostgreSQL, MongoDB, vector databases
- Data: Pandas, NumPy, Matplotlib, Seaborn, Power BI, Tableau
- Tools: Git, GitHub, GitLab, Linux, Jupyter, VS Code, Docker, GitHub Actions, Jenkins, Terraform, Postman

CERTIFICATIONS: Google Data Analytics, IBM Data Science, IBM AI Developer (all Professional Certificates).
ACHIEVEMENTS: AI Battle 2024 — 2nd place (Advanced Python), BUBT CSE. Brainstorming Week 2024 — 3rd place, AI research poster.
CONTACT: ruhittanvir14@gmail.com · github.com/Tanvir284

HOW TO ANSWER
- Be concise: two or three sentences unless asked for detail. This is a chat bubble, not a document.
- Professional, direct, lightly futuristic. Do not overdo the persona.
- Quote real numbers when they are relevant (91% Dice, 4.2 MPa RMSE, 35% faster, CGPA 3.36).
- NEVER invent facts. If something is not listed above — a salary expectation, a technology he has not
  used, a project detail you do not have — say you do not have that detail and point them to
  ruhittanvir14@gmail.com. Made-up credentials would actively damage his job search.
- Redirect off-topic questions back to Tanvir's work.
- Plain text only. No markdown, no code fences.`;

const corsHeaders = (origin) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
});

const json = (body, status, origin) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });

function rateLimited(ip) {
    const now = Date.now();
    const seen = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
    if (seen.length >= RATE_LIMIT.maxRequests) return true;
    seen.push(now);
    hits.set(ip, seen);
    if (hits.size > 5000) hits.clear(); // crude memory guard
    return false;
}

export default {
    async fetch(request, env) {
        const allowed = env.ALLOWED_ORIGIN || '*';
        const origin = request.headers.get('Origin') || '';
        // Only reflect the origin when it is the one we allow
        const cors = allowed === '*' || origin === allowed ? origin || '*' : allowed;

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(cors) });
        }
        if (request.method !== 'POST') {
            return json({ error: 'Use POST.' }, 405, cors);
        }
        if (allowed !== '*' && origin && origin !== allowed) {
            return json({ error: 'Origin not allowed.' }, 403, cors);
        }
        if (!env.ANTHROPIC_API_KEY) {
            return json({ error: 'Server is not configured.' }, 500, cors);
        }

        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        if (rateLimited(ip)) {
            return json({ error: 'Too many messages. Please wait a moment.' }, 429, cors);
        }

        let payload;
        try {
            payload = await request.json();
        } catch {
            return json({ error: 'Malformed request body.' }, 400, cors);
        }

        const message = typeof payload.message === 'string' ? payload.message.trim() : '';
        if (!message) return json({ error: 'Message is required.' }, 400, cors);
        if (message.length > MAX_MESSAGE_CHARS) {
            return json({ error: 'Message is too long.' }, 400, cors);
        }

        // Only accept the shape we expect; ignore anything else the client sends
        const history = Array.isArray(payload.history)
            ? payload.history
                  .filter(
                      (m) =>
                          m &&
                          (m.role === 'user' || m.role === 'assistant') &&
                          typeof m.content === 'string' &&
                          m.content.trim()
                  )
                  .slice(-MAX_HISTORY_TURNS)
                  .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
            : [];

        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

        try {
            const response = await client.beta.messages.create({
                model: MODEL,
                // Answers are deliberately short — this renders in a chat bubble.
                max_tokens: 1024,
                // Adaptive thinking at low effort: cheaper and faster than the
                // default, and avoids the failure modes of disabling thinking.
                thinking: { type: 'adaptive' },
                output_config: { effort: 'low' },
                // If a safety classifier declines, retry on another model in the
                // same call rather than returning nothing.
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                system: SYSTEM_PROMPT,
                messages: [...history, { role: 'user', content: message }],
            });

            if (response.stop_reason === 'refusal') {
                return json(
                    { reply: "I can't help with that one. Ask me about Tanvir's projects, skills or experience." },
                    200,
                    cors
                );
            }

            const reply = response.content
                .filter((b) => b.type === 'text')
                .map((b) => b.text)
                .join('\n')
                .trim();

            return json(
                { reply: reply || 'I did not catch that — could you rephrase?' },
                200,
                cors
            );
        } catch (err) {
            // Typed SDK errors, most specific first
            if (err instanceof Anthropic.AuthenticationError) {
                console.error('Bad ANTHROPIC_API_KEY');
                return json({ error: 'Assistant is misconfigured.' }, 500, cors);
            }
            if (err instanceof Anthropic.RateLimitError) {
                return json({ error: 'The assistant is busy. Try again shortly.' }, 429, cors);
            }
            if (err instanceof Anthropic.APIError) {
                console.error('Claude API error', err.status, err.message);
                return json({ error: 'The assistant is unavailable right now.' }, 502, cors);
            }
            console.error('Unexpected worker error', err);
            return json({ error: 'Something went wrong.' }, 500, cors);
        }
    },
};
