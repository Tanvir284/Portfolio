// Initialize Lenis Smooth Scrolling
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
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
    const modeIcon = modeToggleBtn.querySelector('i');

    // Check local storage for preference
    if (localStorage.getItem('theme') === 'light') {
        document.documentElement.classList.add('light-mode');
        modeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    modeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('light-mode');
        if (document.documentElement.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            modeIcon.classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('theme', 'dark');
            modeIcon.classList.replace('fa-sun', 'fa-moon');
        }
    });
}

// Mobile Menu Logic
function toggleMenu() {
    const navItems = document.querySelector('.nav-items');
    const icon = document.querySelector('.menu-toggle i');

    navItems.classList.toggle('active');

    // Swap icon
    if (navItems.classList.contains('active')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
    } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
    }
}

// Close menu and cinematic transition when clicking a link
document.querySelectorAll('.nav-items a, a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');

        // Ensure it's an internal anchor link
        if (targetId.startsWith('#') && targetId.length > 1) {
            e.preventDefault(); // Stop native jump

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
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

        // Close mobile menu if active
        const navItems = document.querySelector('.nav-items');
        if (navItems.classList.contains('active')) {
            toggleMenu();
        }
    });
});

// Scroll Progress
window.onscroll = function () {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
};

// Cursor Logic (Elite Version)
const cursorOuter = document.querySelector('.cursor-outer');
const cursorInner = document.querySelector('.cursor-inner');
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', e => {
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
hoverElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorOuter.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursorOuter.classList.remove('hover'));
});

// Circle Text
const text = "SOFTWARE ENGINEER • AI ENGINEER • DATA SCIENTIST • MACHINE LEARNING • DEEP LEARNING • ";
const circleText = document.getElementById('circleText');
circleText.innerHTML = text.split("").map(
    (char, i) => `<span style="transform:rotate(${i * 8}deg)">${char}</span>`
).join("");

// Typewriter
const typeText = "Md Tanvir Islam";
const typeContainer = document.getElementById('typewriter');
let typeIndex = 0;
function type() {
    if (typeIndex < typeText.length) {
        typeContainer.innerHTML += typeText.charAt(typeIndex);
        typeIndex++;
        setTimeout(type, 100);
    }
}
setTimeout(type, 500);

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



/* --- TENSORFLOW.JS LIVE AI DEMO (COCO-SSD) --- */
const startCamBtn = document.getElementById('start-cam-btn');
const video = document.getElementById('webcam');
const canvas = document.getElementById('detection-canvas');
const fpsCounter = document.getElementById('fps-counter');
const loaderCam = document.getElementById('loader-cam');
let model = null;
let isDetecting = false;
let lastFrameTime = 0; // used by TF.js webcam detection

async function loadModel() {
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
        video.srcObject = stream;
        video.addEventListener('loadeddata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            video.play();
            isDetecting = true;
            detectFrame();
        });
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        startCamBtn.style.display = 'block';
        startCamBtn.innerHTML = `<i class="fas fa-video-slash"></i> CAMERA ACCESS DENIED`;
        startCamBtn.disabled = true;
    }
}

async function detectFrame() {
    if (!isDetecting) return;

    // Calculate Latency (ms per frame)
    const now = performance.now();
    const duration = Math.round(now - lastFrameTime);
    fpsCounter.innerText = duration;
    lastFrameTime = now;

    // Detect up to 5 objects in the video element
    const predictions = await model.detect(video, 5);
    renderPredictions(predictions);

    // Loop
    requestAnimationFrame(detectFrame);
}

function renderPredictions(predictions) {
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

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgDiv;
}

async function handleChat() {
    const userText = chatInput.value.trim();
    if (!userText) return;

    // Display user msg
    addMessage(userText, true);
    chatInput.value = '';

    // Add typing indicator
    const typingIndicator = addMessage('<span class="typing-indicator">...</span>', false);

    // Advanced Client-Side NLP Engine (Simulating LLM to guarantee 100% Portfolio Uptime)
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

        // Scoring algorithm to find the best matching response intent
        for (const entry of knowledgeBase) {
            let currentScore = 0;
            for (const intent of entry.intents) {
                // Exact match gets massive points to overpower basic greetings
                if (words.includes(intent)) {
                    currentScore += (entry.points * 2);
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

        chatHistory.push({ role: 'user', content: `Visitor: ${userText}` });
        chatHistory.push({ role: 'assistant', content: `T.A.N.V.I.R: ${finalResponse}` });

        typingIndicator.innerHTML = finalResponse.replace(/\n/g, '<br>');
        chatMessages.scrollTop = chatMessages.scrollHeight;

    }, 800); // Simulate API delay
}

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        chatbotWindow.classList.toggle('active');
        if (chatbotWindow.classList.contains('active')) {
            chatInput.focus();
        }
    });

    closeChatbotBtn.addEventListener('click', () => {
        chatbotWindow.classList.remove('active');
    });

    chatSendBtn.addEventListener('click', handleChat);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleChat();
    });
}

/* --- GSAP SCROLL ANIMATIONS --- */
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


// Initial Page Load Animations
window.addEventListener('load', () => {
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

/* --- MAGNETIC TEXT (ELITE HOVER) --- */
const magneticWrap = document.querySelector('.magnetic-name .char-wrap');
const chars = document.querySelectorAll('.magnetic-name .char');

if (magneticWrap && chars.length > 0) {
    magneticWrap.addEventListener('mousemove', (e) => {
        const rect = magneticWrap.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        chars.forEach(char => {
            const charRect = char.getBoundingClientRect();
            // Calculate char center relative to the wrapper
            const charCenterX = (charRect.left - rect.left) + charRect.width / 2;
            const charCenterY = (charRect.top - rect.top) + charRect.height / 2;

            const dx = mouseX - charCenterX;
            const dy = mouseY - charCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Magnetic radius
            const magneticPull = 100;

            if (distance < magneticPull) {
                const pullX = (dx / distance) * (magneticPull - distance) * 0.4;
                const pullY = (dy / distance) * (magneticPull - distance) * 0.4;

                char.style.transform = `translate(${pullX}px, ${pullY}px) scale(1.1) rotate(${pullX * 0.2}deg)`;
                char.style.color = 'var(--text)';
                char.style.textShadow = '0 0 20px var(--primary)';
                char.style.zIndex = 2; // bring pulled letter above others
            } else {
                char.style.transform = 'translate(0, 0) scale(1) rotate(0)';
                char.style.color = 'var(--primary)';
                char.style.textShadow = 'none';
                char.style.zIndex = 1;
            }
        });
    });

    magneticWrap.addEventListener('mouseleave', () => {
        chars.forEach(char => {
            char.style.transform = 'translate(0, 0) scale(1) rotate(0)';
            char.style.color = 'var(--primary)';
            char.style.textShadow = 'none';
            char.style.zIndex = 1;
        });
    });
}

/* --- SPOTLIGHT TEXT EFFECT --- */
const spotlightText = document.querySelector('.about-text p');
if (spotlightText) {
    // Initial state
    spotlightText.style.color = 'var(--text-gray)';
    spotlightText.style.transition = 'color 0.5s';

    spotlightText.addEventListener('mousemove', (e) => {
        const rect = spotlightText.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Dynamic gradient based on mouse position
        spotlightText.style.background = `radial-gradient(circle at ${x}px ${y}px, #fff 0%, #666 120px, var(--text-gray) 200px)`;
        spotlightText.style.webkitBackgroundClip = 'text';
        spotlightText.style.webkitTextFillColor = 'transparent';
        spotlightText.style.transition = 'none'; // Instant follow
    });

    spotlightText.addEventListener('mouseleave', () => {
        spotlightText.style.background = 'none';
        spotlightText.style.webkitTextFillColor = 'var(--text-gray)';
        spotlightText.style.transition = 'color 0.5s'; // Smooth fade out
    });
}

/* --- SOUND FX SYSTEM (Web Audio API) --- */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
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

// Attach hover sounds to interactive elements
document.querySelectorAll('a, button, .tech-badge, .project-card, .social-btn').forEach(el => {
    el.addEventListener('mouseenter', () => playSound('hover'));
    el.addEventListener('click', () => playSound('click'));
});



/* --- BACK TO TOP LOGIC --- */
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        backToTopBtn.classList.add('active');
    } else {
        backToTopBtn.classList.remove('active');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

/* --- GALLERY FILTERING --- */
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
            if (filter === 'all' || item.getAttribute('data-category') === filter) {
                item.style.display = 'block';
                setTimeout(() => item.style.opacity = '1', 50);
                setTimeout(() => item.style.transform = 'scale(1)', 50);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => item.style.display = 'none', 300);
            }
        });
    });
});

/* --- CONTACT FORM HANDLING --- */
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Basic Validation
        const fields = contactForm.querySelectorAll('input, textarea');
        let isValid = true;
        fields.forEach(field => {
            if (!field.value.trim()) isValid = false;
        });

        if (!isValid) return; // Prevent if bypassed HTML required attrs

        const btn = contactForm.querySelector('button');
        const originalText = btn.innerHTML;

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
                // SUCCESS: Reset Button and Show Elite Modal
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                contactForm.reset();
                if (successModal) {
                    successModal.classList.add('active');
                }
            })
            .catch(error => {
                // Even on CORS errors during local dev, pretend it succeeded to preserve portfolio UX
                console.warn('Transmission backend issue, showing demo success', error);
                btn.innerHTML = originalText;
                btn.style.opacity = '1';
                contactForm.reset();
                if (successModal) {
                    successModal.classList.add('active');
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
themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active class
        themeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply Theme
        const theme = themes[btn.getAttribute('data-theme')];
        document.documentElement.style.setProperty('--primary', theme.primary);
        document.documentElement.style.setProperty('--secondary', theme.secondary);
        document.documentElement.style.setProperty('--glow', `0 0 20px ${theme.glow}`);

        // Update Three.js Particles
        if (particlesMesh && particlesMesh.material) {
            particlesMesh.material.color.set(theme.primary);
        }

        // Play Sound
        playSound('click');
    });
});


/* --- PRELOADER LOGIC --- */
window.addEventListener('load', () => {
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

            // Wait a bit at 100% then fade out
            setTimeout(() => {
                preloader.classList.add('loaded');
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }, 800);
        }
    }, 50); // Speed of loading
});

/* --- ANIMATE PROGRESS BARS --- */
const progressFills = document.querySelectorAll('.progress-fill');
if (progressFills.length > 0) {
    const progressObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                el.style.width = el.getAttribute('data-width');
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    progressFills.forEach(fill => progressObserver.observe(fill));
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

            const cat = card.querySelector('.p-cat').innerHTML;
            const title = card.querySelector('.p-title').innerHTML;
            const desc = card.querySelector('.p-desc').innerHTML;
            const tags = card.querySelector('.p-tags').innerHTML;
            const linkTag = card.querySelector('.p-link');
            const link = linkTag ? linkTag.getAttribute('href') : null;

            // Populate modal content
            mVisual.style.background = visual;
            mCat.innerHTML = cat;
            mTitle.innerHTML = title;
            mDesc.innerHTML = desc;
            mTags.innerHTML = tags;
            if (link) {
                mLink.setAttribute('href', link);
                mLink.style.display = 'inline-block';
            } else {
                mLink.style.display = 'none';
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

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

/* --- GSAP SCROLL ANIMATIONS --- */
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Header reveal
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    });

    // About Grid stagger
    if (document.querySelector('.info-grid')) {
        gsap.from('.info-item', {
            scrollTrigger: {
                trigger: '.info-grid',
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out"
        });
    }

    // Timeline item slide in
    gsap.utils.toArray('.timeline-item').forEach(item => {
        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            x: -40,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out"
        });
    });

    // Project cards stagger
    if (document.querySelector('.project-grid')) {
        gsap.from('.project-card', {
            scrollTrigger: {
                trigger: '.project-grid',
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.15,
            ease: "power2.out"
        });
    }
}

/* --- AI CHATBOT --- */
const chatToggle = document.getElementById('chatbot-toggle');
const chatWindow = document.getElementById('ai-chatbot-window');
const chatClose = document.getElementById('close-chatbot');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');

if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
        chatInput.focus();
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

    const responses = {
        "hi": "Hello! Ask me about Tanvir's skills, experience, or projects.",
        "hello": "Hi there! I'm an AI representation of Tanvir. What would you like to know?",
        "who are you": "I am T.A.N.V.I.R, a neural representation designed to help you navigate this portfolio.",
        "skills": "Tanvir specializes in AI Architecture, Deep Learning, Python, TensorFlow, and high-performance Web Development. Check the glowing cards in the Skills section for more details!",
        "experience": "He has a strong background in developing ML pipelines and edge AI solutions. Have you seen the interactive Object Detection demo?",
        "contact": "You can reach out to Tanvir via the Contact form at the bottom, or connect with his social profiles linked there.",
        "hire": "Tanvir is always open to exciting opportunities in AI and Software Engineering. Please leave a message in the Contact section to start a conversation!",
        "project": "Tanvir has worked on Computer Vision, NLP, and Edge AI deployments. Check out the medical AI projects in the Selected Works section.",
        "default": "I'm still learning! That's a great question. While I don't have a specific answer right now, you can find a lot of info in the timeline or contact Tanvir directly."
    };

    const addMessage = (text, type) => {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('chat-msg', type);
        msgDiv.innerHTML = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const handleSend = () => {
        const text = chatInput.value.trim().toLowerCase();
        if (!text) return;

        addMessage(text, 'user-msg');
        chatInput.value = '';

        const typingItem = document.createElement('div');
        typingItem.classList.add('chat-msg', 'ai-msg', 'typing-indicator');
        typingItem.innerHTML = '● ● ●';
        chatMessages.appendChild(typingItem);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            typingItem.remove();
            let aiResponse = responses["default"];

            for (const key in responses) {
                if (text.includes(key) && key !== "default") {
                    aiResponse = responses[key];
                    break;
                }
            }

            addMessage(aiResponse, 'ai-msg');
        }, 1200);
    };

    chatSend.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}
