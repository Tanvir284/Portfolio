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
        if (typeof syncThreeColors === 'function') syncThreeColors();
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
let scene, camera, renderer, particlesMesh, coreMesh;

function syncThreeColors() {
    const rootStyle = getComputedStyle(document.documentElement);
    const primary = rootStyle.getPropertyValue('--primary').trim();
    const secondary = rootStyle.getPropertyValue('--secondary').trim();
    if (particlesMesh && particlesMesh.material && primary) {
        particlesMesh.material.color.set(primary);
    }
    if (coreMesh && coreMesh.material && (secondary || primary)) {
        coreMesh.material.color.set(secondary || primary);
    }
}

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
        size: 0.045,
        color: 0x6384ff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending
    });

    particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // Inner Neural Lattice Core (counter-rotating wireframe geodesic sphere)
    const coreGeo = new THREE.IcosahedronGeometry(5.2, 2);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xa78bfa,
        wireframe: true,
        transparent: true,
        opacity: 0.1
    });
    coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    syncThreeColors();

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

    if (coreMesh) {
        coreMesh.rotation.y = -elapsedTime * 0.07;
        coreMesh.rotation.x = elapsedTime * 0.04;
    }

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



/* --- TENSORFLOW.JS LIVE AI DEMO (COCO-SSD) --- */
const startCamBtn = document.getElementById('start-cam-btn');
const stopCamBtn = document.getElementById('stop-cam-btn');
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
    if (model) {
        startCamBtn.style.display = 'none';
        startWebcam();
        return;
    }
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
            if (stopCamBtn) stopCamBtn.hidden = false;
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
    if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (fpsCounter) fpsCounter.innerText = '0';
    if (stopCamBtn) stopCamBtn.hidden = true;
    if (startCamBtn && !startCamBtn.disabled) startCamBtn.style.display = '';
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
if (stopCamBtn) {
    stopCamBtn.addEventListener('click', stopWebcam);
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
    { role: 'system', content: "You are T.A.N.V.I.R., an elite AI assistant integrated into Md Tanvir Islam's portfolio. You are intelligent, professional, and slightly futuristic. Tanvir is an AI Architect and Software Engineer (B.Sc. CSE graduate from BUBT, CGPA 3.36/4.00) proficient in Deep Learning, Computer Vision, and Full-Stack development. His 18 shipped projects include MangoCare AI (DenseNet-121 + Flask + Docker), Breast Lesion AI (U-Net + ResNet-50, 91% Dice), Pneumonia Classification (YOLOv8, 95%+ accuracy), DSA House (Next.js 16 + React 19), and Ecommerce Admin Dashboard (NestJS + PostgreSQL). Keep your answers concise, helpful, and tailored to a portfolio visitor." }
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
    // ai-ui.js takes over once the sentence-transformer is wired up; without
    // this both handlers answer and every question gets two replies.
    if (window.__aiAssistantActive) return;
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
                response: "I am T.A.N.V.I.R., an artificial intelligence designed by Md Tanvir Islam to guide you through his portfolio and technical work."
            },
            {
                intents: ["skills", "tech", "stack", "languages", "proficient", "know", "tools", "frameworks", "technologies"],
                points: 5,
                response: "Tanvir works across 57 tools and technologies: PyTorch, TensorFlow, Scikit-learn, Hugging Face, YOLOv8, OpenCV, XGBoost/LightGBM/CatBoost, Python, TypeScript, C++, C#, React, Next.js, NestJS, Django, Flask, FastAPI, PostgreSQL, and Docker."
            },
            {
                intents: ["experience", "background", "work", "job", "career", "history", "research"],
                points: 5,
                response: "Tanvir served as a Research Assistant at InsightEdu (Jan–Feb 2026) working across ML, DL, NLP, and Transformer baselines, alongside extensive deep learning research in medical imaging and full-stack engineering."
            },
            {
                intents: ["education", "school", "degree", "university", "study", "college", "cgpa", "graduated"],
                points: 5,
                response: "Tanvir graduated with a B.Sc. in Computer Science & Engineering from Bangladesh University of Business and Technology (BUBT) in January 2026 with a CGPA of 3.36 / 4.00, plus professional certificates from Google and IBM."
            },
            {
                intents: ["hire", "job", "recruiting", "opportunity", "contact", "email", "reach", "message"],
                points: 5,
                response: "You can reach Tanvir directly via the Contact section below or at ruhittanvir14@gmail.com (+8801828077520). He is available for AI/ML, Software Engineering, and Data Analytics roles."
            },
            {
                intents: ["projects", "portfolio", "built", "made", "created", "showcase", "work", "website"],
                points: 6, // Highest priority: "Can you build a website?"
                response: "Tanvir has shipped 18 projects, including MangoCare AI (DenseNet-121 + Flask + Docker), Breast Lesion Segmentation (91% Dice with U-Net + ResNet-50), Pneumonia Classification (YOLOv8, 95%+ accuracy), DSA House (Next.js 16 + React 19), and an Ecommerce Admin Dashboard (NestJS + PostgreSQL)."
            },
            {
                intents: ["thank", "thanks", "appreciate", "cool", "awesome", "amazing", "great", "nice"],
                points: 2,
                response: "You are very welcome. I will relay your positive feedback to my creator."
            },
            {
                intents: ["how", "does", "this", "model", "camera", "webcam", "neural", "net", "vision", "detect", "track"],
                points: 5,
                response: "The live vision demo runs COCO-SSD via TensorFlow.js and MobileViT via Transformers.js directly inside your browser using WebGL. No image data ever leaves your device."
            },
            {
                intents: ["what", "is", "ai", "artificial", "intelligence"],
                points: 5,
                response: "Artificial Intelligence is the engineering of systems that learn, reason, and perceive. Tanvir specializes in bridging deep learning research (Computer Vision, Medical Imaging, NLP) with production web software."
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

// Fade Up Sections and Elements (transform only so elements never get stuck at opacity: 0)
gsap.utils.toArray('.section-header').forEach(header => {
    gsap.from(header, {
        y: 28,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: {
            trigger: header,
            start: "top 92%",
            once: true
        }
    });
});

// Staggered Cards (About, Research Domains, Work)
gsap.utils.toArray(['.about-cards', '.project-grid', '.cred-grid']).forEach(container => {
    const children = Array.from(container.children);
    if (!children.length) return;
    gsap.from(children, {
        y: 24,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        clearProps: "transform",
        scrollTrigger: {
            trigger: container,
            start: "top 92%",
            once: true
        }
    });
});

// Timeline Items GSAP reveal
gsap.utils.toArray('.timeline-item').forEach(item => {
    gsap.from(item, {
        x: -24,
        duration: 0.6,
        ease: "power3.out",
        clearProps: "transform",
        scrollTrigger: {
            trigger: item,
            start: "top 92%",
            once: true
        }
    });
});

window.addEventListener('load', () => ScrollTrigger.refresh());
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

/* --- 3D TILT & BENTO SPOTLIGHT FOR CARDS --- */
document.querySelectorAll('.project-card, .a-card, .cred-card, .stat-cell, .gh-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        if (!prefersReducedMotion && card.classList.contains('project-card')) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        }
    });

    card.addEventListener('mouseleave', () => {
        if (card.classList.contains('project-card')) {
            card.style.transform = '';
        }
    });
});

if (!prefersReducedMotion) {

    /* --- MAGNETIC BUTTONS --- */
    document.querySelectorAll('[data-magnetic]').forEach(btn => {
        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

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
// Note: .filter-btn and .theme-btn trigger playSound('click') in their own handlers.
document.querySelectorAll('.btn, .project-card, .social-btn')
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

/* --- COUNT-UP STATISTICS --- */
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

/* --- CLEAN EDITORIAL SUBTITLES & GRAPHICAL PROJECT PREVIEWS --- */
document.querySelectorAll('.section-header p:not(.eyebrow)').forEach(p => {
    p.textContent = p.textContent.replace(/^\s*\/\/\s*/, '');
});

const PREVIEW_SVGS = {
    ai: `<svg class="p-preview-svg" viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="160" cy="70" r="46" stroke="currentColor" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="4 4"/>
        <circle cx="160" cy="70" r="28" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/>
        <path d="M40 95 C90 45, 130 95, 160 70 C190 45, 230 95, 280 50" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.8" stroke-linecap="round"/>
        <line x1="70" y1="35" x2="132" y2="58" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
        <line x1="250" y1="38" x2="188" y2="58" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>
        <circle cx="70" cy="35" r="3.5" fill="currentColor" fill-opacity="0.6"/>
        <circle cx="250" cy="38" r="3.5" fill="currentColor" fill-opacity="0.6"/>
        <circle cx="160" cy="70" r="4.5" fill="currentColor"/>
    </svg>`,
    web: `<svg class="p-preview-svg" viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="34" y="28" width="70" height="84" rx="8" stroke="currentColor" stroke-opacity="0.26" stroke-width="1.2" fill="currentColor" fill-opacity="0.04"/>
        <rect x="114" y="28" width="172" height="38" rx="8" stroke="currentColor" stroke-opacity="0.32" stroke-width="1.2" fill="currentColor" fill-opacity="0.06"/>
        <rect x="114" y="74" width="82" height="38" rx="8" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2"/>
        <rect x="204" y="74" width="82" height="38" rx="8" stroke="currentColor" stroke-opacity="0.22" stroke-width="1.2"/>
        <path d="M128 54 L158 42 L192 49 L232 36 L268 44" stroke="currentColor" stroke-opacity="0.65" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
    ml: `<svg class="p-preview-svg" viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="44" y1="108" x2="276" y2="108" stroke="currentColor" stroke-opacity="0.2" stroke-width="1"/>
        <path d="M48 102 Q115 92, 165 62 T272 28" stroke="currentColor" stroke-opacity="0.65" stroke-width="2" stroke-linecap="round"/>
        <circle cx="82" cy="92" r="3.5" fill="currentColor" fill-opacity="0.5"/>
        <circle cx="128" cy="74" r="4" fill="currentColor" fill-opacity="0.7"/>
        <circle cx="174" cy="58" r="4" fill="currentColor" fill-opacity="0.85"/>
        <circle cx="222" cy="40" r="4.5" fill="currentColor"/>
        <rect x="64" y="88" width="14" height="20" rx="3" fill="currentColor" fill-opacity="0.14"/>
        <rect x="110" y="70" width="14" height="38" rx="3" fill="currentColor" fill-opacity="0.18"/>
        <rect x="156" y="54" width="14" height="54" rx="3" fill="currentColor" fill-opacity="0.22"/>
        <rect x="204" y="38" width="14" height="70" rx="3" fill="currentColor" fill-opacity="0.28"/>
    </svg>`,
    mobile: `<svg class="p-preview-svg" viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="122" y="14" width="76" height="112" rx="14" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.5" fill="currentColor" fill-opacity="0.05"/>
        <line x1="148" y1="24" x2="172" y2="24" stroke="currentColor" stroke-opacity="0.4" stroke-width="2" stroke-linecap="round"/>
        <rect x="132" y="34" width="56" height="32" rx="6" fill="currentColor" fill-opacity="0.16"/>
        <rect x="132" y="72" width="26" height="26" rx="5" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
        <rect x="162" y="72" width="26" height="26" rx="5" stroke="currentColor" stroke-opacity="0.3" stroke-width="1"/>
    </svg>`,
    systems: `<svg class="p-preview-svg" viewBox="0 0 320 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="160,22 222,56 160,90 98,56" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" fill="currentColor" fill-opacity="0.06"/>
        <polygon points="160,46 222,80 160,114 98,80" stroke="currentColor" stroke-opacity="0.28" stroke-width="1.2"/>
        <line x1="98" y1="56" x2="98" y2="80" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/>
        <line x1="222" y1="56" x2="222" y2="80" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/>
        <line x1="160" y1="90" x2="160" y2="114" stroke="currentColor" stroke-opacity="0.35" stroke-width="1.2"/>
    </svg>`
};

const DOMAIN_ICONS = {
    ai: 'fas fa-brain',
    web: 'fas fa-layer-group',
    ml: 'fas fa-chart-line',
    mobile: 'fas fa-mobile-screen',
    systems: 'fas fa-cube'
};

document.querySelectorAll('.project-card').forEach(card => {
    if (card.querySelector('.p-preview')) return;
    const domain = card.dataset.domain || 'ai';
    const hasLive = Boolean(card.querySelector('.p-link-live'));
    const firstMetricVal = card.querySelector('.p-metrics .m-val')?.textContent?.trim();
    const firstMetricKey = card.querySelector('.p-metrics .m-key')?.textContent?.trim();
    const firstTag = card.querySelector('.p-tags span')?.textContent?.trim() || 'Architecture';
    const secTag = card.querySelectorAll('.p-tags span')[1]?.textContent?.trim();

    const metricLabel = firstMetricVal
        ? `${firstMetricVal} ${firstMetricKey || ''}`.trim()
        : (secTag ? `${firstTag} · ${secTag}` : firstTag);

    const badgeText = hasLive ? 'LIVE DEPLOYMENT' : firstTag.toUpperCase();
    const iconCls = DOMAIN_ICONS[domain] || 'fas fa-cube';
    const svgArt = PREVIEW_SVGS[domain] || PREVIEW_SVGS.ai;

    const preview = document.createElement('div');
    preview.className = 'p-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = `
        <div class="p-preview-top">
            <div class="p-preview-dots"><span></span><span></span><span></span></div>
            <span class="p-preview-badge ${hasLive ? 'is-live' : ''}">${badgeText}</span>
        </div>
        <div class="p-preview-art" style="color: var(--dc, var(--primary))">${svgArt}</div>
        <div class="p-preview-center">
            <div class="p-preview-orb"><i class="${iconCls}"></i></div>
            <span class="p-preview-metric">${metricLabel}</span>
        </div>
    `;
    card.prepend(preview);
});

/* --- PROJECT FILTERING --- */
const filterBtns = document.querySelectorAll('.filter-btn');
const filterCount = document.querySelector('.filter-count');

if (filterBtns.length > 0) {
    const cards = Array.from(document.querySelectorAll('.project-card'));
    const grid = document.querySelector('.project-grid');
    const noResults = document.querySelector('.no-results');

    const applyFilter = (filter) => {
        let shown = 0;
        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.domain === filter;
            card.classList.toggle('is-hidden', !match);
            if (match) shown++;
        });
        if (grid) grid.classList.toggle('is-filtered', filter !== 'all');

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

        // Cards leaving the flow moves everything below them
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.dataset.filter);
            playSound('click');
        });
    });

    // Semantic search (ai-ui.js) needs to restore the active filter after it
    // clears its own ranking, rather than simply un-hiding every card.
    window.__applyProjectFilter = applyFilter;
    window.__activeProjectFilter = () =>
        (document.querySelector('.filter-btn.active') || {}).dataset?.filter || 'all';

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
    cyan: { primary: '#6384ff', secondary: '#a78bfa', glow: 'rgba(99, 132, 255, 0.34)' },
    emerald: { primary: '#e5a93c', secondary: '#f59e0b', glow: 'rgba(229, 169, 60, 0.32)' },
    crimson: { primary: '#f43f5e', secondary: '#c084fc', glow: 'rgba(244, 63, 94, 0.32)' }
};

const themeBtns = document.querySelectorAll('.theme-btn');

function applyAccent(name) {
    if (!themes[name]) return;

    themeBtns.forEach(b => {
        const isActive = b.getAttribute('data-theme') === name;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', String(isActive));
    });

    // Set an attribute rather than inline custom properties: inline values beat
    // :root.light-mode, which left the neon dark accent on the light theme.
    document.documentElement.setAttribute('data-accent', name);

    // The particle field and neural core are canvas, so they need resolved values
    syncThreeColors();
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
/* Runs once per visit. The head script has already added .preloader-skip when
   this session has seen it, so a return to the home page from a sub-page has
   no splash and, more importantly, no flash of one. */
const startPreloader = () => {
    const preloader = document.getElementById('preloader');
    const percentageElement = document.querySelector('.loader-progress');
    let percentage = 0;

    if (!preloader || !percentageElement) return;

    if (document.documentElement.classList.contains('preloader-skip')) {
        preloader.remove();
        document.body.style.overflow = '';
        return;
    }

    try { sessionStorage.setItem('seen-intro', '1'); } catch (e) { /* private mode */ }

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
    const mMetrics = document.getElementById('modal-metrics');
    const mTags = document.getElementById('modal-tags');
    const mActions = document.getElementById('modal-actions');

    const DOMAIN_LABEL = {
        ai: 'AI & DEEP LEARNING',
        ml: 'MACHINE LEARNING',
        web: 'FULL-STACK SYSTEM',
        mobile: 'MOBILE APPLICATION',
        systems: 'SYSTEMS & GRAPHICS'
    };

    projectCards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
            // Prevent opening modal if clicking an action link directly
            if (e.target.closest('a')) return;

            const pick = (sel) => {
                const el = card.querySelector(sel);
                return el ? el.innerHTML : '';
            };
            const cat = pick('.p-cat');
            const title = pick('.p-title');
            const desc = pick('.p-desc');
            const metrics = pick('.p-metrics');
            const tags = pick('.p-tags');
            const watermark = card.querySelector('.p-watermark');
            const domain = card.dataset.domain || 'ai';
            const dcStyle = card.getAttribute('style') || '';

            const modalContent = modalOverlay.querySelector('.project-modal-content');
            if (modalContent) modalContent.setAttribute('style', dcStyle);

            if (mVisual) {
                const imgEl = card.querySelector('.glitch-wrap img');
                if (imgEl) {
                    mVisual.style.backgroundImage = `url('${imgEl.src}')`;
                    mVisual.innerHTML = '';
                } else {
                    mVisual.style.backgroundImage = '';
                    const iconClass = watermark ? watermark.className.replace('p-watermark', '').trim() : 'fas fa-cube';
                    mVisual.innerHTML = `
                        <div class="modal-emblem">
                            <div class="modal-emblem-ring">
                                <i class="${iconClass}" aria-hidden="true"></i>
                            </div>
                            <span class="modal-emblem-domain">${DOMAIN_LABEL[domain] || 'PROJECT'}</span>
                        </div>
                    `;
                }
            }

            if (mCat) mCat.innerHTML = cat;
            if (mTitle) mTitle.innerHTML = title;
            if (mDesc) mDesc.innerHTML = desc;
            if (mMetrics) {
                mMetrics.innerHTML = metrics;
                mMetrics.hidden = !metrics;
            }
            if (mTags) mTags.innerHTML = tags;

            if (mActions) {
                const links = Array.from(card.querySelectorAll('.p-actions a'));
                mActions.innerHTML = links.map(a => {
                    const isLive = a.classList.contains('p-link-live');
                    const href = a.getAttribute('href') || '#';
                    return isLive
                        ? `<a href="${href}" target="_blank" rel="noopener noreferrer" class="modal-btn btn btn-outline">LIVE DEMO <i class="fas fa-arrow-up-right-from-square" style="margin-left: 8px;" aria-hidden="true"></i></a>`
                        : `<a href="${href}" target="_blank" rel="noopener noreferrer" class="modal-btn btn btn-primary">VIEW SOURCE <i class="fas fa-arrow-right" style="margin-left: 8px;" aria-hidden="true"></i></a>`;
                }).join('');
            }

            // Open modal & pause smooth scroll
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (typeof lenis !== 'undefined' && lenis) lenis.stop();
        });
    });

    const closeProjectModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (typeof lenis !== 'undefined' && lenis) lenis.start();
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeProjectModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) closeProjectModal();
    });
}
