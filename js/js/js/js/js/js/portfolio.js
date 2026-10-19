/**
 * Módulo de Gestión de Metas, Habilidades Técnicas y Proyectos
 */
import { supabase } from './supabase-client.js';
import { escapeHTML, showToast, formatDate } from './ui.js';

export class PortfolioManager {
    constructor(authManager) {
        this.auth = authManager;
    }

    async loadGoals(userId = null) {
        const targetUserId = userId || this.auth.currentUser?.id;
        const container = document.getElementById('goals-list-container');
        if (!container) return;

        try {
            let query = supabase.from('goals').select('*').order('display_order');
            if (targetUserId) {
                query = query.eq('user_id', targetUserId);
            } else {
                query = query.eq('is_public', true);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = `<p class="text-muted">No se han registrado metas aún.</p>`;
                return;
            }

            container.innerHTML = data.map(goal => `
                <div class="goal-item card">
                    <div class="goal-header">
                        <span class="badge ${goal.status === 'Completada' ? 'badge-accent' : 'badge-secondary'}">${escapeHTML(goal.status)}</span>
                        <span class="goal-timeframe text-muted">${escapeHTML(goal.timeframe)}</span>
                    </div>
                    <h4>${escapeHTML(goal.title)}</h4>
                    <p class="goal-desc">${escapeHTML(goal.description || '')}</p>
                    ${goal.target_date ? `<small class="text-muted">Fecha objetivo: ${formatDate(goal.target_date)}</small>` : ''}
                </div>
            `).join('');

        } catch (err) {
            console.error("Error cargando metas:", err.message);
        }
    }

    async loadProjects(userId = null) {
        const targetUserId = userId || this.auth.currentUser?.id;
        const container = document.getElementById('projects-grid-container');
        if (!container) return;

        try {
            let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
            if (targetUserId) {
                query = query.eq('user_id', targetUserId);
            } else {
                query = query.eq('is_public', true);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = `<p class="text-muted">No hay proyectos publicados para mostrar.</p>`;
                return;
            }

            container.innerHTML = data.map(proj => `
                <div class="card glass-card project-card">
                    <h3>${escapeHTML(proj.title)}</h3>
                    <span class="badge badge-accent">${escapeHTML(proj.status)}</span>
                    <p>${escapeHTML(proj.summary)}</p>
                    <div class="tech-tags">
                        ${(proj.technologies || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
                    </div>
                    <div class="project-links">
                        ${proj.repository_url ? `<a href="${escapeHTML(proj.repository_url)}" target="_blank" class="btn btn-outline btn-sm"><i data-lucide="github"></i> Código</a>` : ''}
                        ${proj.demo_url ? `<a href="${escapeHTML(proj.demo_url)}" target="_blank" class="btn btn-primary btn-sm"><i data-lucide="external-link"></i> Demo</a>` : ''}
                    </div>
                </div>
            `).join('');

            if (window.lucide) lucide.createIcons({ targets: [container] });

        } catch (err) {
            console.error("Error cargando proyectos:", err.message);
        }
    }
}
