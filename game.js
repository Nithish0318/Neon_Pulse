const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score-value');
const finalScoreElement = document.getElementById('final-score-value');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');

// Configuration
let width, height;
let gameActive = false;
let score = 0;
let frameCount = 0;

const player = {
    x: 0,
    y: 0,
    radius: 12,
    color: '#00f2ff',
    speed: 6,
    targetX: 0,
    targetY: 0,
    trail: []
};

const keys = {};
let obstacles = [];
let particles = [];

// Initialize Canvas
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    player.x = width / 2;
    player.y = height / 2;
}

window.addEventListener('resize', resize);
resize();

// Event Listeners
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);

function startGame() {
    gameActive = true;
    score = 0;
    frameCount = 0;
    obstacles = [];
    particles = [];
    player.x = width / 2;
    player.y = height / 2;
    player.trail = [];
    scoreElement.textContent = '0000';
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    animate();
}

function gameOver() {
    gameActive = false;
    finalScoreElement.textContent = Math.floor(score);
    gameOverScreen.classList.remove('hidden');
    createExplosion(player.x, player.y, player.color, 40);
}

// Particle System
class Particle {
    constructor(x, y, color, speedScale = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * 10 * speedScale;
        this.vy = (Math.random() - 0.5) * 10 * speedScale;
        this.life = 1;
        this.decay = Math.random() * 0.02 + 0.01;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, 1.5));
    }
}

// Obstacles
class Obstacle {
    constructor() {
        const side = Math.floor(Math.random() * 4);
        const size = Math.random() * 40 + 20;

        if (side === 0) { // Top
            this.x = Math.random() * width;
            this.y = -size;
        } else if (side === 1) { // Right
            this.x = width + size;
            this.y = Math.random() * height;
        } else if (side === 2) { // Bottom
            this.x = Math.random() * width;
            this.y = height + size;
        } else { // Left
            this.x = -size;
            this.y = Math.random() * height;
        }

        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = Math.random() * 3 + 2 + (score / 1000);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = size;
        this.rotation = 0;
        this.vr = (Math.random() - 0.5) * 0.1;
        this.color = Math.random() > 0.5 ? '#ff00e6' : '#ff3c3c';
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.vr;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.stroke();

        ctx.restore();
    }
}

function updatePlayer() {
    if (keys['KeyW'] || keys['ArrowUp']) player.y -= player.speed;
    if (keys['KeyS'] || keys['ArrowDown']) player.y += player.speed;
    if (keys['KeyA'] || keys['ArrowLeft']) player.x -= player.speed;
    if (keys['KeyD'] || keys['ArrowRight']) player.x += player.speed;

    // Boundary check
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // Trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 15) player.trail.shift();
}

function drawPlayer() {
    // Draw Trail
    ctx.beginPath();
    for (let i = 0; i < player.trail.length; i++) {
        const point = player.trail[i];
        const alpha = i / player.trail.length;
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = player.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, player.radius * alpha, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Main Body
    ctx.globalAlpha = 1;
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function animate() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, width, height);

    // Grid background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 50;
    for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    updatePlayer();
    drawPlayer();

    // Spawn obstacles
    if (frameCount % Math.max(10, 40 - Math.floor(score / 500)) === 0) {
        obstacles.push(new Obstacle());
    }

    // Update & Draw Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update();
        obs.draw();

        // Collision detection
        const dx = player.x - obs.x;
        const dy = player.y - obs.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + obs.size / 2) {
            gameOver();
        }

        // Remove off-screen
        if (obs.x < -100 || obs.x > width + 100 || obs.y < -100 || obs.y > height + 100) {
            obstacles.splice(i, 1);
        }
    }

    // Update & Draw Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }

    score += 0.5;
    scoreElement.textContent = Math.floor(score).toString().padStart(4, '0');
    frameCount++;

    requestAnimationFrame(animate);
}

// Initial draw for start screen
function drawStatic() {
    ctx.clearRect(0, 0, width, height);
    // Draw background particles for mood
    if (frameCount % 10 === 0) particles.push(new Particle(Math.random() * width, Math.random() * height, '#333', 0.1));
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0) particles.splice(i, 1);
    }
    frameCount++;
    if (!gameActive) requestAnimationFrame(drawStatic);
}

drawStatic();

drawStatic();
