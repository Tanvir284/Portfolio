/* Wires the client-side models into the page.
 * Loaded as a module so it can dynamically import ai.js; every entry point
 * degrades to the existing non-ML behaviour if the model cannot load. */

const status = (el, msg) => { if (el) el.textContent = msg; };

/* ------------------------------------------------------------- assistant */
(function assistant() {
    const input = document.getElementById('chat-input');
    const send = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');
    if (!input || !send || !messages) return;

    // Take over from the keyword matcher in script.js
    window.__aiAssistantActive = true;

    const bubble = (html, isUser) => {
        const d = document.createElement('div');
        d.className = `chat-msg ${isUser ? 'user-msg' : 'ai-msg'}`;
        if (isUser) d.textContent = html; else d.innerHTML = html;
        messages.appendChild(d);
        messages.scrollTop = messages.scrollHeight;
        return d;
    };

    const esc = s => String(s).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let busy = false;

    async function handle() {
        const q = input.value.trim();
        if (!q || busy) return;
        busy = true;
        bubble(q, true);
        input.value = '';
        const thinking = bubble('<span class="typing-indicator">Loading the model…</span>', false);

        try {
            const ai = await import('./ai.js');
            const res = await ai.ask(q, pct => {
                thinking.innerHTML = `<span class="typing-indicator">Downloading model… ${pct}%</span>`;
            });
            if (!res.confident) {
                thinking.innerHTML = esc(res.text);
            } else {
                const items = res.hits.map(h => {
                    const snippet = h.text.length > 190 ? h.text.slice(0, 190).trim() + '…' : h.text;
                    const link = h.href ? ` <a href="${esc(h.href)}">open</a>` : '';
                    return `<li><strong>${esc(h.title)}</strong>` +
                           `<span class="chat-score">${Math.round(h.score * 100)}% match</span>` +
                           `<br>${esc(snippet)}${link}</li>`;
                }).join('');
                thinking.innerHTML =
                    `<span class="chat-related">Closest matches on this page:</span>` +
                    `<ol class="chat-hits">${items}</ol>`;
            }
        } catch (err) {
            console.warn('Assistant model unavailable, falling back:', err);
            thinking.innerHTML =
                'The language model could not load, so I cannot search the page right now. ' +
                'Everything is still reachable from the navigation above.';
        } finally {
            busy = false;
            messages.scrollTop = messages.scrollHeight;
        }
    }

    send.addEventListener('click', handle);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') handle(); });
})();

/* -------------------------------------------------- semantic project search */
(function projectSearch() {
    const box = document.getElementById('project-search');
    const note = document.getElementById('project-search-status');
    const grid = document.querySelector('.project-grid');
    if (!box || !grid) return;

    const cards = [...document.querySelectorAll('.project-card')];
    const originalOrder = cards.slice();
    let timer = null;

    // Clear only what the search itself changed, then hand control back to the
    // active filter. Removing is-hidden outright un-hid every card and made the
    // domain filters look broken.
    const reset = () => {
        originalOrder.forEach(c => { c.style.order = ''; c.classList.remove('is-match'); });
        if (typeof window.__applyProjectFilter === 'function') {
            window.__applyProjectFilter(window.__activeProjectFilter());
        } else {
            originalOrder.forEach(c => c.classList.remove('is-hidden'));
        }
        status(note, '');
    };

    const run = async (q) => {
        status(note, 'Loading the model…');
        try {
            const ai = await import('./ai.js');
            const ranked = await ai.rankProjects(q, pct => status(note, `Downloading model… ${pct}%`));
            const strong = ranked.filter(r => r.score > 0.18);
            const shown = strong.length ? strong : ranked.slice(0, 3);
            ranked.forEach(({ el }) => el.classList.add('is-hidden'));
            shown.forEach(({ el }, i) => {
                el.classList.remove('is-hidden');
                el.classList.add('is-match');
                el.style.order = i;
            });
            status(note, `${shown.length} project${shown.length === 1 ? '' : 's'} ranked by meaning, closest first`);
        } catch (err) {
            console.warn('Semantic search unavailable, using text match:', err);
            const needle = q.toLowerCase();
            let n = 0;
            cards.forEach(c => {
                const hit = c.textContent.toLowerCase().includes(needle);
                c.classList.toggle('is-hidden', !hit);
                if (hit) n++;
            });
            status(note, `${n} match${n === 1 ? '' : 'es'} (text search — model unavailable)`);
        }
    };

    box.addEventListener('input', () => {
        clearTimeout(timer);
        const q = box.value.trim();
        if (q.length < 3) { reset(); return; }
        status(note, 'Thinking…');
        timer = setTimeout(() => run(q), 400);
    });

    box.addEventListener('keydown', e => {
        if (e.key === 'Escape') { box.value = ''; reset(); }
    });

    // Picking a domain filter clears the search text and its ranking, but the
    // filter's own click handler decides which cards are hidden.
    document.querySelectorAll('.filter-btn').forEach(b =>
        b.addEventListener('click', () => {
            box.value = '';
            originalOrder.forEach(c => { c.style.order = ''; c.classList.remove('is-match'); });
            status(note, '');
        }));
})();

/* ------------------------------------------------------- image classifier */
(function imageClassifier() {
    const drop = document.getElementById('clf-drop');
    const file = document.getElementById('clf-file');
    const out = document.getElementById('clf-output');
    const note = document.getElementById('clf-status');
    const preview = document.getElementById('clf-preview');
    if (!drop || !file || !out) return;

    const render = (results) => {
        out.innerHTML = results.map(r => {
            const pct = Math.round(r.score * 100);
            return `<li class="clf-row">
                <span class="clf-label">${r.label.split(',')[0]}</span>
                <span class="clf-bar"><span style="width:${pct}%"></span></span>
                <span class="clf-pct">${pct}%</span>
            </li>`;
        }).join('');
    };

    async function handleFile(f) {
        if (!f || !f.type.startsWith('image/')) {
            status(note, 'That file is not an image.');
            return;
        }
        if (f.size > 12 * 1024 * 1024) {
            status(note, 'Image is larger than 12 MB — try a smaller one.');
            return;
        }
        if (preview) {
            preview.src = URL.createObjectURL(f);
            preview.hidden = false;
        }
        out.innerHTML = '';
        status(note, 'Loading the model…');
        try {
            const ai = await import('./ai.js');
            const res = await ai.classify(f, pct => status(note, `Downloading model… ${pct}%`));
            render(res);
            status(note, 'Classified in your browser — the image never left this device.');
        } catch (err) {
            console.warn('Image model unavailable:', err);
            status(note, 'The vision model could not load. Check your connection and try again.');
        }
    }

    file.addEventListener('change', () => handleFile(file.files[0]));
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); }
    });
    ['dragenter', 'dragover'].forEach(ev =>
        drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev =>
        drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
})();
