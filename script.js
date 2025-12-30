AOS.init({ duration: 800, once: true });

// Mobile Menu Logic
function toggleMenu() {
    document.querySelector('.nav-items').classList.toggle('active');
}

// Scroll Progress
window.onscroll = function () {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
};

// Cursor Logic
const cursorOuter = document.querySelector('.cursor-outer');
const cursorInner = document.querySelector('.cursor-inner');
window.addEventListener('mousemove', e => {
    cursorInner.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cursorOuter.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
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

/* --- NEURAL NETWORK BACKGROUND --- */
const canvas = document.getElementById('neuralCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 243, 255, 0.5)';
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const particleCount = Math.min(window.innerWidth / 10, 100);
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(0, 243, 255, ${1 - distance / 150})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

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



