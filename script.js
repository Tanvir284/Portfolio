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

// Close menu when clicking a link
document.querySelectorAll('.nav-items a').forEach(link => {
    link.addEventListener('click', () => {
        const navItems = document.querySelector('.nav-items');
        if (navItems.classList.contains('active')) {
            toggleMenu(); // Re-use toggle function to close & swap icon
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
/* --- CONTACT FORM HANDLING --- */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        const originalText = btn.innerHTML;

        // Visual Feedback (Loading)
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TRANSMITTING...';
        btn.style.opacity = '0.7';

        // FormSubmit.co Logic using Fetch to keep the SPA feel
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
                // SUCCESS
                btn.innerHTML = '<i class="fas fa-check"></i> TRANSMISSION RECEIVED';
                btn.style.background = 'var(--secondary)';
                btn.style.color = '#000';
                btn.style.boxShadow = '0 0 20px #00ff9d';
                contactForm.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.color = '';
                    btn.style.boxShadow = '';
                    btn.style.opacity = '1';
                }, 3000);
            })
            .catch(error => {
                // ERROR
                console.error('FAILED...', error);
                btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> FAILED';
                btn.style.background = '#ff0055';

                alert('Transmission Failed. Please try again.');

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.opacity = '1';
                }, 3000);
            });
    });
}


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
