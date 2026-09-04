// Visitors who ask their OS for less motion get a calmer, static page.
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Small helper so a blocked/unavailable localStorage never breaks the page
const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } }
};

// Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: !prefersReducedMotion,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
})

// Integrate Lenis with GSAP ScrollTrigger
// Only needed if using advanced pin/sync, but good for base sync
lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
})

gsap.ticker.lagSmoothing(0)

// --- Light/Dark Mode Toggle ---
const modeToggleBtn = document.getElementById('mode-toggle');
if (modeToggleBtn) {
    const modeIcon = modeToggleBtn.querySelector('i') || document.createElement('i');

    // Check local storage for preference
    if (storage.get('theme') === 'light') {
        document.documentElement.classList.add('light-mode');
        // applied before paint, so no transition to suppress
        modeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    // Swap themes with transitions suppressed (see .theme-switching in CSS)
    const swapTheme = (fn) => {
        const root = document.documentElement;
        root.classList.add('theme-switching');
        fn();
        void root.offsetWidth;                       // force the new values to apply
        requestAnimationFrame(() => requestAnimationFrame(
            () => root.classList.remove('theme-switching')));
    };

    modeToggleBtn.addEventListener('click', () => {
        swapTheme(() => document.documentElement.classList.toggle('light-mode'));
        if (document.documentElement.classList.contains('light-mode')) {
            storage.set('theme', 'light');
            modeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            storage.set('theme', 'dark');
            modeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    });
}

// Mobile Menu Logic
function toggleMenu() {
    const navItems = document.querySelector('.nav-items');
    const toggle = document.querySelector('.menu-toggle');
    const icon = toggle && toggle.querySelector('i');
    if (!navItems) return;

    const isOpen = navItems.classList.toggle('active');

    // Keep assistive tech in sync with the menu state
    if (toggle) toggle.setAttribute('aria-expanded', String(isOpen));

    // Swap icon
    if (icon) {
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    }
}

// Close menu and cinematic transition when clicking a link
document.querySelectorAll('.nav-items a, a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');

        // Ensure it's an internal anchor link
        if (targetId && targetId.startsWith('#') && targetId.length > 1) {
            e.preventDefault(); // Stop native jump

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                if (prefersReducedMotion || typeof gsap === 'undefined') {
                    // Skip the cinematic wipe entirely
                    lenis.scrollTo(targetElement, { offset: -80 });
                } else {
                // Cinematic TV Transition
                const tl = gsap.timeline();

                // Hide scrollbar & block clicks during transition
                document.body.style.overflow = 'hidden';

                tl.to('.transition-bars', {
                    duration: 0.2, // Faster
                    scaleY: 1,
                    transformOrigin: "bottom left",
                    stagger: 0.05, // Snappier stagger
                    ease: "power2.inOut"
                })
                    .call(() => {
                        // Instantly snap to the section while screen is blacked out
                        lenis.scrollTo(targetElement, {
                            offset: -80,
                            duration: 0.001 // instantaneous leap since we are hidden
                        });
                    })
                    .to('.transition-bars', {
                        duration: 0.2, // Faster
                        scaleY: 0,
                        transformOrigin: "top left",
                        stagger: 0.05,
                        ease: "power2.inOut",
                        delay: 0.05 // Brief pause
                    })
                    .call(() => document.body.style.overflow = ''); // Restore scroll
                }
            }
        }

        // Close mobile menu if active
        const navItems = document.querySelector('.nav-items');
        if (navItems && navItems.classList.contains('active')) {
            toggleMenu();
        }
    });
});

// Scroll Progress
const progressBar = document.getElementById("progressBar");
if (progressBar) {
    const updateProgress = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        progressBar.style.width = scrolled + "%";
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
}

// Cursor Logic (Elite Version)
const cursorOuter = document.querySelector('.cursor-outer');
const cursorInner = document.querySelector('.cursor-inner');
let mouseX = 0, mouseY = 0;

if (cursorOuter && cursorInner) window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Smooth trailing for outer
    gsap.to(cursorOuter, {
        x: mouseX,
        y: mouseY,
        duration: 0.15,
        ease: "power2.out"
    });

    // Instant for inner
    gsap.set(cursorInner, {
        x: mouseX,
        y: mouseY
    });
});

// Cursor Hover States
const hoverElements = document.querySelectorAll('a, button, .project-card, .menu-toggle, .social-btn');
if (cursorOuter) hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorOuter.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hover'));
});

// Circle Text
const text = "SOFTWARE ENGINEER • AI ENGINEER • DATA SCIENTIST • MACHINE LEARNING • DEEP LEARNING • ";
const circleText = document.getElementById('circleText');
if (circleText) {
    circleText.innerHTML = text.split("").map(
        (char, i) => `<span style="transform:rotate(${i * 8}deg)">${char}</span>`
    ).join("");
}


/* --- 3D WEBGL NEURAL SPHERE (THREE.JS) --- */
const container = document.getElementById('webgl-container');
let scene, camera, renderer, particlesMesh;

function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create Particle Sphere
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
        // Spherical distribution
        const radius = 10;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos((Math.random() * 2) - 1);

        posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i + 2] = radius * Math.cos(phi);
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const material = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    window.addEventListener('resize', onWindowResize);

    // Mouse Interaction
    document.addEventListener('mousemove', onDocumentMouseMove);

    animateThreeJS();
}

let mouseX3D = 0;
let mouseY3D = 0;

function onDocumentMouseMove(event) {
    mouseX3D = (event.clientX - window.innerWidth / 2) * 0.001;
    mouseY3D = (event.clientY - window.innerHeight / 2) * 0.001;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

let clock = new THREE.Clock();

function animateThreeJS() {
    // A slowly rotating particle field is decorative motion; draw it once
    // and stop when the visitor has asked for reduced motion.
    if (prefersReducedMotion) {
        renderer.render(scene, camera);
        return;
    }

    requestAnimationFrame(animateThreeJS);

    const elapsedTime = clock.getElapsedTime();

    // Base Rotation
    particlesMesh.rotation.y = elapsedTime * 0.1;
    particlesMesh.rotation.z = elapsedTime * 0.05;

    // Mouse Interaction Parallax
    gsap.to(particlesMesh.rotation, {
        x: mouseY3D * 0.5,
        y: mouseX3D * 0.5 + (elapsedTime * 0.1),
        duration: 2,
        ease: "power2.out"
    });

    renderer.render(scene, camera);
}

// Initialize only if Three is loaded
if (typeof THREE !== 'undefined') {
    initThreeJS();
}



/* --- INTERACTIVE 3D BRAIN (brain.glb, lazy-loaded) --- */
const brainHost = document.getElementById('brain-canvas');

if (brainHost && typeof THREE !== 'undefined') {
    const status = document.getElementById('brain-status');
    const hint = document.getElementById('brain-hint');
    let started = false;

    const initBrain = () => {
        if (started) return;
        started = true;

        if (!THREE.GLTFLoader) {
            if (status) status.innerHTML = '<span>3D loader unavailable.</span>';
            return;
        }
        if (status) status.innerHTML =
            '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i><span>Loading neural model&hellip;</span>';

        const w = brainHost.clientWidth;
        const h = brainHost.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        brainHost.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        const key = new THREE.PointLight(0x00f3ff, 1.5, 100);
        key.position.set(3, 4, 5);
        scene.add(key);
        const rim = new THREE.PointLight(0xb000ff, 1.1, 100);
        rim.position.set(-4, -2, -4);
        scene.add(rim);

        const pivot = new THREE.Group();
        scene.add(pivot);

        new THREE.GLTFLoader().load('brain.glb', (gltf) => {
            const model = gltf.scene;

            // Give every part the site's holographic look instead of the
            // model's 59 original anatomical materials.
            model.traverse((child) => {
                if (!child.isMesh) return;
                child.material = new THREE.MeshPhongMaterial({
                    color: 0x0d2b33,
                    emissive: 0x00f3ff,
                    emissiveIntensity: 0.16,
                    shininess: 60,
                    transparent: true,
                    opacity: 0.92,
                    side: THREE.DoubleSide
                });
            });

            // Centre the model and scale it to a predictable size
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const centre = box.getCenter(new THREE.Vector3());
            model.position.sub(centre);
            const scale = 2.6 / Math.max(size.x, size.y, size.z);
            model.scale.setScalar(scale);
            pivot.add(model);

            camera.position.set(0, 0, 4.6);
            camera.lookAt(0, 0, 0);

            if (status) status.remove();
            if (hint) hint.hidden = false;

            let dragging = false, px = 0, py = 0;
            let velX = prefersReducedMotion ? 0 : 0.0025, velY = 0;

            const down = (x, y) => { dragging = true; px = x; py = y; };
            const move = (x, y) => {
                if (!dragging) return;
                velX = (x - px) * 0.005;
                velY = (y - py) * 0.005;
                pivot.rotation.y += velX;
                pivot.rotation.x += velY;
                px = x; py = y;
            };
            const up = () => { dragging = false; };

            const el = renderer.domElement;
            el.style.cursor = 'grab';
            el.addEventListener('pointerdown', e => { down(e.clientX, e.clientY); el.style.cursor = 'grabbing'; });
            window.addEventListener('pointermove', e => move(e.clientX, e.clientY));
            window.addEventListener('pointerup', () => { up(); el.style.cursor = 'grab'; });

            let visible = true;
            new IntersectionObserver(([e]) => { visible = e.isIntersecting; },
                { threshold: 0 }).observe(brainHost);

            (function loop() {
                requestAnimationFrame(loop);
                if (!visible || document.hidden) return;   // don't burn GPU off-screen
                if (!dragging) {
                    if (!prefersReducedMotion) pivot.rotation.y += 0.0025;
                    // ease out any flick momentum
                    velX *= 0.94; velY *= 0.94;
                    pivot.rotation.y += velX;
                    pivot.rotation.x += velY;
                }
                pivot.rotation.x = Math.max(-0.9, Math.min(0.9, pivot.rotation.x));
                renderer.render(scene, camera);
            })();

            window.addEventListener('resize', () => {
                const nw = brainHost.clientWidth, nh = brainHost.clientHeight;
                if (!nw || !nh) return;
                camera.aspect = nw / nh;
                camera.updateProjectionMatrix();
                renderer.setSize(nw, nh);
            });
        },
        undefined,
        (err) => {
            console.error('Could not load brain.glb:', err);
            if (status) status.innerHTML =
                '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i><span>3D model failed to load.</span>';
        });
    };

    // 3.2 MB is too heavy to fetch on page load -- wait until it is nearly in view
    new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) { obs.disconnect(); initBrain(); }
    }, { rootMargin: '200px' }).observe(brainHost);
}

/* --- TENSORFLOW.JS LIVE AI DEMO (COCO-SSD) --- */
const startCamBtn = document.getElementById('start-cam-btn');
const video = document.getElementById('webcam');
const canvas = document.getElementById('detection-canvas');
const fpsCounter = document.getElementById('fps-counter');
const loaderCam = document.getElementById('loader-cam');
let model = null;
let isDetecting = false;
let lastFrameTime = 0; // used by TF.js webcam detection
let camStream = null;  // kept so the camera can actually be released

async function loadModel() {
    if (!startCamBtn || !loaderCam) return;
    if (typeof cocoSsd === 'undefined') {
        loaderCam.innerHTML = `<i class="fas fa-exclamation-triangle"></i> MODEL LIBRARY UNAVAILABLE`;
        loaderCam.style.display = 'block';
        return;
    }
    startCamBtn.style.display = 'none';
    loaderCam.style.display = 'block';

    try {
        // Load the model.
        model = await cocoSsd.load();
        loaderCam.style.display = 'none';
        startWebcam();
    } catch (err) {
        console.error("Error loading model:", err);
        loaderCam.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ERROR LOADING NEURAL NET`;
    }
}

async function startWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
        });
        camStream = stream;
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.play();
            isDetecting = true;
            lastFrameTime = performance.now(); // otherwise the first reading is ~epoch-sized
            detectFrame();
        }, { once: true });
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        startCamBtn.style.display = 'block';
        startCamBtn.innerHTML = `<i class="fas fa-video-slash"></i> CAMERA ACCESS DENIED`;
        startCamBtn.disabled = true;
    }
}

async function detectFrame() {
    if (!isDetecting) return;

    // Skip work entirely while the tab is in the background
    if (document.hidden) {
        requestAnimationFrame(detectFrame);
        return;
    }

    // Calculate Latency (ms per frame)
    const now = performance.now();
    const duration = Math.round(now - lastFrameTime);
    if (fpsCounter) fpsCounter.innerText = duration;
    lastFrameTime = now;

    try {
        // Detect up to 5 objects in the video element
        const predictions = await model.detect(video, 5);
        renderPredictions(predictions);
    } catch (err) {
        console.error("Detection failed, stopping loop:", err);
        stopWebcam();
        return;
    }

    // Loop
    requestAnimationFrame(detectFrame);
}

// Release the camera instead of leaving it running forever
function stopWebcam() {
    isDetecting = false;
    if (camStream) {
        camStream.getTracks().forEach(track => track.stop());
        camStream = null;
    }
    if (video) video.srcObject = null;
}

window.addEventListener('pagehide', stopWebcam);

function renderPredictions(predictions) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Font settings
    ctx.font = '16px "JetBrains Mono"';
    ctx.textBaseline = 'top';

    predictions.forEach(prediction => {
        // Only render predictions with reasonable confidence (> 50%)
        if (prediction.score > 0.50) {
            const [x, y, width, height] = prediction.bbox;
            const text = `${prediction.class.toUpperCase()} - ${Math.round(prediction.score * 100)}%`;

            // Draw Bounding Box (Cyber Style)
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Draw Text Background
            const textWidth = ctx.measureText(text).width;
            ctx.fillStyle = '#00f3ff';
            ctx.fillRect(x, y - 20, textWidth + 10, 20);

            // Draw Text
            ctx.fillStyle = '#000000';
            ctx.fillText(text, x + 5, y - 18);
        }
    });
}

if (startCamBtn) {
    startCamBtn.addEventListener('click', loadModel);
}







/* --- AI CHATBOT ASSISTANT (JARVIS) --- */
const chatbotToggle = document.getElementById('chatbot-toggle');
const chatbotWindow = document.getElementById('ai-chatbot-window');
const closeChatbotBtn = document.getElementById('close-chatbot');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

// Set this to your deployed Cloudflare Worker URL to use a real LLM.
// See worker/README.md. While it is null the offline matcher below is used,
// so the assistant still works if the Worker is down or out of credit.
const CHAT_API = null; // e.g. 'https://tanvir-assistant.your-name.workers.dev'

// Conversation History for LLM Context
let chatHistory = [
    { role: 'system', content: "You are T.A.N.V.I.R., an elite AI assistant integrated into Md Tanvir Islam's portfolio. You are highly intelligent, professional, and slightly futuristic. Tanvir is an AI Architect and Software Engineer proficient in Neural Networks, Computer Vision, and Full-Stack development. His projects include a Chicken Disease Detection AI, Cardio Risk Predictor, and an object tracking model. Keep your answers concise, helpful, and tailored to a portfolio visitor. Format responses with HTML <br> for newlines if necessary, but keep it plain text mostly." }
];

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${isUser ? 'user-msg' : 'ai-msg'}`;

    if (isUser) {
        msgDiv.innerText = text;
    } else {
        msgDiv.innerHTML = text; // allow HTML like <br>
    }

    if (!chatMessages) return msgDiv;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgDiv;
}

async function handleChat() {
    if (!chatInput || !chatMessages) return;
    const userText = chatInput.value.trim();
    if (!userText) return;

    // Display user msg
    addMessage(userText, true);
    chatInput.value = '';

    // Add typing indicator
    const typingIndicator = addMessage('<span class="typing-indicator">...</span>', false);

    if (CHAT_API) {
        askTheModel(userText, typingIndicator);
        return;
    }

    // Offline fallback: a local keyword matcher. Not an LLM -- it is here so the
    // assistant still answers when no Worker is configured.
    setTimeout(() => {
        const lowerInput = userText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
        const words = lowerInput.split(/\s+/);

        let finalResponse = "My core neural pathways are currently processing other requests. Could you try rephrasing your query? Alternatively, explore the 'About' and 'Work' sections above.";
        let highestScore = 0;

        const knowledgeBase = [
            {
                intents: ["hello", "hi", "hey", "greetings", "sup", "morning"],
                points: 1, // lowered generic greetings priority
                response: "Greetings. I am Tanvir's virtual proxy, T.A.N.V.I.R. How may I assist you today?"
            },
            {
                intents: ["who", "what", "name", "ai", "identity", "yourself", "are you"],
                points: 4,
                response: "I am T.A.N.V.I.R., an artificial intelligence designed by Md Tanvir Islam. I exist to guide you through his elite portfolio and answer your technical inquiries."
            },
            {
                intents: ["skills", "tech", "stack", "languages", "proficient", "know", "tools", "frameworks", "technologies"],
                points: 5,
                response: "Tanvir is highly proficient in Neural Networks, Computer Vision, Deep Learning (CNNs, Autoencoders), MLOps, and Full-Stack Javascript & Python. He builds robust, scalable systems."
            },
            {
                intents: ["experience", "background", "work", "job", "career", "history"],
                points: 5,
                response: "He operates as an AI Architect and Software Engineer. His notable milestones include tracking diseases via Advanced CNNs, predicting Cardio Risks leveraging XGBoost, and deploying sophisticated web infrastructure."
            },
            {
                intents: ["education", "school", "degree", "university", "study", "college"],
                points: 5,
                response: "Tanvir is currently advancing his academic background with a B.Sc. in Computer Science & Engineering at BUBT (Bangladesh University of Business and Technology), expected 2025."
            },
            {
                intents: ["hire", "job", "recruiting", "opportunity", "contact", "email", "reach", "message"],
                points: 5,
                response: "An excellent decision. You may connect directly via the Contact section below, or email him. His systems indicate he is aggressively open to groundbreaking work and challenging roles."
            },
            {
                intents: ["projects", "portfolio", "built", "made", "created", "showcase", "work", "website"],
                points: 6, // Highest priority: "Can you build a website?"
                response: "Tanvir builds world-class systems. His technical arsenal features a Chicken Disease Detection AI, a precision Cardio Risk Predictor, an Aviator predictive model, and this very WebGL matrix you are currently interfacing with. Yes, he can build highly advanced websites and software."
            },
            {
                intents: ["thank", "thanks", "appreciate", "cool", "awesome", "amazing", "great", "nice"],
                points: 2,
                response: "You are very welcome. I will relay your positive feedback to my creator."
            },
            {
                intents: ["how", "does", "this", "model", "camera", "webcam", "neural", "net", "vision", "detect", "track"],
                points: 5,
                response: "The webcam feature uses TensorFlow.js to run a localized Neural Network (COCO-SSD) directly inside your browser. No image data is sent to an external server. It tracks and identifies objects locally with high precision."
            },
            {
                intents: ["what", "is", "ai", "artificial", "intelligence"],
                points: 5,
                response: "Artificial Intelligence is the simulation of human intelligence processes by machines, especially computer systems. Tanvir specializes in this, specifically in Computer Vision and machine learning models."
            }
        ];

        // Filler words appear as "intents" on several entries, so a question
        // like "what are your skills" scored higher on identity ("what", "are")
        // than on skills. They still count, but only at a fraction of the weight.
        const FILLER = new Set(['what', 'is', 'are', 'this', 'does', 'how', 'do',
            'can', 'the', 'a', 'an', 'your', 'you', 'me', 'my', 'tell']);

        // Scoring algorithm to find the best matching response intent
        for (const entry of knowledgeBase) {
            let currentScore = 0;
            for (const intent of entry.intents) {
                // Exact match gets massive points to overpower basic greetings
                if (words.includes(intent)) {
                    currentScore += FILLER.has(intent) ? entry.points * 0.25 : entry.points * 2;
                }
                // Partial match gets normal points
                else if (lowerInput.includes(intent) && intent.length > 3) {
                    currentScore += entry.points;
                }
            }

            // Just take the absolute highest score without a minimum barrier
            if (currentScore > highestScore) {
                highestScore = currentScore;
                finalResponse = entry.response;
            }
        }

        // If nothing matched at all, provide a default fallback
        if (highestScore === 0) {
            finalResponse = "My core neural pathways are currently processing other requests. Could you try rephrasing your query? Alternatively, explore the 'About' and 'Work' sections above.";
        }

        chatHistory.push({ role: 'user', content: userText });
        chatHistory.push({ role: 'assistant', content: finalResponse });

        typingIndicator.innerHTML = finalResponse.replace(/\n/g, '<br>');
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;

    }, 800); // Simulate API delay
}

// Real LLM path -- the API key lives in the Worker, never in this file.
async function askTheModel(userText, bubble) {
    const setText = (text) => {
        bubble.textContent = text;
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    try {
        const res = await fetch(CHAT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Send only the plain turns; the system prompt lives in the Worker
            body: JSON.stringify({
                message: userText,
                history: chatHistory.filter(m => m.role !== 'system').slice(-12)
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setText(data.error || 'The assistant is unavailable right now.');
            return;
        }

        setText(data.reply);
        chatHistory.push({ role: 'user', content: userText });
        chatHistory.push({ role: 'assistant', content: data.reply });
    } catch (err) {
        console.error('Assistant request failed:', err);
        setText('I could not reach the assistant. Please email ruhittanvir14@gmail.com.');
    }
}

if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener('click', () => {
        const isOpen = chatbotWindow.classList.toggle('active');
        chatbotToggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && chatInput) chatInput.focus();
    });

    const closeChat = () => {
        chatbotWindow.classList.remove('active');
        chatbotToggle.setAttribute('aria-expanded', 'false');
    };

    if (closeChatbotBtn) closeChatbotBtn.addEventListener('click', closeChat);
    if (chatSendBtn) chatSendBtn.addEventListener('click', handleChat);
    if (chatInput) chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChat();
    });

    // Escape closes the assistant
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatbotWindow.classList.contains('active')) closeChat();
    });
}

/* --- GSAP SCROLL ANIMATIONS --- */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !prefersReducedMotion) {
gsap.registerPlugin(ScrollTrigger);

// Hero Parallax
gsap.to('.hero-visual', {
    yPercent: 30,
    ease: "none",
    scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true
    }
});

// Fade Up Sections and Elements
gsap.utils.toArray('.section-header').forEach(header => {
    gsap.from(header, {
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
            trigger: header,
            start: "top 85%",
            toggleActions: "play none none reverse"
        }
    });
});

// Staggered Cards (About, Work)
gsap.utils.toArray(['.about-cards', '.project-grid', '.tech-stack-container']).forEach(container => {
    const children = Array.from(container.children);
    gsap.from(children, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
            trigger: container,
            start: "top 85%",
            toggleActions: "play none none reverse"
        }
    });
});

// Timeline Items GSAP reveal
gsap.utils.toArray('.timeline-item').forEach(item => {
    gsap.from(item, {
        opacity: 0,
        x: -50,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none reverse"
        }
    });
});


} // end GSAP scroll animations

// Initial Page Load Animations
if (!prefersReducedMotion) window.addEventListener('load', () => {
    // Reveal Hero Text
    gsap.from(".hero-content .tagline, .hero h1, .hero h2, .hero p, .hero a", {
        opacity: 0,
        y: 30,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.5 // Wait for preloader a bit
    });

    // Reveal 3D Elements/Floating cards
    gsap.from(".main-img, .float-card", {
        opacity: 0,
        scale: 0.8,
        duration: 1.5,
        stagger: 0.2,
        ease: "elastic.out(1, 0.5)",
        delay: 1
    });
});

/* --- 3D TILT EFFECT FOR CARDS --- */
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max rotation 10deg
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
    });
});

/* --- MAGNETIC BUTTONS --- */
document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });

    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
    });
});

/* --- SOUND FX SYSTEM (Web Audio API) --- */
// Created lazily on the first real user gesture: building it at page load
// trips the browser autoplay policy and logs a console warning every visit.
let audioCtx = null;

function getAudioCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!audioCtx) audioCtx = new Ctx();
    return audioCtx;
}

function playSound(type) {
    if (prefersReducedMotion) return; // respect the OS-level preference
    const audioCtx = getAudioCtx();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'hover') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); // Lower volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime); // Lower volume
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    }
}

// Click feedback only. Hover sounds previously fired on every link, button and
// tech badge (~100 elements), which made simply moving the mouse noisy.
document.querySelectorAll('.btn, .project-card, .social-btn, .filter-btn, .theme-btn')
    .forEach(el => el.addEventListener('click', () => playSound('click')));

// Keep the hover chirp for the few large, deliberate targets
document.querySelectorAll('.btn-primary, .project-card')
    .forEach(el => el.addEventListener('mouseenter', () => playSound('hover')));



/* --- BACK TO TOP LOGIC --- */
const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        backToTopBtn.classList.toggle('active', window.scrollY > 500);
    }, { passive: true });

    backToTopBtn.addEventListener('click', () => {
        // Go through Lenis so it matches the site's smooth scrolling
        if (typeof lenis !== 'undefined' && lenis) {
            lenis.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Keyboard support (it is a div, not a button)
    backToTopBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            backToTopBtn.click();
        }
    });
}

/* --- PROJECT FILTERING --- */
const filterBtns = document.querySelectorAll('.filter-btn');
const filterCount = document.querySelector('.filter-count');

if (filterBtns.length > 0) {
    const cards = Array.from(document.querySelectorAll('.project-card'));
    const noResults = document.querySelector('.no-results');
    const tiers = Array.from(document.querySelectorAll('.project-grid'));

    const applyFilter = (filter) => {
        let shown = 0;
        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.domain === filter;
            card.classList.toggle('is-hidden', !match);
            if (match) shown++;
        });

        // Hide a tier (and its heading) when the filter empties it, so the page
        // never shows "Featured" above nothing.
        tiers.forEach(grid => {
            const anyVisible = Array.from(grid.children)
                .some(c => !c.classList.contains('is-hidden'));
            grid.classList.toggle('is-hidden', !anyVisible);
            const heading = grid.previousElementSibling;
            if (heading && heading.classList.contains('tier-label')) {
                heading.classList.toggle('is-hidden', !anyVisible);
            }
        });

        filterBtns.forEach(b => {
            const on = b.dataset.filter === filter;
            b.classList.toggle('active', on);
            b.setAttribute('aria-pressed', String(on));
        });

        if (filterCount) {
            filterCount.textContent = shown === cards.length
                ? `${cards.length} projects`
                : `${shown} of ${cards.length} projects`;
        }
        if (noResults) noResults.hidden = shown > 0;

        // Cards appearing and disappearing moves everything below them
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.dataset.filter);
            playSound('click');
        });
    });

    const reset = document.querySelector('[data-filter-reset]');
    if (reset) reset.addEventListener('click', () => applyFilter('all'));

    applyFilter('all');
}

/* --- LIVE GITHUB ACTIVITY --- */
const ghRepos = document.getElementById('gh-repos');

if (ghRepos) {
    const GH_USER = 'Tanvir284';
    const CACHE_KEY = 'gh-cache-v2';
    const CACHE_TTL = 60 * 60 * 1000; // the API allows 60 calls/hr unauthenticated

    const esc = (str) => String(str).replace(/[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const setStat = (key, value) => {
        const el = document.querySelector(`[data-gh="${key}"]`);
        if (el) el.textContent = value;
    };

    function timeAgo(iso) {
        const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
        if (days <= 0) return 'today';
        if (days === 1) return 'yesterday';
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
        const years = Math.floor(months / 12);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }

    const render = (user, repos, live) => {
        const skip = new Set(['portfolio', GH_USER.toLowerCase()]);
        const own = repos
            .filter(r => !r.fork && !skip.has(r.name.toLowerCase()))
            .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
            .slice(0, 6);

        const stars = repos.reduce((n, r) => n + (r.stargazers_count || 0), 0);
        const langs = new Set(repos.map(r => r.language).filter(Boolean));

        setStat('repos', (user && user.public_repos) || repos.length);
        setStat('stars', stars);
        setStat('followers', (user && user.followers != null) ? user.followers : '—');
        setStat('languages', langs.size);

        ghRepos.innerHTML = own.map(r => `
            <a class="gh-card" href="${esc(r.html_url)}" target="_blank" rel="noopener noreferrer">
                <span class="gh-name"><i class="fas fa-code-branch" aria-hidden="true"></i> ${esc(r.name)}</span>
                <span class="gh-desc">${esc(r.description || 'No description provided.')}</span>
                <span class="gh-meta">
                    ${r.language ? `<span class="gh-lang">${esc(r.language)}</span>` : ''}
                    ${r.stargazers_count ? `<span><i class="fas fa-star" aria-hidden="true"></i> ${r.stargazers_count}</span>` : ''}
                    <span class="gh-when">updated ${timeAgo(r.pushed_at)}</span>
                </span>
            </a>`).join('');

        const note = document.querySelector('.gh-note');
        if (note) note.textContent = live ? '' : 'Showing a saved snapshot — the GitHub API is unreachable right now.';
    };

    // Committed snapshot, so the section always has real content to show even
    // when the API is rate-limited, blocked, or the visitor is offline.
    const useSnapshot = () => fetch('repos.json?v=2')   // versioned: a cached copy
        .then(r => r.json())                            // of the older shape broke this
        .then(d => {
            // Tolerate both the current {user, repos} shape and the bare array
            // the file used to hold, so a stale cached copy still renders.
            const repos = Array.isArray(d) ? d : (d && d.repos);
            if (!Array.isArray(repos)) throw new Error('snapshot has no repo list');
            const user = Array.isArray(d) ? null : (d && d.user);
            render(user, repos.map(r => ({
                name: r.name,
                description: r.description,
                html_url: r.html_url,
                language: r.language || (Array.isArray(r.languages) ? r.languages[0] : null),
                stargazers_count: r.stargazers_count || 0,
                fork: !!r.fork,
                pushed_at: r.pushed_at || new Date().toISOString()
            })), false);
        })
        .catch((err) => {
            console.error('Repository snapshot failed to render:', err);
            ghRepos.innerHTML =
                '<p class="gh-loading">Could not load repositories. ' +
                '<a href="https://github.com/Tanvir284" target="_blank" rel="noopener noreferrer">' +
                'Browse them on GitHub</a>.</p>';
        });

    let cached = null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        const obj = raw && JSON.parse(raw);
        if (obj && Date.now() - obj.at < CACHE_TTL) cached = obj;
    } catch (e) { /* private mode */ }

    if (cached) {
        render(cached.user, cached.repos, true);
    } else {
        // Wrapped in try/catch: a blocked host can make fetch throw outright,
        // which would otherwise kill the rest of this file.
        try {
            Promise.all([
                fetch(`https://api.github.com/users/${GH_USER}`).then(r => r.ok ? r.json() : null),
                fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`)
                    .then(r => r.ok ? r.json() : Promise.reject(new Error('repos ' + r.status)))
            ])
                .then(([user, repos]) => {
                    if (!Array.isArray(repos)) throw new Error('unexpected payload');
                    render(user, repos, true);
                    try {
                        localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), user, repos }));
                    } catch (e) { /* quota or private mode */ }
                })
                .catch(err => {
                    console.warn('GitHub API unavailable, using snapshot:', err);
                    useSnapshot();
                });
        } catch (err) {
            console.warn('GitHub API call threw, using snapshot:', err);
            useSnapshot();
        }
    }
}

/* --- CONTACT FORM HANDLING --- */
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic Validation -- only the visible, user-facing fields.
        // FormSubmit's config inputs (_captcha/_template/_subject) and the
        // _honey honeypot must be excluded: the honeypot is empty by design,
        // so including it made every submission fail silently.
        const fields = contactForm.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        fields.forEach(field => {
            if (!field.value.trim()) isValid = false;
        });

        if (!isValid) return; // Prevent if bypassed HTML required attrs

        const btn = contactForm.querySelector('button');
        const originalText = btn.innerHTML;

        // Clear any previous failure message
        if (formStatus) {
            formStatus.hidden = true;
            formStatus.textContent = '';
            formStatus.classList.remove('error');
        }

        // Visual Feedback (Loading)
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';
        btn.style.opacity = '0.7';

        // FormSubmit.co Logic using Fetch
        const formData = new FormData(contactForm);

        fetch("https://formsubmit.co/ajax/ruhittanvir14@gmail.com", {
            method: "POST",
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                // FormSubmit reports its own outcome in the payload
                if (data && String(data.success) === 'false') {
                    throw new Error(data.message || 'Submission rejected');
                }
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                contactForm.reset();
                if (successModal) {
                    successModal.classList.add('active');
                }
            })
            .catch(error => {
                // Tell the visitor the truth: the message did not go through.
                console.error('Contact form submission failed:', error);
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                if (formStatus) {
                    formStatus.textContent = 'Transmission failed. Please email ruhittanvir14@gmail.com directly.';
                    formStatus.classList.add('error');
                    formStatus.hidden = false;
                }
            });
    });
}

function closeModal() {
    if (successModal) {
        successModal.classList.remove('active');
    }
}

/* --- THEME SWITCHER LOGIC --- */
const themes = {
    cyan: { primary: '#00f3ff', secondary: '#b000ff', glow: 'rgba(0, 243, 255, 0.4)' },
    emerald: { primary: '#00ff9d', secondary: '#00b8ff', glow: 'rgba(0, 255, 157, 0.4)' },
    crimson: { primary: '#ff0055', secondary: '#ff9d00', glow: 'rgba(255, 0, 85, 0.4)' }
};

const themeBtns = document.querySelectorAll('.theme-btn');

function applyAccent(name) {
    const theme = themes[name];
    if (!theme) return;

    themeBtns.forEach(b => {
        const isActive = b.getAttribute('data-theme') === name;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
    });

    document.documentElement.style.setProperty('--primary', theme.primary);
    document.documentElement.style.setProperty('--secondary', theme.secondary);
    document.documentElement.style.setProperty('--glow', `0 0 20px ${theme.glow}`);

    // Update Three.js Particles
    if (particlesMesh && particlesMesh.material) {
        particlesMesh.material.color.set(theme.primary);
    }
}

themeBtns.forEach(btn => {
    const activate = () => {
        const name = btn.getAttribute('data-theme');
        applyAccent(name);
        storage.set('accent', name);
        playSound('click');
    };

    btn.addEventListener('click', activate);
    // The swatches are divs, so give them keyboard activation too
    btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate();
        }
    });
});

// Restore the visitor's saved accent
const savedAccent = storage.get('accent');
if (savedAccent && themes[savedAccent]) applyAccent(savedAccent);


/* --- FOOTER YEAR --- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* --- PRELOADER LOGIC --- */
const startPreloader = () => {
    const preloader = document.getElementById('preloader');
    const percentageElement = document.querySelector('.loader-progress');
    let percentage = 0;

    if (!preloader || !percentageElement) return;

    // Disable scrolling while loading
    document.body.style.overflow = 'hidden';

    // Simulate loading
    const loadInterval = setInterval(() => {
        percentage += Math.floor(Math.random() * 5) + 1; // Random increment

        if (percentage > 100) percentage = 100;

        percentageElement.innerText = percentage;

        if (percentage === 100) {
            clearInterval(loadInterval);

            // Wait a bit at 100% then slide out
            setTimeout(() => {
                preloader.classList.add('loaded');
                document.body.style.overflow = ''; // Re-enable scrolling
            }, 800);
        }
    }, 50); // Speed of loading
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startPreloader();
} else {
    window.addEventListener('load', startPreloader);
}

/* --- PROJECT MODALS --- */
const modalOverlay = document.getElementById('project-modal');
const modalCloseBtn = document.getElementById('close-modal');
const projectCards = document.querySelectorAll('.project-card');

if (modalOverlay && projectCards.length > 0) {
    const mVisual = document.getElementById('modal-visual');
    const mCat = document.getElementById('modal-cat');
    const mTitle = document.getElementById('modal-title');
    const mDesc = document.getElementById('modal-desc');
    const mTags = document.getElementById('modal-tags');
    const mLink = document.getElementById('modal-link');

    projectCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Prevent opening modal if clicking the original link
            if (e.target.closest('a')) return;

            // Extract data from the card
            let visual = '';
            const imgEl = card.querySelector('.glitch-wrap img');
            if (imgEl) {
                visual = `url('${imgEl.src}')`;
            } else {
                const visualEl = card.querySelector('.project-visual');
                if (visualEl) visual = visualEl.style.background;
            }

            const pick = (sel) => {
                const el = card.querySelector(sel);
                return el ? el.innerHTML : '';
            };
            const cat = pick('.p-cat');
            const title = pick('.p-title');
            const desc = pick('.p-desc');
            const tags = pick('.p-tags');
            const linkTag = card.querySelector('.p-link');
            const link = linkTag ? linkTag.getAttribute('href') : null;

            // Populate modal content
            if (mVisual) mVisual.style.background = visual;
            if (mCat) mCat.innerHTML = cat;
            if (mTitle) mTitle.innerHTML = title;
            if (mDesc) mDesc.innerHTML = desc;
            if (mTags) mTags.innerHTML = tags;
            if (mLink) {
                if (link) {
                    mLink.setAttribute('href', link);
                    mLink.style.display = 'inline-block';
                } else {
                    mLink.style.display = 'none';
                }
            }

            // Open modal
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore background scrolling
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeModal();
    });
}
