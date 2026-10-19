/**
 * Lógica para Cursos, 4 Unidades, 16 Semanas por Curso (32 espacios) y Entregas
 */
import { supabase } from './supabase-client.js';
import { escapeHTML, showToast, openModal, closeModal, formatBytes, formatDate } from './ui.js';

export class CourseManager {
    constructor(authManager) {
        this.auth = authManager;
        this.courses = [];
        this.currentCourse = null;
        this.bindEvents();
    }

    bindEvents() {
        const backBtn = document.getElementById('back-to-courses-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('course-detail-view').classList.add('hidden');
                document.getElementById('courses-overview-container').classList.remove('hidden');
            });
        }

        const searchInput = document.getElementById('course-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterSubmissions(e.target.value));
        }

        // Delegación de eventos para agregar entregas
        document.addEventListener('click', (e) => {
            const addSubBtn = e.target.closest('.add-sub-btn');
            if (addSubBtn) {
                const weekId = addSubBtn.dataset.weekId;
                document.getElementById('sub-week-id').value = weekId;
                openModal('modal-submission');
            }
        });

        // Evento de envío de formulario de entregas
        const subForm = document.getElementById('submission-form');
        if (subForm) {
            subForm.addEventListener('submit', (e) => this.handleSubmissionSubmit(e));
        }
    }

    async loadCourses() {
        try {
            const { data, error } = await supabase
                .from('courses')
                .select('*')
                .order('name');

            if (error) throw error;
            this.courses = data || [];
            this.renderCoursesOverview();
        } catch (err) {
            console.error("Error al cargar cursos:", err.message);
            showToast("No se pudieron cargar los cursos", "error");
        }
    }

    renderCoursesOverview() {
        const container = document.getElementById('courses-overview-container');
        if (!container) return;

        if (this.courses.length === 0) {
            container.innerHTML = `<p class="empty-state">No hay cursos registrados en la plataforma.</p>`;
            return;
        }

        container.innerHTML = this.courses.map(course => `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-header">
                    <i data-lucide="${course.icon_name || 'book'}" class="counter-icon"></i>
                    <div>
                        <h3>${escapeHTML(course.name)}</h3>
                        <span class="badge badge-accent">${escapeHTML(course.code)}</span>
                    </div>
                </div>
                <p class="course-desc">${escapeHTML(course.description || '')}</p>
                <div class="course-footer">
                    <span class="text-muted">Periodo: ${escapeHTML(course.academic_period)}</span>
                    <button class="btn btn-outline btn-sm view-course-btn" data-course-id="${course.id}">
                        Ver 16 Semanas <i data-lucide="chevron-right"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons({ targets: [container] });

        container.querySelectorAll('.view-course-btn, .course-card').forEach(elem => {
            elem.addEventListener('click', (e) => {
                const courseId = elem.dataset.courseId || elem.closest('.course-card').dataset.courseId;
                this.openCourseDetail(courseId);
            });
        });
    }

    async openCourseDetail(courseId) {
        this.currentCourse = this.courses.find(c => c.id === courseId);
        if (!this.currentCourse) return;

        document.getElementById('courses-overview-container').classList.add('hidden');
        document.getElementById('course-detail-view').classList.remove('hidden');
        document.getElementById('selected-course-title').textContent = `${this.currentCourse.code} - ${this.currentCourse.name}`;

        await this.renderCourseUnitsAndWeeks(courseId);
    }

    async renderCourseUnitsAndWeeks(courseId) {
        const accordionContainer = document.getElementById('units-accordion-container');
        accordionContainer.innerHTML = '<p class="text-muted">Cargando 4 Unidades y 16 Semanas...</p>';

        try {
            // Obtener Unidades
            const { data: units, error: uError } = await supabase
                .from('course_units')
                .select('*')
                .eq('course_id', courseId)
                .order('unit_number');

            if (uError) throw uError;

            // Obtener Semanas
            const unitIds = units.map(u => u.id);
            const { data: weeks, error: wError } = await supabase
                .from('course_weeks')
                .select('*')
                .in('unit_id', unitIds)
                .order('week_number');

            if (wError) throw wError;

            // Obtener Entregas
            const weekIds = weeks.map(w => w.id);
            const { data: submissions, error: sError } = await supabase
                .from('submissions')
                .select('*')
                .in('week_id', weekIds)
                .order('created_at', { ascending: false });

            if (sError) throw sError;

            // Renderizar Unidades y Semanas
            accordionContainer.innerHTML = units.map(unit => {
                const unitWeeks = weeks.filter(w => w.unit_id === unit.id);
                return `
                    <div class="unit-block">
                        <div class="unit-header">
                            <span>Unidad ${unit.unit_number}: ${escapeHTML(unit.title)}</span>
                        </div>
                        <div class="weeks-grid">
                            ${unitWeeks.map(week => {
                                const weekSubs = submissions.filter(s => s.week_id === week.id);
                                return this.buildWeekCardHTML(week, weekSubs);
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons({ targets: [accordionContainer] });

        } catch (err) {
            console.error("Error cargando estructura del curso:", err.message);
            showToast("Error al cargar las semanas del curso", "error");
        }
    }

    buildWeekCardHTML(week, submissions) {
        const isOwner = !!this.auth.currentUser;
        return `
            <div class="week-card" id="week-card-${week.id}">
                <div class="week-card-header">
                    <strong>Semana ${week.week_number}</strong>
                    ${isOwner ? `<button class="btn-icon btn-sm add-sub-btn" data-week-id="${week.id}" title="Subir entrega"><i data-lucide="plus"></i></button>` : ''}
                </div>
                <p class="week-topic">${escapeHTML(week.default_topic)}</p>
                <div class="submissions-list">
                    ${submissions.length === 0 
                        ? `<span class="text-muted text-xs">Sin entregas registradas</span>` 
                        : submissions.map(s => `
                            <div class="submission-item">
                                <i data-lucide="${s.file_path ? 'file-text' : 'link'}" class="sub-icon"></i>
                                <div class="sub-info">
                                    <a href="${s.external_url \vert{}\vert{} '#'}" target="_blank" class="sub-title">${escapeHTML(s.title)}</a>
                                    <span class="sub-meta">${formatDate(s.created_at)}${s.file_size_bytes ? '• ' + formatBytes(s.file_size_bytes) : ''}</span>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }

    async handleSubmissionSubmit(e) {
        e.preventDefault();
        const userId = this.auth.currentUser?.id;
        if (!userId) {
            showToast("Debes iniciar sesión para subir entregas", "error");
            return;
        }

        const weekId = document.getElementById('sub-week-id').value;
        const title = document.getElementById('sub-title').value.trim();
        const description = document.getElementById('sub-description').value.trim();
        const externalUrl = document.getElementById('sub-external-url').value.trim();
        const isPublic = document.getElementById('sub-is-public').checked;
        const fileInput = document.getElementById('sub-file-input');

        let filePath = null;
        let mimeType = null;
        let fileSize = null;

        try {
            // Subida a Supabase Storage si hay archivo
            if (fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const fileExt = file.name.split('.').pop();
                const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { data: storageData, error: storageErr } = await supabase.storage
                    .from('academic-docs')
                    .upload(fileName, file);

                if (storageErr) throw storageErr;

                filePath = storageData.path;
                mimeType = file.type;
                fileSize = file.size;
            }

            // Insertar Metadatos en DB
            const { error: dbErr } = await supabase
                .from('submissions')
                .insert({
                    user_id: userId,
                    week_id: weekId,
                    title: title,
                    description: description,
                    file_path: filePath,
                    external_url: externalUrl || null,
                    mime_type: mimeType,
                    file_size_bytes: fileSize,
                    is_public: isPublic
                });

            if (dbErr) throw dbErr;

            showToast("Entrega guardada exitosamente", "success");
            closeModal('modal-submission');
            document.getElementById('submission-form').reset();
            
            // Recargar vista actual del curso
            await this.renderCourseUnitsAndWeeks(this.currentCourse.id);

        } catch (err) {
            console.error("Error al guardar la entrega:", err.message);
            showToast(`Error: ${err.message}`, "error");
        }
    }

    filterSubmissions(query) {
        const q = query.toLowerCase();
        document.querySelectorAll('.week-card').forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(q)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }
}
