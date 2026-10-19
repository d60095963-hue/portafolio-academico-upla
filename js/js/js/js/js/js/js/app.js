/**
 * Punto de Entrada Principal (SPA Router & Coordinación de Módulos)
 */
import { AuthManager } from './auth.js';
import { CourseManager } from './courses.js';
import { PortfolioManager } from './portfolio.js';
import { openModal, closeModal, showToast } from './ui.js';

class App {
    constructor() {
        this.auth = new AuthManager((user, profile) => this.onAuthStateChanged(user, profile));
        this.courseManager = new CourseManager(this.auth);
        this.portfolioManager = new PortfolioManager(this.auth);

        this.initRouter();
        this.bindEvents();
    }

    initRouter() {
        window.addEventListener('hashchange', () => this.handleNavigation());
        this.handleNavigation();
    }

    handleNavigation() {
        const hash = window.location.hash.replace('#', '') || 'inicio';
        const sections = document.querySelectorAll('.app-section');
        const navLinks = document.querySelectorAll('.nav-link');

        sections.forEach(sec => {
            if (sec.id === `sec-${hash}`) {
                sec.classList.add('active-section');
            } else {
                sec.classList.remove('active-section');
            }
        });

        navLinks.forEach(link => {
            if (link.dataset.section === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Cargar datos según sección
        if (hash === 'cursos') this.courseManager.loadCourses();
        if (hash === 'sobre-mi') this.portfolioManager.loadGoals();
        if (hash === 'proyectos') this.portfolioManager.loadProjects();
    }

    bindEvents() {
        // Modal Event Listeners
        document.getElementById('open-login-btn')?.addEventListener('click', () => openModal('modal-login'));
        document.getElementById('open-register-btn')?.addEventListener('click', () => openModal('modal-register'));

        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) closeModal(modal.id);
            });
        });

        // Menú Móvil
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('primary-nav');
        if (mobileBtn && nav) {
            mobileBtn.addEventListener('click', () => {
                const isOpen = nav.classList.toggle('open');
                mobileBtn.setAttribute('aria-expanded', isOpen);
            });
        }

        // Formularios Auth
        document.getElementById('login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                await this.auth.signIn({ email, password });
                closeModal('modal-login');
                showToast("¡Sesión iniciada con éxito!", "success");
            } catch (err) {
                document.getElementById('login-error-msg').textContent = err.message;
                document.getElementById('login-error-msg').classList.remove('hidden');
            }
        });

        document.getElementById('logout-btn')?.addEventListener('click', async () => {
            await this.auth.signOut();
            showToast("Sesión cerrada", "info");
        });
    }

    onAuthStateChanged(user, profile) {
        const guestGroup = document.getElementById('auth-guest-controls');
        const userGroup = document.getElementById('auth-user-controls');
        const ownerElements = document.querySelectorAll('.owner-only');

        if (user) {
            guestGroup?.classList.add('hidden');
            userGroup?.classList.remove('hidden');
            ownerElements.forEach(el => el.classList.remove('hidden'));

            if (profile) {
                document.getElementById('header-user-name').textContent = `${profile.first_name} ${profile.last_name}`;
                document.getElementById('hero-full-name').textContent = `${profile.first_name} ${profile.last_name}`;
                document.getElementById('hero-cycle-badge').textContent = `Ciclo ${profile.academic_cycle || 'V'} • ${profile.career}`;
            }
        } else {
            guestGroup?.classList.remove('hidden');
            userGroup?.classList.add('hidden');
            ownerElements.forEach(el => el.classList.add('hidden'));
        }
    }
}

// Inicializar Aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
