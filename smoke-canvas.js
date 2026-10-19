const canvas = document.getElementById('smoke-canvas');
const ctx = canvas.getContext('2d');

let particles = [];
const numParticles = 35;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class SmokeParticle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 100;
        this.size = Math.random() * 80 + 40;
        this.speedY = Math.random() * 0.8 + 0.3;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.15 + 0.05;
        this.angle = Math.random() * Math.PI * 2;
        this.spin = (Math.random() - 0.5) * 0.01;
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX + Math.sin(this.angle) * 0.3;
        this.angle += this.spin;
        
        if (this.y < -100) {
            this.reset();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
        gradient.addColorStop(0, `rgba(210, 210, 210, ${this.opacity})`);
        gradient.addColorStop(0.5, `rgba(100, 100, 100, ${this.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function initSmoke() {
    particles = [];
    for (let i = 0; i < numParticles; i++) {
        p = new SmokeParticle();
        p.y = Math.random() * canvas.height;
        particles.push(p);
    }
}

function animateSmoke() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateSmoke);
}

initSmoke();
animateSmoke();
