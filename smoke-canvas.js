/**
 * Dynamic Smoke & Ethereal Canvas Background
 * Procesa partículas suaves de humo con siluetas etéreas usando HTML5 Canvas.
 * Optimizado para alto rendimiento, retina displays y pausa automática.
 */

class SmokeCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = this.isMobile() ? 25 : 55;
        this.isRunning = true;
        this.mouse = { x: -1000, y: -1000, radius: 120 };

        this.init();
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    init() {
        this.resize();
        this.createParticles();
        this.bindEvents();
        this.animate();
    }

    resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);

        this.maxParticles = this.isMobile() ? 25 : 55;
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.generateParticle(true));
        }
    }

    generateParticle(randomY = false) {
        return {
            x: Math.random() * this.width,
            y: randomY ? Math.random() * this.height : this.height + Math.random() * 100,
            radius: Math.random() * 80 + 40,
            speedY: -(Math.random() * 0.4 + 0.15),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.25 + 0.05,
            maxOpacity: Math.random() * 0.3 + 0.1,
            fadeSpeed: Math.random() * 0.002 + 0.001,
            isSkullType: Math.random() < 0.12 // 12% silueta etérea estilizada
        };
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Pausar si la pestaña no está visible para ahorrar recursos
        document.addEventListener('visibilitychange', () => {
            this.isRunning = !document.hidden;
            if (this.isRunning) this.animate();
        });

        // Toggle manual de la animación
        const toggleBtn = document.getElementById('toggle-animation-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.isRunning = !this.isRunning;
                this.canvas.style.display = this.isRunning ? 'block' : 'none';
                if (this.isRunning) this.animate();
            });
        }
    }

    drawSmokeParticle(p) {
        this.ctx.save();
        this.ctx.beginPath();

        const gradient = this.ctx.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.radius
        );

        if (p.isSkullType) {
            // Silueta mística etérea en plomo/blanco
            gradient.addColorStop(0, `rgba(200, 200, 210, ${p.opacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(120, 120, 135, ${p.opacity * 0.4})`);
            gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');
        } else {
            // Humo plomo estándar
            gradient.addColorStop(0, `rgba(160, 160, 170, ${p.opacity})`);
            gradient.addColorStop(0.6, `rgba(80, 80, 90, ${p.opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(10, 10, 10, 0)');
        }

        this.ctx.fillStyle = gradient;
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Si es tipo silueta etérea, dibujamos cuencas sutiles si está cerca
        if (p.isSkullType && p.opacity > 0.15) {
            this.ctx.fillStyle = `rgba(10, 10, 10, ${p.opacity * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x - p.radius * 0.25, p.y - p.radius * 0.1, p.radius * 0.12, 0, Math.PI * 2);
            this.ctx.arc(p.x + p.radius * 0.25, p.y - p.radius * 0.1, p.radius * 0.12, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    updateParticle(p) {
        p.y += p.speedY;
        p.x += p.speedX;

        // Repulsión ligera con el cursor del ratón
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.mouse.radius) {
            const angle = Math.atan2(dy, dx);
            const force = (this.mouse.radius - dist) / this.mouse.radius;
            p.x -= Math.cos(angle) * force * 1.5;
            p.y -= Math.sin(angle) * force * 1.5;
        }

        // Si la partícula sube más allá del tope, se recicla abajo
        if (p.y + p.radius < 0) {
            Object.assign(p, this.generateParticle(false));
        }
    }

    animate() {
        if (!this.isRunning) return;

        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            this.updateParticle(p);
            this.drawSmokeParticle(p);
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Inicialización automática tras cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    // Comprobar preferencia del sistema para movimiento reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        window.smokeBackground = new SmokeCanvas('smoke-canvas');
    }
});
