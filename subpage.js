/* Shared behaviour for about / ai-projects / hire / resume / 404.
   Includes the full Photorealistic NASA 3D Solar System & Galaxy Space Tour. */

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
        if (typeof syncThreeColors === 'function') syncThreeColors();
    });
}

const resumeThemeBtn = document.getElementById('theme-toggle');
if (resumeThemeBtn) {
    resumeThemeBtn.addEventListener('click', () => {
        if (typeof syncThreeColors === 'function') setTimeout(syncThreeColors, 10);
    });
}

const savedAccent = storage.get('accent');
const accents = {
    cyan: { primary: '#00f3ff', secondary: '#b000ff', glow: 'rgba(0, 243, 255, 0.4)' },
    emerald: { primary: '#00ff9d', secondary: '#00b8ff', glow: 'rgba(0, 255, 157, 0.4)' },
    crimson: { primary: '#ff0055', secondary: '#ff9d00', glow: 'rgba(255, 0, 85, 0.4)' }
};
if (savedAccent && accents[savedAccent]) {
    document.documentElement.setAttribute('data-accent', savedAccent);
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

/* --- Custom cursor, matching the main page (zero-allocation quickTo) --- */
const cursorOuter = document.querySelector('.cursor-outer');
const cursorInner = document.querySelector('.cursor-inner');
if (cursorOuter && cursorInner && typeof gsap !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
    const xOuter = gsap.quickTo ? gsap.quickTo(cursorOuter, 'x', { duration: 0.15, ease: 'power2.out' }) : null;
    const yOuter = gsap.quickTo ? gsap.quickTo(cursorOuter, 'y', { duration: 0.15, ease: 'power2.out' }) : null;
    const xInner = gsap.quickSetter ? gsap.quickSetter(cursorInner, 'x', 'px') : null;
    const yInner = gsap.quickSetter ? gsap.quickSetter(cursorInner, 'y', 'px') : null;
    window.addEventListener('mousemove', e => {
        if (xOuter && yOuter) { xOuter(e.clientX); yOuter(e.clientY); }
        if (xInner && yInner) { xInner(e.clientX); yInner(e.clientY); }
    }, { passive: true });
    document.querySelectorAll('a, button, .a-card, .ai-row, .social-btn').forEach(el => {
        el.addEventListener('mouseenter', () => cursorOuter.classList.add('hover'), { passive: true });
        el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hover'), { passive: true });
    });
}

/* --- Editorial subtitles --- */
document.querySelectorAll('.section-header p:not(.eyebrow)').forEach(p => {
    p.textContent = p.textContent.replace(/^\s*\/\/\s*/, '');
});

/* --- Scroll progress (rAF-throttled) --- */
const progressBar = document.getElementById('progressBar');
if (progressBar) {
    let maxScrollHeight = 1;
    let progressTicking = false;
    const recalcScrollHeight = () => {
        maxScrollHeight = Math.max(1, document.documentElement.scrollHeight - document.documentElement.clientHeight);
    };
    const update = () => {
        progressTicking = false;
        const winScroll = window.scrollY || document.documentElement.scrollTop || 0;
        progressBar.style.width = Math.min(100, Math.max(0, (winScroll / maxScrollHeight) * 100)) + '%';
    };
    window.addEventListener('resize', recalcScrollHeight, { passive: true });
    window.addEventListener('load', recalcScrollHeight, { passive: true });
    recalcScrollHeight();
    window.addEventListener('scroll', () => {
        if (!progressTicking) {
            progressTicking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
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
        setTimeout(() => { el.textContent = target + suffix; }, 1250);
    };

    const pending = new Set(statNums);
    const viewportH = () => window.innerHeight || document.documentElement.clientHeight || 0;
    const sweep = () => {
        const h = viewportH();
        pending.forEach(el => {
            const r = el.getBoundingClientRect();
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

/* --- PHOTOREALISTIC NASA 3D SOLAR SYSTEM & GALAXY SPACE TOUR (SHARED ON ALL SUBPAGES) --- */
const container = document.getElementById('webgl-container');
let scene, camera, renderer, particlesMesh, coreMesh, milkyWaySkyMesh;
let farGeo, nearGeo, farCount = 1400, nearCount = 300;
let shootingStars = [];
let warpSpeed = 0;
let targetWarpSpeed = 0;
let lastScrollYSpace = window.scrollY || 0;
let sunLight, ambientLight;
let tourBodies = [];
let bgGalaxies = [];
const TOUR_SPACING = 28;
const TOUR_DEFS = [
    {
        id: 'saturn', side: 1, yOff: 1.9, radius: 2.35, tilt: [0.42, -0.25, -0.30],
        map: 'assets/space/saturn.webp', ringMap: 'assets/space/saturn_ring_disc.webp',
        atmoRGB: [0.92, 0.82, 0.58], roughness: 0.72, hasMoon: true
    },
    {
        id: 'mars', side: -1, yOff: -1.4, radius: 1.75, tilt: [0.20, 0.15, 0.38],
        map: 'assets/space/mars.webp', bump: 'assets/space/mars_bump.webp', bumpScale: 0.05,
        atmoRGB: [0.92, 0.45, 0.25], roughness: 0.88, hasMoon: true
    },
    {
        id: 'sun', side: 1, yOff: 2.3, radius: 2.95, tilt: [0.05, 0.00, 0.06],
        map: 'assets/space/sun.webp', isSun: true
    },
    {
        id: 'moon', side: -1, yOff: 1.6, radius: 1.38, tilt: [0.10, -0.10, 0.12],
        map: 'assets/space/moon.webp', bump: 'assets/space/moon_bump.webp', bumpScale: 0.045,
        roughness: 0.94
    },
    {
        id: 'mercury', side: 1, yOff: -1.8, radius: 1.25, tilt: [0.08, 0.12, -0.05],
        map: 'assets/space/mercury.webp', bump: 'assets/space/moon_bump.webp', bumpScale: 0.035,
        roughness: 0.92
    },
    {
        id: 'venus', side: -1, yOff: 1.9, radius: 1.90, tilt: [0.16, -0.18, 0.10],
        map: 'assets/space/venus.webp', atmoRGB: [0.96, 0.78, 0.42], roughness: 0.68
    },
    {
        id: 'jupiter', side: 1, yOff: -1.1, radius: 2.85, tilt: [0.14, 0.10, -0.15],
        map: 'assets/space/jupiter.webp', atmoRGB: [0.90, 0.72, 0.52], roughness: 0.70, hasMoon: true
    },
    {
        id: 'uranus', side: -1, yOff: 2.1, radius: 2.02, tilt: [0.32, 0.18, 1.38],
        map: 'assets/space/uranus.webp', ringMap: 'assets/space/uranus_ring_disc.webp',
        atmoRGB: [0.48, 0.88, 0.96], roughness: 0.65
    },
    {
        id: 'neptune', side: 1, yOff: -1.7, radius: 1.98, tilt: [0.26, -0.16, 0.42],
        map: 'assets/space/neptune.webp', atmoRGB: [0.25, 0.52, 0.98], roughness: 0.65, hasMoon: true
    },
    {
        id: 'galaxy', side: -1, yOff: 1.8, radius: 3.60, tilt: [0.64, 0.20, -0.35],
        map: 'assets/space/galaxy_disc.webp', isGalaxy: true
    }
];
const TOTAL_TRACK_LEN = TOUR_DEFS.length * TOUR_SPACING;
const texCacheSpace = {};
let texLoaderSpace = null;

function loadSpaceTex(url) {
    if (texCacheSpace[url]) return texCacheSpace[url];
    if (!texLoaderSpace) texLoaderSpace = new THREE.TextureLoader();
    const t = texLoaderSpace.load(url);
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    texCacheSpace[url] = t;
    return t;
}

function makeStarSprite() {
    if (texCacheSpace.starSprite) return texCacheSpace.starSprite;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.14, 'rgba(245, 248, 255, 0.95)');
    g.addColorStop(0.35, 'rgba(180, 205, 255, 0.22)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    texCacheSpace.starSprite = new THREE.CanvasTexture(c);
    return texCacheSpace.starSprite;
}

function makeSolarCoronaTexture() {
    if (texCacheSpace.solarCorona) return texCacheSpace.solarCorona;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(128, 128, 28, 128, 128, 128);
    g.addColorStop(0.00, 'rgba(255, 250, 235, 0.95)');
    g.addColorStop(0.18, 'rgba(253, 186, 116, 0.55)');
    g.addColorStop(0.45, 'rgba(234, 88, 12, 0.18)');
    g.addColorStop(1.00, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    texCacheSpace.solarCorona = new THREE.CanvasTexture(c);
    return texCacheSpace.solarCorona;
}

function createFresnelAtmosphereMesh(radius, rgb) {
    const geo = new THREE.SphereGeometry(radius * 1.038, 36, 36);
    const mat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Vector3(rgb[0], rgb[1], rgb[2]) },
            uSunDir: { value: new THREE.Vector3(-0.7, 0.45, 0.55).normalize() }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vWorldNormal = normalize(mat3(modelMatrix) * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 uColor;
            uniform vec3 uSunDir;
            varying vec3 vNormal;
            varying vec3 vWorldNormal;
            void main() {
                float viewRim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
                float fresnel = pow(viewRim, 3.6);
                float sunFacing = smoothstep(-0.35, 0.65, dot(vWorldNormal, uSunDir));
                float alpha = fresnel * (0.18 + 0.82 * sunFacing) * 0.78;
                gl_FragColor = vec4(uColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Mesh(geo, mat);
}

function createPhotorealisticGalaxy(radius, isBackground) {
    const grp = new THREE.Group();
    const planeSize = radius * 2.2;
    const discGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const discMat = new THREE.MeshBasicMaterial({
        map: loadSpaceTex('assets/space/galaxy_disc.webp'),
        transparent: true,
        opacity: isBackground ? 0.68 : 0.92,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.rotation.x = Math.PI / 2;
    grp.add(discMesh);

    const starCount = isBackground ? 220 : 380;
    const pGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const r = Math.pow(Math.random(), 1.5) * radius;
        const arm = ((i % 2) * Math.PI) + r * 0.85 + (Math.random() - 0.5) * 0.6;
        pos[i * 3] = Math.cos(arm) * r;
        pos[i * 3 + 1] = (Math.random() - 0.5) * (0.22 + (radius - r) * 0.05);
        pos[i * 3 + 2] = Math.sin(arm) * r;
        const t = r / radius;
        col[i * 3] = t < 0.3 ? 1.0 : 0.78;
        col[i * 3 + 1] = t < 0.3 ? 0.92 : 0.85;
        col[i * 3 + 2] = 1.0;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.18,
        map: makeStarSprite(),
        vertexColors: true,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    }));
    grp.add(pts);
    return { group: grp, disc: discMesh, points: pts };
}

function populateStarColors(geo, count, isLight) {
    const cols = new Float32Array(count * 3);
    const paletteDark = [
        [0.98, 0.99, 1.00],
        [0.86, 0.92, 1.00],
        [1.00, 0.96, 0.88],
        [0.74, 0.84, 1.00],
        [1.00, 0.89, 0.74]
    ];
    const paletteLight = [
        [0.12, 0.24, 0.62],
        [0.22, 0.32, 0.72],
        [0.32, 0.22, 0.68],
        [0.15, 0.38, 0.78]
    ];
    const pal = isLight ? paletteLight : paletteDark;
    for (let i = 0; i < count; i++) {
        const c = pal[i % pal.length];
        cols[i * 3] = c[0];
        cols[i * 3 + 1] = c[1];
        cols[i * 3 + 2] = c[2];
    }
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
}

function syncThreeColors() {
    const isLight = document.documentElement.classList.contains('light-mode');
    const blend = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (farGeo) populateStarColors(farGeo, farCount, isLight);
    if (nearGeo) populateStarColors(nearGeo, nearCount, isLight);
    if (particlesMesh && particlesMesh.material) {
        particlesMesh.material.blending = blend;
        particlesMesh.material.opacity = isLight ? 0.68 : 0.88;
        particlesMesh.material.needsUpdate = true;
    }
    if (coreMesh && coreMesh.material) {
        coreMesh.material.blending = blend;
        coreMesh.material.opacity = isLight ? 0.78 : 0.95;
        coreMesh.material.needsUpdate = true;
    }
    if (milkyWaySkyMesh && milkyWaySkyMesh.material) {
        milkyWaySkyMesh.material.opacity = isLight ? 0.08 : 0.38;
        milkyWaySkyMesh.visible = !isLight;
    }
    if (ambientLight) ambientLight.intensity = isLight ? 0.75 : 0.14;
    if (sunLight) sunLight.intensity = isLight ? 1.55 : 2.35;
    shootingStars.forEach(s => {
        if (s.line && s.line.material) {
            s.line.material.color.set(isLight ? 0x2563eb : 0xe0f2fe);
            s.line.material.blending = blend;
        }
    });
}

function resetShootingStar(s, initialDelay = false) {
    s.active = false;
    s.wait = initialDelay ? (0.8 + Math.random() * 2.8) : (2.2 + Math.random() * 4.5);
    s.elapsed = 0;
    s.duration = 0.55 + Math.random() * 0.40;
    const fromLeft = Math.random() > 0.45;
    s.x = fromLeft ? (-24 - Math.random() * 12) : (12 + Math.random() * 18);
    s.y = 10 + Math.random() * 12;
    s.z = -14 - Math.random() * 18;
    const dir = fromLeft ? 1 : -1;
    s.vx = dir * (30 + Math.random() * 16);
    s.vy = -(15 + Math.random() * 10);
    s.vz = 4 + Math.random() * 6;
    s.tailLen = 2.8 + Math.random() * 1.6;
    if (s.line) s.line.material.opacity = 0;
}

function buildSpaceTourStop(def, index, isLight) {
    const group = new THREE.Group();
    group.rotation.set(def.tilt[0], def.tilt[1], def.tilt[2]);
    scene.add(group);
    const stopObj = {
        def, group, sphere: null, ring: null, ringDust: null,
        moonPivot: null, coronaOuter: null, galaxyObj: null,
        zPos: -14 - index * TOUR_SPACING
    };
    if (def.isGalaxy) {
        const gal = createPhotorealisticGalaxy(def.radius * 1.9, false);
        group.add(gal.group);
        stopObj.galaxyObj = gal;
        return stopObj;
    }
    const sphereGeo = new THREE.SphereGeometry(def.radius, 44, 44);
    let sphereMat;
    if (def.isSun) {
        sphereMat = new THREE.MeshBasicMaterial({ map: loadSpaceTex(def.map) });
        const coronaSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeSolarCoronaTexture(),
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        }));
        coronaSprite.scale.set(def.radius * 4.6, def.radius * 4.6, 1);
        group.add(coronaSprite);
        stopObj.coronaOuter = coronaSprite;
    } else {
        const matConfig = {
            map: loadSpaceTex(def.map),
            roughness: def.roughness || 0.78,
            metalness: 0.04
        };
        if (def.bump) {
            matConfig.bumpMap = loadSpaceTex(def.bump);
            matConfig.bumpScale = def.bumpScale || 0.04;
        }
        sphereMat = new THREE.MeshStandardMaterial(matConfig);
    }
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(sphereMesh);
    stopObj.sphere = sphereMesh;

    if (def.atmoRGB) group.add(createFresnelAtmosphereMesh(def.radius, def.atmoRGB));

    if (def.ringMap) {
        const isSaturn = def.id === 'saturn';
        const ringSpan = isSaturn ? def.radius * 5.2 : def.radius * 3.8;
        const ringGeo = new THREE.PlaneGeometry(ringSpan, ringSpan);
        const ringMat = new THREE.MeshBasicMaterial({
            map: loadSpaceTex(def.ringMap),
            transparent: true,
            opacity: isSaturn ? 0.94 : 0.72,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
        stopObj.ring = ringMesh;

        if (isSaturn) {
            const dustCount = 260;
            const dustGeo = new THREE.BufferGeometry();
            const dustPos = new Float32Array(dustCount * 3);
            for (let i = 0; i < dustCount; i++) {
                const ang = Math.random() * Math.PI * 2;
                const r = def.radius * 1.25 + Math.random() * (def.radius * 1.25);
                dustPos[i * 3] = Math.cos(ang) * r;
                dustPos[i * 3 + 1] = (Math.random() - 0.5) * 0.06;
                dustPos[i * 3 + 2] = Math.sin(ang) * r;
            }
            dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
            populateStarColors(dustGeo, dustCount, isLight);
            const dustMesh = new THREE.Points(dustGeo, new THREE.PointsMaterial({
                size: 0.13,
                map: makeStarSprite(),
                vertexColors: true,
                transparent: true,
                opacity: 0.78,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            }));
            group.add(dustMesh);
            stopObj.ringDust = dustMesh;
        }
    }

    if (def.hasMoon) {
        const pivot = new THREE.Group();
        group.add(pivot);
        const mGeo = new THREE.SphereGeometry(Math.max(0.16, def.radius * 0.095), 20, 20);
        const mMat = new THREE.MeshStandardMaterial({
            map: loadSpaceTex('assets/space/moon.webp'),
            roughness: 0.90
        });
        const mMesh = new THREE.Mesh(mGeo, mMat);
        mMesh.position.set(def.ringMap ? def.radius * 2.85 : def.radius * 1.85, 0.12, 0);
        pivot.add(mMesh);
        stopObj.moonPivot = pivot;
    }
    return stopObj;
}

let mouseX3D = 0, mouseY3D = 0;
let clockSpace, prevTimeSpace = 0;

function initThreeJS() {
    if (!container) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 160);
    camera.position.z = 14;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    container.appendChild(renderer.domElement);

    const starSprite = makeStarSprite();
    const isLight = document.documentElement.classList.contains('light-mode');

    ambientLight = new THREE.AmbientLight(0xdbeafe, isLight ? 0.75 : 0.14);
    scene.add(ambientLight);
    sunLight = new THREE.DirectionalLight(0xfffdf8, isLight ? 1.55 : 2.35);
    sunLight.position.set(-22, 14, 18);
    scene.add(sunLight);

    const skyGeo = new THREE.SphereGeometry(135, 28, 28);
    const skyMat = new THREE.MeshBasicMaterial({
        map: loadSpaceTex('assets/space/milkyway_sky.webp'),
        side: THREE.BackSide,
        transparent: true,
        opacity: isLight ? 0.08 : 0.38,
        depthWrite: false
    });
    milkyWaySkyMesh = new THREE.Mesh(skyGeo, skyMat);
    scene.add(milkyWaySkyMesh);

    farGeo = new THREE.BufferGeometry();
    const farPos = new Float32Array(farCount * 3);
    for (let i = 0; i < farCount * 3; i += 3) {
        farPos[i] = (Math.random() - 0.5) * 115;
        farPos[i + 1] = (Math.random() - 0.5) * 70;
        farPos[i + 2] = -75 + Math.random() * 88;
    }
    farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
    populateStarColors(farGeo, farCount, isLight);
    particlesMesh = new THREE.Points(farGeo, new THREE.PointsMaterial({
        size: 0.19, map: starSprite, vertexColors: true, transparent: true,
        opacity: 0.88, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(particlesMesh);

    nearGeo = new THREE.BufferGeometry();
    const nearPos = new Float32Array(nearCount * 3);
    for (let i = 0; i < nearCount * 3; i += 3) {
        nearPos[i] = (Math.random() - 0.5) * 78;
        nearPos[i + 1] = (Math.random() - 0.5) * 48;
        nearPos[i + 2] = -52 + Math.random() * 64;
    }
    nearGeo.setAttribute('position', new THREE.BufferAttribute(nearPos, 3));
    populateStarColors(nearGeo, nearCount, isLight);
    coreMesh = new THREE.Points(nearGeo, new THREE.PointsMaterial({
        size: 0.34, map: starSprite, vertexColors: true, transparent: true,
        opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    scene.add(coreMesh);

    bgGalaxies = [];
    const gal1 = createPhotorealisticGalaxy(9.5, true);
    gal1.group.position.set(-24, 10, -92);
    gal1.group.rotation.set(0.62, -0.30, -0.42);
    scene.add(gal1.group);
    bgGalaxies.push(gal1);

    const gal2 = createPhotorealisticGalaxy(7.2, true);
    gal2.group.position.set(26, -9, -86);
    gal2.group.rotation.set(0.70, 0.25, 0.34);
    scene.add(gal2.group);
    bgGalaxies.push(gal2);

    tourBodies = TOUR_DEFS.map((def, idx) => buildSpaceTourStop(def, idx, isLight));

    shootingStars = [];
    for (let k = 0; k < 2; k++) {
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
        const lineMat = new THREE.LineBasicMaterial({
            color: 0xe0f2fe, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
        });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        const sObj = { line, geo: lineGeo };
        resetShootingStar(sObj, true);
        sObj.wait += k * 2.5;
        shootingStars.push(sObj);
    }

    syncThreeColors();
    if (renderer.compile) renderer.compile(scene, camera);
    clockSpace = new THREE.Clock();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });
    document.addEventListener('mousemove', e => {
        mouseX3D = (e.clientX - window.innerWidth / 2) * 0.0022;
        mouseY3D = (e.clientY - window.innerHeight / 2) * 0.0022;
    }, { passive: true });
    window.addEventListener('scroll', () => {
        const cur = window.scrollY || 0;
        const delta = Math.abs(cur - lastScrollYSpace);
        lastScrollYSpace = cur;
        targetWarpSpeed = Math.min(0.24, targetWarpSpeed + Math.min(delta, 100) * 0.0005);
    }, { passive: true });

    animateThreeJS();
}

function animateThreeJS() {
    if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
    }
    requestAnimationFrame(animateThreeJS);
    if (document.hidden) return;

    const elapsedTime = clockSpace.getElapsedTime();
    const dt = Math.min(0.033, elapsedTime - prevTimeSpace || 0.016);
    prevTimeSpace = elapsedTime;

    targetWarpSpeed *= 0.90;
    warpSpeed += (targetWarpSpeed - warpSpeed) * 0.08;
    const stepFar = (0.020 + warpSpeed * 0.28);
    const stepNear = (0.038 + warpSpeed * 0.48);

    if (milkyWaySkyMesh) milkyWaySkyMesh.rotation.y = elapsedTime * 0.006;

    const fArr = farGeo.attributes.position.array;
    for (let i = 2; i < fArr.length; i += 3) {
        fArr[i] += stepFar;
        if (fArr[i] > 14) fArr[i] = -75;
    }
    farGeo.attributes.position.needsUpdate = true;

    const nArr = nearGeo.attributes.position.array;
    for (let i = 2; i < nArr.length; i += 3) {
        nArr[i] += stepNear;
        if (nArr[i] > 14) nArr[i] = -52;
    }
    nearGeo.attributes.position.needsUpdate = true;

    for (let g = 0; g < bgGalaxies.length; g++) {
        bgGalaxies[g].disc.rotation.z = -elapsedTime * 0.04;
        bgGalaxies[g].points.rotation.y = elapsedTime * 0.04;
    }

    const tourStep = (3.6 + warpSpeed * 7.5) * dt;
    const isMobile = window.innerWidth < 768;
    const lateralScale = isMobile ? 0.52 : (window.innerWidth < 1100 ? 0.78 : 1.0);
    const bodyScale = isMobile ? 0.68 : (window.innerWidth < 1100 ? 0.85 : 1.0);

    for (let i = 0; i < tourBodies.length; i++) {
        const b = tourBodies[i];
        b.zPos += tourStep;
        if (b.zPos > 19) b.zPos -= TOTAL_TRACK_LEN;
        if (b.zPos < -115) {
            b.group.position.set(0, 0, -180);
            continue;
        }
        const approachNorm = Math.max(0, Math.min(1, (b.zPos + 105) / 120));
        const xPos = b.def.side * (3.2 + approachNorm * 7.2) * lateralScale;
        const yPos = b.def.yOff * lateralScale + Math.sin(elapsedTime * 0.45 + i) * 0.18;
        b.group.position.set(xPos, yPos, b.zPos);

        const distScale = b.zPos < -88 ? Math.max(0.01, (b.zPos + 115) / 27) : 1.0;
        b.group.scale.setScalar(bodyScale * distScale);

        if (b.sphere) b.sphere.rotation.y = elapsedTime * (b.def.isSun ? 0.06 : 0.18);
        if (b.ring) b.ring.rotation.z = -elapsedTime * 0.05;
        if (b.ringDust) b.ringDust.rotation.y = elapsedTime * (0.18 + warpSpeed * 0.25);
        if (b.moonPivot) b.moonPivot.rotation.y = elapsedTime * 0.36;
        if (b.galaxyObj) {
            b.galaxyObj.disc.rotation.z = -elapsedTime * 0.10;
            b.galaxyObj.points.rotation.y = elapsedTime * 0.10;
        }
        if (b.coronaOuter) {
            const pulse = b.def.radius * (4.5 + Math.sin(elapsedTime * 1.8) * 0.22);
            b.coronaOuter.scale.set(pulse, pulse, 1);
        }
    }

    camera.position.x += (mouseX3D - camera.position.x) * 0.05;
    camera.position.y += (-mouseY3D - camera.position.y) * 0.05;
    camera.rotation.z = Math.sin(elapsedTime * 0.12) * 0.025;

    for (let k = 0; k < shootingStars.length; k++) {
        const s = shootingStars[k];
        if (!s.active) {
            s.wait -= dt;
            if (s.wait <= 0) { s.active = true; s.elapsed = 0; }
        } else {
            s.elapsed += dt;
            const t = s.elapsed / s.duration;
            if (t >= 1) resetShootingStar(s, false);
            else {
                s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
                const p = s.geo.attributes.position.array;
                const spd = Math.hypot(s.vx, s.vy, s.vz) || 1;
                p[0] = s.x; p[1] = s.y; p[2] = s.z;
                p[3] = s.x - (s.vx / spd) * s.tailLen;
                p[4] = s.y - (s.vy / spd) * s.tailLen;
                p[5] = s.z - (s.vz / spd) * s.tailLen;
                s.geo.attributes.position.needsUpdate = true;
                s.line.material.opacity = Math.sin(t * Math.PI) * 0.88;
            }
        }
    }
    renderer.render(scene, camera);
}

if (typeof THREE !== 'undefined') {
    initThreeJS();
}

