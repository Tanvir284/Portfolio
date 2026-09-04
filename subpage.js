/* Shared behaviour for about / ai-projects / hire.
   Deliberately small: the sub-pages skip Lenis, the particle field and the
   preloader, so they load fast and reuse only what they actually need. */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const storage = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
};

/* --- Theme (must match index.html so the choice carries across pages) --- */
const modeToggleBtn = document.getElementById('mode-toggle');
if (modeToggleBtn) {
    const modeIcon = modeToggleBtn.querySelector('i') || document.createElement('i');
    if (storage.get('theme') === 'light') {
        document.documentElement.classList.add('light-mode');
        modeIcon.classList.replace('fa-moon', 'fa-sun');
    }
    modeToggleBtn.addEventListener('click', () => {
        const root = document.documentElement;
        root.classList.add('theme-switching');
        root.classList.toggle('light-mode');
        void root.offsetWidth;
        requestAnimationFrame(() => requestAnimationFrame(
            () => root.classList.remove('theme-switching')));
        const light = root.classList.contains('light-mode');
        storage.set('theme', light ? 'light' : 'dark');
        modeIcon.classList.replace(light ? 'fa-moon' : 'fa-sun', light ? 'fa-sun' : 'fa-moon');
    });
}

const savedAccent = storage.get('accent');
const accents = {
    cyan: { primary: '#00f3ff', secondary: '#b000ff', glow: 'rgba(0, 243, 255, 0.4)' },
    emerald: { primary: '#00ff9d', secondary: '#00b8ff', glow: 'rgba(0, 255, 157, 0.4)' },
    crimson: { primary: '#ff0055', secondary: '#ff9d00', glow: 'rgba(255, 0, 85, 0.4)' }
};
if (savedAccent && accents[savedAccent]) {
    const t = accents[savedAccent];
    document.documentElement.style.setProperty('--primary', t.primary);
    document.documentElement.style.setProperty('--secondary', t.secondary);
    document.documentElement.style.setProperty('--glow', '0 0 20px ' + t.glow);
}

/* --- Mobile menu (nav markup is shared, so this must be too) --- */
function toggleMenu() {
    const navItems = document.querySelector('.nav-items');
    const toggle = document.querySelector('.menu-toggle');
    const icon = toggle && toggle.querySelector('i');
    if (!navItems) return;
    const isOpen = navItems.classList.toggle('active');
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));
    if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    }
}

document.querySelectorAll('.nav-items a').forEach(link => {
    link.addEventListener('click', () => {
        const navItems = document.querySelector('.nav-items');
        if (navItems && navItems.classList.contains('active')) toggleMenu();
    });
});

/* --- Custom cursor, matching the main page --- */
const cursorOuter = document.querySelector('.cursor-outer');
const cursorInner = document.querySelector('.cursor-inner');
if (cursorOuter && cursorInner && typeof gsap !== 'undefined') {
    window.addEventListener('mousemove', e => {
        gsap.to(cursorOuter, { x: e.clientX, y: e.clientY, duration: 0.15, ease: 'power2.out' });
        gsap.set(cursorInner, { x: e.clientX, y: e.clientY });
    });
    document.querySelectorAll('a, button, .a-card, .ai-row, .social-btn').forEach(el => {
        el.addEventListener('mouseenter', () => cursorOuter.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hover'));
    });
}

/* --- Scroll progress --- */
const progressBar = document.getElementById('progressBar');
if (progressBar) {
    const update = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        progressBar.style.width = (height > 0 ? (winScroll / height) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
}

/* --- Back to top --- */
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        backToTopBtn.classList.toggle('active', window.scrollY > 500);
    }, { passive: true });
    const go = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    backToTopBtn.addEventListener('click', go);
    backToTopBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
}

/* --- Count-up statistics --- */
const statNums = document.querySelectorAll('.stat-num[data-count]');
if (statNums.length) {
    const runCount = (el) => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        if (prefersReducedMotion) { el.textContent = target + suffix; return; }
        const started = performance.now();
        const step = (now) => {
            const t = Math.min((now - started) / 1100, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        // Guarantee the real number lands even where rAF is throttled or never
        // runs (background tabs, non-painting contexts). Showing 0 is worse
        // than showing it without the animation.
        setTimeout(() => { el.textContent = target + suffix; }, 1250);
    };

    // Plain scroll/rect check rather than IntersectionObserver: the counters
    // must never be left showing 0 if the observer does not report.
    const pending = new Set(statNums);
    const viewportH = () => window.innerHeight || document.documentElement.clientHeight || 0;
    const sweep = () => {
        const h = viewportH();
        pending.forEach(el => {
            const r = el.getBoundingClientRect();
            // If the viewport height is unavailable, do not gate on it: a stat
            // left reading 0 is far worse than one that counted early.
            if (h === 0 || (r.top < h * 0.92 && r.bottom > 0)) {
                pending.delete(el);
                runCount(el);
            }
        });
        if (!pending.size) window.removeEventListener('scroll', sweep);
    };
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep, { passive: true });
    sweep();
}

/* --- Contact form (hire page) --- */
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');
const formStatus = document.getElementById('form-status');

function closeModal() {
    if (successModal) successModal.classList.remove('active');
}

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Only the visible required fields -- the _honey honeypot is empty by design
        const fields = contactForm.querySelectorAll('input[required], textarea[required]');
        let valid = true;
        fields.forEach(f => { if (!f.value.trim()) valid = false; });
        if (!valid) return;

        const btn = contactForm.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        if (formStatus) {
            formStatus.hidden = true;
            formStatus.textContent = '';
            formStatus.classList.remove('error');
        }
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
        btn.style.opacity = '0.7';

        fetch('https://formsubmit.co/ajax/ruhittanvir14@gmail.com', {
            method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' }
        })
            .then(r => r.json())
            .then(data => {
                if (data && String(data.success) === 'false') throw new Error(data.message || 'rejected');
                btn.innerHTML = original;
                btn.style.opacity = '1';
                contactForm.reset();
                if (successModal) successModal.classList.add('active');
            })
            .catch(err => {
                console.error('Contact form submission failed:', err);
                btn.innerHTML = original;
                btn.style.opacity = '1';
                if (formStatus) {
                    formStatus.textContent =
                        'Transmission failed. Please email ruhittanvir14@gmail.com directly.';
                    formStatus.classList.add('error');
                    formStatus.hidden = false;
                }
            });
    });
}

/* --- Footer year --- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
