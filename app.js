// Configuración de Supabase (Reemplazar con tus credenciales reales si usas Supabase Cloud, o usa modo local automático)
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key';
let supabaseClient = null;

try {
    if (window.supabase && SUPABASE_URL.includes('supabase.co')) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
} catch (e) {
    console.warn("Supabase no configurado. Operando en modo local seguro.");
}

// Estado Global de la Aplicación
let currentUser = null;
let isTeacherMode = false;
let globalLogoUrl = "https://upload.wikimedia.org/wikipedia/commons/2/21/Universidad_Peruana_Los_Andes_-_UPLA.png";

// Estructura de Cursos (16 semanas: 4 Unidades x 4 Semanas)
const courseStructure = {
    "course-1": "Algoritmo y Estructura de Datos",
    "course-2": "Desarrollo de Aplicaciones I"
};

document.addEventListener("DOMContentLoaded", () => {
    checkActiveSession();
    renderAllCourses();
});

// Autenticación Tabs
function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('login-form').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('register-form').classList.add('active');
    }
}

// Previsualizar Avatar en Registro
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('avatar-preview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Registro de Usuario
function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const code = document.getElementById('reg-code').value;
    const career = document.getElementById('reg-career').value;
    const cycle = document.getElementById('reg-cycle').value;
    const pass = document.getElementById('reg-pass').value;
    const avatarPreview = document.getElementById('avatar-preview').src || "https://via.placeholder.com/150";

    const users = JSON.parse(localStorage.getItem('upla_users') || '{}');
    if (users[code]) {
        alert("El código universitario ya está registrado.");
        return;
    }

    users[code] = { name, code, career, cycle, pass, avatar: avatarPreview };
    localStorage.setItem('upla_users', JSON.stringify(users));
    alert("¡Registro exitoso! Ya puedes iniciar sesión.");
    switchAuthTab('login');
}

// Inicio de Sesión
function handleLogin(event) {
    event.preventDefault();
    const code = document.getElementById('login-code').value;
    const pass = document.getElementById('login-pass').value;

    const users = JSON.parse(localStorage.getItem('upla_users') || '{}');
    if (users[code] && users[code].pass === pass) {
        currentUser = users[code];
        isTeacherMode = false;
        completeLogin();
    } else {
        alert("Credenciales incorrectas o usuario no registrado.");
    }
}

// Acceso Docente
function handleTeacherAccess() {
    currentUser = { name: "Docente / Evaluador UPLA", code: "DOCENTE-UPLA", career: "Facultad de Ingeniería", cycle: "Global", avatar: "https://via.placeholder.com/150" };
    isTeacherMode = true;
    completeLogin();
}

function completeLogin() {
    localStorage.setItem('upla_active_user', JSON.stringify(currentUser));
    localStorage.setItem('upla_is_teacher', isTeacherMode);
    
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    
    updateHeaderUI();
    loadSavedTasks();
}

function checkActiveSession() {
    const savedUser = localStorage.getItem('upla_active_user');
    const teacherFlag = localStorage.getItem('upla_is_teacher');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isTeacherMode = teacherFlag === 'true';
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('dashboard-container').style.display = 'block';
        updateHeaderUI();
        loadSavedTasks();
    }
}

function handleLogout() {
    localStorage.removeItem('upla_active_user');
    localStorage.removeItem('upla_is_teacher');
    location.reload();
}

function updateHeaderUI() {
    if (!currentUser) return;
    document.getElementById('user-name-disp').innerText = currentUser.name;
    document.getElementById('user-code-disp').innerText = currentUser.code;
    document.getElementById('user-avatar-disp').src = currentUser.avatar;
    document.getElementById('role-badge').innerText = isTeacherMode ? "Modo Docente (Lectura)" : currentUser.cycle;
}

// Renderizado Dinámico de Cursos (16 Semanas)
function renderAllCourses() {
    Object.keys(courseStructure).forEach(courseId => {
        const courseBody = document.querySelector(`#${courseId} .course-body`);
        let html = '';

        for (let unit = 1; unit <= 4; unit++) {
            html += `<div class="unit-container">
                <h3 class="unit-title">Unidad ${unit}</h3>
                <div class="weeks-grid">`;

            const startWeek = (unit - 1) * 4 + 1;
            for (let w = 0; w < 4; w++) {
                const weekNum = startWeek + w;
                html += `
                    <div class="week-card" data-week="${courseId}-w${weekNum}">
                        <div class="week-header">
                            <span>Semana ${weekNum}</span>
                        </div>
                        <input type="text" class="week-title-input" placeholder="Tema de la semana..." id="title-${courseId}-w${weekNum}" onchange="saveWeekMeta('${courseId}', ${weekNum})">
                        
                        <div class="upload-section">
                            <div class="cloud-guide">💡 Sube archivo local o pega enlace público de Google Drive / GitHub.</div>
                            <input type="file" id="file-${courseId}-w${weekNum}" onchange="handleFileUpload(event, '${courseId}', ${weekNum})">
                            <input type="text" class="week-title-input" placeholder="O pega URL en la nube..." id="url-${courseId}-w${weekNum}" onchange="handleUrlUpload('${courseId}', ${weekNum})">
                            <div id="display-${courseId}-w${weekNum}"></div>
                        </div>
                    </div>`;
            }
            html += `</div></div>`;
        }
        courseBody.innerHTML = html;
    });
}

function toggleCourse(courseId) {
    document.getElementById(courseId).classList.toggle('active');
}

// Gestión de Tareas y Almacenamiento Local/Cloud
function getStorageKey(courseId, weekNum) {
    const userPrefix = isTeacherMode ? "docente" : currentUser.code;
    return `upla_task_${userPrefix}_${courseId}_w${weekNum}`;
}

function saveWeekMeta(courseId, weekNum) {
    if (isTeacherMode) return;
    const titleVal = document.getElementById(`title-${courseId}-w${weekNum}`).value;
    const data = JSON.parse(localStorage.getItem(getStorageKey(courseId, weekNum)) || '{}');
    data.title = titleVal;
    localStorage.setItem(getStorageKey(courseId, weekNum), JSON.stringify(data));
}

function handleFileUpload(event, courseId, weekNum) {
    if (isTeacherMode) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const taskData = {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            date: new Date().toLocaleString(),
            type: 'local',
            content: e.target.result,
            title: document.getElementById(`title-${courseId}-w${weekNum}`).value
        };
        localStorage.setItem(getStorageKey(courseId, weekNum), JSON.stringify(taskData));
        renderTaskDisplay(courseId, weekNum, taskData);
    };
    reader.readAsDataURL(file);
}

function handleUrlUpload(courseId, weekNum) {
    if (isTeacherMode) return;
    const urlVal = document.getElementById(`url-${courseId}-w${weekNum}`).value;
    if (!urlVal) return;

    const taskData = {
        name: "Enlace en la Nube",
        size: "Nube",
        date: new Date().toLocaleString(),
        type: 'url',
        content: urlVal,
        title: document.getElementById(`title-${courseId}-w${weekNum}`).value
    };
    localStorage.setItem(getStorageKey(courseId, weekNum), JSON.stringify(taskData));
    renderTaskDisplay(courseId, weekNum, taskData);
}

function renderTaskDisplay(courseId, weekNum, data) {
    const container = document.getElementById(`display-${courseId}-w${weekNum}`);
    if (!data || !data.content) {
        container.innerHTML = '';
        return;
    }

    let actionBtn = data.type === 'local' 
        ? `<a href="${data.content}" download="${data.name}" class="btn-primary" style="display:inline-block; text-align:center; padding:6px; margin-top:5px; text-decoration:none;">Descargar Tarea</a>`
        : `<a href="${data.content}" target="_blank" class="btn-primary" style="display:inline-block; text-align:center; padding:6px; margin-top:5px; text-decoration:none;">Abrir Enlace Nube</a>`;

    let deleteBtn = !isTeacherMode ? `<button class="btn-danger-sm" style="width:100%; margin-top:5px;" onclick="deleteTask('${courseId}', ${weekNum})">Borrar Tarea</button>` : '';

    container.innerHTML = `
        <div class="uploaded-info">
            <strong>${data.name}</strong> (${data.size})<br>
            <small>${data.date}</small>
            ${actionBtn}
            ${deleteBtn}
        </div>
    `;
}

function deleteTask(courseId, weekNum) {
    if (isTeacherMode) return;
    if (confirm("¿Estás seguro de eliminar esta tarea?")) {
        localStorage.removeItem(getStorageKey(courseId, weekNum));
        document.getElementById(`title-${courseId}-w${weekNum}`).value = '';
        document.getElementById(`url-${courseId}-w${weekNum}`).value = '';
        document.getElementById(`display-${courseId}-w${weekNum}`).innerHTML = '';
    }
}

function loadSavedTasks() {
    Object.keys(courseStructure).forEach(courseId => {
        for (let w = 1; w <= 16; w++) {
            const saved = localStorage.getItem(getStorageKey(courseId, w));
            if (saved) {
                const data = JSON.parse(saved);
                if (data.title) {
                    document.getElementById(`title-${courseId}-w${w}`).value = data.title;
                }
                renderTaskDisplay(courseId, w, data);
            }
        }
    });
}

// Modal de Perfil
function openProfileModal() {
    if (isTeacherMode) return;
    document.getElementById('edit-name').value = currentUser.name;
    document.getElementById('edit-career').value = currentUser.career;
    document.getElementById('edit-cycle').value = currentUser.cycle;
    document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfileModal() {
    document.getElementById('profile-modal').style.display = 'none';
}

function saveProfileChanges(event) {
    event.preventDefault();
    currentUser.name = document.getElementById('edit-name').value;
    currentUser.career = document.getElementById('edit-career').value;
    currentUser.cycle = document.getElementById('edit-cycle').value;
    
    const passInput = document.getElementById('edit-pass').value;
    if (passInput) currentUser.pass = passInput;

    const fileInput = document.getElementById('edit-avatar-file').files[0];
    if (fileInput) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUser.avatar = e.target.result;
            persistUpdatedUser();
        };
        reader.readAsDataURL(fileInput);
    } else {
        persistUpdatedUser();
    }
}

function persistUpdatedUser() {
    const users = JSON.parse(localStorage.getItem('upla_users') || '{}');
    users[currentUser.code] = currentUser;
    localStorage.setItem('upla_users', JSON.stringify(users));
    localStorage.setItem('upla_active_user', JSON.stringify(currentUser));
    
    updateHeaderUI();
    closeProfileModal();
    alert("Perfil actualizado correctamente.");
}

function promptChangeLogo() {
    const newUrl = prompt("Ingresa la URL de la imagen del Logo UPLA:", globalLogoUrl);
    if (newUrl) {
        globalLogoUrl = newUrl;
        document.getElementById('header-logo').src = newUrl;
        document.getElementById('upla-logo-auth').src = newUrl;
    }
}
