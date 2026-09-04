/* Real client-side ML, no server and no API key.
 *
 * Everything here runs in the visitor's browser via Transformers.js:
 *   - all-MiniLM-L6-v2 (22 MB) produces sentence embeddings, used for the
 *     assistant's retrieval and for semantic project search.
 *   - mobilevit-small (6 MB) classifies an uploaded image.
 *
 * Both are loaded lazily -- nothing downloads until a visitor actually opens
 * the assistant, searches, or drops in an image -- and the browser caches the
 * weights, so a second visit costs about 350ms instead of 25 seconds.
 *
 * The assistant retrieves and quotes real content from this page. It does not
 * generate text, and it is labelled that way in the UI. Passing a keyword
 * matcher off as an LLM on an AI engineer's portfolio is worse than not
 * having one.
 */

const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.1';
const EMBED_MODEL = 'Xenova/all-MiniLM-L6-v2';
const IMAGE_MODEL = 'Xenova/mobilevit-small';

let libPromise = null;
let embedderPromise = null;
let classifierPromise = null;

const lib = () => (libPromise ||= import(/* @vite-ignore */ LIB));

async function getEmbedder(onProgress) {
    if (!embedderPromise) {
        embedderPromise = (async () => {
            const { pipeline } = await lib();
            return pipeline('feature-extraction', EMBED_MODEL, {
                dtype: 'q8',
                progress_callback: p => {
                    if (onProgress && p.status === 'progress' && p.total) {
                        onProgress(Math.round((p.loaded / p.total) * 100));
                    }
                }
            });
        })().catch(err => { embedderPromise = null; throw err; });
    }
    return embedderPromise;
}

async function getClassifier(onProgress) {
    if (!classifierPromise) {
        classifierPromise = (async () => {
            const { pipeline } = await lib();
            return pipeline('image-classification', IMAGE_MODEL, {
                dtype: 'q8',
                progress_callback: p => {
                    if (onProgress && p.status === 'progress' && p.total) {
                        onProgress(Math.round((p.loaded / p.total) * 100));
                    }
                }
            });
        })().catch(err => { classifierPromise = null; throw err; });
    }
    return classifierPromise;
}

/* ---------------------------------------------------------------- knowledge
 * Built from the live DOM rather than a duplicated copy, so it can never drift
 * out of sync with what the page actually says.
 */
const clean = s => (s || '').replace(/\s+/g, ' ').trim();

// Each card already carries a data-domain. Spelling it out gives the embedder
// the signal the prose lacks: without this, "computer vision" matched the
// OpenGL flight simulator, because "computer graphics" sits closer in
// embedding space than a description of a disease classifier does.
const DOMAIN_TEXT = {
    ai: 'Artificial intelligence, deep learning, neural networks and computer vision.',
    ml: 'Machine learning, predictive modelling, regression and classification.',
    web: 'Full-stack web development, APIs, databases and deployment.',
    mobile: 'Mobile application development.',
    // Deliberately avoids the phrase "computer graphics": MiniLM scores it
    // almost identically to "computer vision", which put the OpenGL flight
    // simulator above the actual vision models.
    systems: 'Low-level systems programming, 3D rendering and OpenGL.'
};

function buildKnowledgeBase() {
    const kb = [];
    const push = (title, text, href, kind) => {
        text = clean(text);
        if (text.length > 25) kb.push({ title: clean(title), text, href, kind });
    };

    document.querySelectorAll('.project-card').forEach(card => {
        const title = card.querySelector('.p-title')?.textContent;
        const cat = card.querySelector('.p-cat')?.textContent;
        const desc = card.querySelector('.p-desc')?.textContent;
        const tags = [...card.querySelectorAll('.p-tags span')].map(s => s.textContent).join(', ');
        const metrics = [...card.querySelectorAll('.p-metrics li')]
            .map(li => clean(li.textContent)).join('; ');
        const link = card.querySelector('.p-link')?.getAttribute('href');
        const domain = DOMAIN_TEXT[card.dataset.domain] || '';
        push(title, `${domain} ${cat}. ${desc} Built with ${tags}.` +
                    `${metrics ? ' Measured results: ' + metrics + '.' : ''}`,
             link, 'project');
    });

    document.querySelectorAll('.skill-group').forEach(g => {
        const cat = g.querySelector('.skill-cat')?.childNodes[0]?.textContent;
        const items = [...g.querySelectorAll('.skill-chip')].map(c => c.textContent).join(', ');
        push(cat, `${cat}: ${items}.`, '#skills', 'skills');
    });

    document.querySelectorAll('.timeline-item').forEach(item => {
        push(item.querySelector('.t-title')?.textContent,
             `${clean(item.querySelector('.t-date')?.textContent)}. ${clean(item.querySelector('.t-desc')?.textContent)}`,
             '#experience', 'experience');
    });

    document.querySelectorAll('.cred-card').forEach(c => {
        push(c.querySelector('.cred-title')?.textContent, c.textContent, '#credentials', 'credential');
    });

    document.querySelectorAll('#research .a-card').forEach(c => {
        push(c.querySelector('.a-card-title')?.textContent, c.textContent, '#research', 'research');
    });

    const about = document.querySelector('.about-content-detailed');
    if (about) push('About Md Tanvir Islam', about.textContent.slice(0, 700), '#about', 'about');

    const contact = document.querySelector('.contact-left');
    if (contact) push('Contact', contact.textContent, '#contact', 'contact');

    return kb;
}

let kb = null;
let kbVectors = null;

function cosine(a, b) {
    let d = 0;
    for (let i = 0; i < a.length; i++) d += a[i] * b[i];
    return d;                       // vectors are normalised, so dot == cosine
}

async function ensureIndex(onProgress) {
    if (kbVectors) return;
    const extractor = await getEmbedder(onProgress);
    kb = buildKnowledgeBase();
    const out = await extractor(
        kb.map(e => `${e.kind}: ${e.title}. ${e.text}`), { pooling: 'mean', normalize: true });
    kbVectors = out.tolist();
}

async function embedQuery(q) {
    const extractor = await getEmbedder();
    const out = await extractor([q], { pooling: 'mean', normalize: true });
    return out.tolist()[0];
}

// Mild prior over entry types. The skills entries list dozens of tools, so on
// raw cosine they out-rank the specific project that actually answers the
// question; this nudges the ranking back without hiding anything.
const KIND_WEIGHT = {
    project: 1.06, research: 1.0, about: 1.0, contact: 1.0,
    experience: 0.97, credential: 0.96, skills: 0.9
};

/** Rank knowledge-base entries against a natural-language query. */
export async function search(query, k = 4, onProgress) {
    await ensureIndex(onProgress);
    const qv = await embedQuery(query);
    return kbVectors
        .map((v, i) => ({
            ...kb[i],
            score: cosine(qv, v) * (KIND_WEIGHT[kb[i].kind] ?? 1)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, k);
}

/** Rank the project cards themselves, for the Work-section search box. */
let cardVectors = null;
let cardEls = null;

export async function rankProjects(query, onProgress) {
    if (!cardVectors) {
        const extractor = await getEmbedder(onProgress);
        cardEls = [...document.querySelectorAll('.project-card')];
        const texts = cardEls.map(c => clean(
            [DOMAIN_TEXT[c.dataset.domain] || '',
             c.querySelector('.p-title')?.textContent,
             c.querySelector('.p-cat')?.textContent,
             c.querySelector('.p-desc')?.textContent,
             [...c.querySelectorAll('.p-tags span')].map(s => s.textContent).join(' ')].join('. ')));
        const out = await extractor(texts, { pooling: 'mean', normalize: true });
        cardVectors = out.tolist();
    }
    const qv = await embedQuery(query);
    return cardEls
        .map((el, i) => ({ el, score: cosine(qv, cardVectors[i]) }))
        .sort((a, b) => b.score - a.score);
}

/** Answer a visitor question with the closest real content on the page.
 *
 * Returns a short ranked list rather than a single answer. Retrieval over ~40
 * short chunks is not reliable enough at rank 1 to bet the whole reply on it
 * -- "computer vision" and "computer graphics" sit close together in embedding
 * space, for instance -- and a ranked list is what the model actually
 * produces, so showing it is both more useful and more honest.
 */
export async function ask(question, onProgress) {
    const hits = await search(question, 4, onProgress);
    const good = hits.filter(h => h.score > 0.24);
    if (!good.length) {
        return {
            confident: false,
            text: 'Nothing on this page matches that closely. Try asking about a project, ' +
                  'a technology, the research work, the certifications, or how to get in touch.',
            hits: []
        };
    }
    return { confident: true, hits: good.slice(0, 3) };
}

/** Classify an image file with a real vision model, entirely in the browser. */
export async function classify(file, onProgress) {
    const classifier = await getClassifier(onProgress);
    const url = URL.createObjectURL(file);
    try {
        return await classifier(url, { top_k: 5 });
    } finally {
        URL.revokeObjectURL(url);
    }
}

export const modelInfo = { EMBED_MODEL, IMAGE_MODEL };
