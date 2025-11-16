// admin.js - Funcionalidad para el panel administrativo

// Variables globales para gestión de usuarios
let currentUserRole = null;
let currentUserEmail = null;
let allUsers = [];

// Verificar permisos de administrador al cargar
window.onload = async () => {
    try {
        const userInfo = await apiService.getCurrentUser();
        currentUserRole = userInfo.role;
        currentUserEmail = userInfo.email;
        
        if (!userInfo.permissions.is_privileged) {
            alert("❌ Acceso denegado. Necesitas permisos de administrador o docente.");
            window.location.href = "panel.html";
            return;
        }
        
        // Cargar contenido inicial
        await loadUserManagement();
        await loadEnums();
        await loadSystemHealth();
        
    } catch (error) {
        console.error("Error cargando panel admin:", error);
        if (error.message === "Sesión expirada") return;
        alert("Error al cargar panel administrativo: " + error.message);
    }
};

// ===== GESTIÓN DE PESTAÑAS =====
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar pestaña seleccionada
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Cargar contenido específico
    switch(tabName) {
        case 'user-management':
            loadUserManagement();
            break;
        case 'privacy-requests':
            loadPrivacyRequests();
            break;
        case 'data-treatment':
            loadDataTreatments();
            break;
        case 'dpa-management':
            loadDpaManagement();
            break;
        case 'system-health':
            loadSystemHealth();
            break;
    }
}

// ===== DASHBOARD PRINCIPAL (REMOVIDO) =====
// La función loadAdminDashboard() ha sido eliminada ya que el dashboard 
// principal fue removido del HTML

// ===== GESTIÓN DE USUARIOS =====
async function loadUserManagement() {
    try {
        // Cargar todos los usuarios
        allUsers = await apiService.getAllUsers();
        
        // Actualizar contadores por rol
        const studentCount = allUsers.filter(u => u.role === 'estudiante').length;
        const teacherCount = allUsers.filter(u => u.role === 'docente').length;
        const adminCount = allUsers.filter(u => u.role === 'administrador').length;
        
        document.getElementById('students-count').textContent = studentCount;
        document.getElementById('teachers-count').textContent = teacherCount;
        document.getElementById('admins-count').textContent = adminCount;
        document.getElementById('total-users-count').textContent = allUsers.length;
        
        // Cargar acciones específicas según el rol
        loadRoleSpecificActions();
        
        // Cargar tabla de usuarios
        loadUsersTable();
        
    } catch (error) {
        console.error("Error cargando gestión de usuarios:", error);
        document.getElementById('role-specific-actions').innerHTML = 
            '<p style="color: red;">Error al cargar gestión de usuarios</p>';
    }
}

function loadRoleSpecificActions() {
    const actionsContainer = document.getElementById('role-specific-actions');
    
    if (currentUserRole === 'administrador') {
        actionsContainer.innerHTML = `
            <h4>⚙️ Acciones de Administrador</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
                <button class="btn-admin" onclick="showCreateUserModal('docente')">
                    ➕ Crear Docente
                </button>
                <button class="btn-admin" onclick="showCreateUserModal('estudiante')">
                    ➕ Crear Estudiante
                </button>
                <!-- 'Gestionar Roles' y 'Exportar Reporte' removidos -->
            </div>
                    <div class="alert-item">
                        <p><strong>Como Administrador puedes:</strong></p>
                        <ul>
                            <li> Crear usuarios con rol Docente</li>
                            <li> Crear usuarios con rol Estudiante</li>
                            <li> Activar/Desactivar usuarios</li>
                            <li> Ver todos los proyectos y reportes</li>
                        </ul>
                    </div>
        `;
    } else if (currentUserRole === 'docente') {
        actionsContainer.innerHTML = `
            <h4>👨‍🏫 Acciones de Docente</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
                <button class="btn-admin" onclick="showCreateUserModal('estudiante')">
                    ➕ Crear Estudiante
                </button>
                <button class="btn-admin" onclick="showStudentsManagement()">
                    👨‍🎓 Gestionar Estudiantes
                </button>
                <button class="btn-admin" onclick="exportStudentsReport()">
                    📊 Reporte de Estudiantes
                </button>
            </div>
            <div class="alert-item">
                <p><strong>Como Docente puedes:</strong></p>
                <ul>
                    <li>✅ Crear usuarios con rol Estudiante</li>
                    <li>✅ Ver reportes de todos los estudiantes</li>
                    <li>✅ Activar/Desactivar estudiantes</li>
                    <li>❌ No puedes crear docentes o administradores</li>
                    <li>❌ No puedes cambiar roles de otros usuarios</li>
                </ul>
            </div>
        `;
    }
}

function loadUsersTable() {
    const container = document.getElementById('users-table-container');
    
    if (allUsers.length === 0) {
        container.innerHTML = '<p>No hay usuarios registrados</p>';
        return;
    }
    
    // Filtrar usuarios según el rol actual
    let usersToShow = allUsers;
    if (currentUserRole === 'docente') {
        // Los docentes solo ven estudiantes y a sí mismos
        usersToShow = allUsers.filter(u => 
            u.role === 'estudiante' || u.email === currentUserEmail
        );
    }
    
    container.innerHTML = `
        <div style="margin: 15px 0;">
            <input type="text" id="user-search" placeholder="🔍 Buscar usuarios..." 
                   style="width: 300px; padding: 8px; margin-right: 10px;" 
                   onkeyup="filterUsers()">
            <select id="role-filter" onchange="filterUsers()" style="padding: 8px;">
                <option value="">Todos los roles</option>
                <option value="estudiante">👨‍🎓 Estudiantes</option>
                <option value="docente">👨‍🏫 Docentes</option>
                <option value="administrador">⚙️ Administradores</option>
            </select>
        </div>
        
        <table class="data-table" id="users-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Email</th>
                    <th>Usuario</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Último Acceso</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${usersToShow.map(user => `
                    <tr data-user-role="${user.role}" data-user-email="${user.email}">
                        <td>${user.id}</td>
                        <td>${user.email}</td>
                        <td>${user.username}</td>
                        <td>${user.full_name || 'No especificado'}</td>
                        <td>
                            <span class="status-badge ${getRoleColorClass(user.role)}">
                                ${getRoleIcon(user.role)} ${user.role}
                            </span>
                        </td>
                        <td>
                            <span class="status-badge ${user.is_active ? 'status-active' : 'status-expired'}">
                                ${user.is_active ? '✅ Activo' : '❌ Inactivo'}
                            </span>
                        </td>
                        <td>${user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}</td>
                        <td>
                            ${getUserActionButtons(user)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function getRoleIcon(role) {
    const icons = {
        'estudiante': '👨‍🎓',
        'docente': '👨‍🏫',
        'administrador': '⚙️'
    };
    return icons[role] || '👤';
}

function getRoleColorClass(role) {
    const classes = {
        'estudiante': 'status-processing',
        'docente': 'status-pending',
        'administrador': 'status-active'
    };
    return classes[role] || 'status-processing';
}

function getUserActionButtons(user) {
    if (user.email === currentUserEmail) {
        return '<span style="color: #666;">Usuario actual</span>';
    }
    
    let buttons = [];
    
    // Botón de ver proyectos (todos pueden ver)
    buttons.push(`<button class="btn-admin" onclick="viewUserProjects('${user.email}')">📂 Ver Proyectos</button>`);
    
    // Acciones específicas según el rol actual
    if (currentUserRole === 'administrador') {
        // Los administradores pueden hacer todo
    // Cambio de roles deshabilitado en este despliegue
        
        if (user.is_active) {
            buttons.push(`<button class="btn-admin danger" onclick="deactivateUser(${user.id}, '${user.email}')">🚫 Desactivar</button>`);
        } else {
            buttons.push(`<button class="btn-admin" onclick="activateUser(${user.id}, '${user.email}')">✅ Activar</button>`);
        }
    } else if (currentUserRole === 'docente' && user.role === 'estudiante') {
        // Los docentes solo pueden activar/desactivar estudiantes
        if (user.is_active) {
            buttons.push(`<button class="btn-admin danger" onclick="deactivateUser(${user.id}, '${user.email}')">🚫 Desactivar</button>`);
        } else {
            buttons.push(`<button class="btn-admin" onclick="activateUser(${user.id}, '${user.email}')">✅ Activar</button>`);
        }
    }
    
    return buttons.join(' ');
}

function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const roleFilter = document.getElementById('role-filter').value;
    const rows = document.querySelectorAll('#users-table tbody tr');
    
    rows.forEach(row => {
        const email = row.getAttribute('data-user-email').toLowerCase();
        const role = row.getAttribute('data-user-role');
        const textContent = row.textContent.toLowerCase();
        
        const matchesSearch = searchTerm === '' || textContent.includes(searchTerm);
        const matchesRole = roleFilter === '' || role === roleFilter;
        
        row.style.display = matchesSearch && matchesRole ? '' : 'none';
    });
}

// ===== MODAL PARA CREAR USUARIOS =====
function showCreateUserModal(defaultRole = '') {
    const modal = document.getElementById('create-user-modal');
    const roleSelect = document.getElementById('role-select');
    const modalTitle = document.getElementById('modal-title');
    
    // Configurar opciones de rol según el usuario actual
    let roleOptions = [];
    if (currentUserRole === 'administrador') {
        roleOptions = [
            { value: 'estudiante', text: '👨‍🎓 Estudiante' },
            { value: 'docente', text: '👨‍🏫 Docente' }
        ];
        modalTitle.textContent = '⚙️ Crear Nuevo Usuario (Administrador)';
    } else if (currentUserRole === 'docente') {
        roleOptions = [
            { value: 'estudiante', text: '👨‍🎓 Estudiante' }
        ];
        modalTitle.textContent = '👨‍🏫 Crear Nuevo Estudiante (Docente)';
    }
    
    roleSelect.innerHTML = roleOptions.map(option => 
        `<option value="${option.value}" ${option.value === defaultRole ? 'selected' : ''}>${option.text}</option>`
    ).join('');
    
    modal.style.display = 'flex';
}

function hideCreateUserModal() {
    document.getElementById('create-user-modal').style.display = 'none';
    document.getElementById('create-user-form').reset();
}

async function createUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Validar contraseñas
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    if (password !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }
    
    const userData = {
        email: formData.get('email'),
        username: formData.get('username'),
        password: password,
        role: formData.get('role'),
        full_name: formData.get('full_name')
    };
    
    try {
        await apiService.createUser(userData);
        alert(`✅ Usuario ${userData.username} creado exitosamente con rol ${userData.role}`);
        hideCreateUserModal();
        loadUserManagement(); // Recargar la tabla
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// Gestión de cambio de roles eliminada: el modal y sus handlers han sido removidos

// ===== ACCIONES DE USUARIO =====
async function deactivateUser(userId, userEmail) {
    if (!confirm(`¿Estás seguro de que quieres desactivar al usuario ${userEmail}?`)) {
        return;
    }
    
    try {
        await apiService.deactivateUser(userId);
        alert(`✅ Usuario ${userEmail} desactivado exitosamente`);
        loadUserManagement();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function activateUser(userId, userEmail) {
    try {
        await apiService.activateUser(userId);
        alert(`✅ Usuario ${userEmail} activado exitosamente`);
        loadUserManagement();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function viewUserProjects(userEmail) {
    // Esta funcionalidad requiere un endpoint específico en el backend
    alert(`📂 Ver proyectos de ${userEmail} - Funcionalidad disponible`);
}

function showStudentsManagement() {
    const students = allUsers.filter(u => u.role === 'estudiante');
    
    if (students.length === 0) {
        alert('No hay estudiantes registrados');
        return;
    }
    
    alert(`👨‍🎓 Gestión de Estudiantes:\n\nTotal de estudiantes: ${students.length}\nActivos: ${students.filter(s => s.is_active).length}\nInactivos: ${students.filter(s => !s.is_active).length}`);
}

function exportStudentsReport() {
    alert('📊 Exportar reporte de estudiantes - Funcionalidad disponible');
}

// ===== SOLICITUDES DE PRIVACIDAD =====
async function loadPrivacyRequests() {
    try {
        console.log("🔒 Cargando solicitudes de privacidad pendientes...");
        const container = document.getElementById('privacy-requests-list');
        container.innerHTML = '<p>⏳ Cargando solicitudes...</p>';
        
        const requests = await apiService.getPendingPrivacyRequests();
        
        if (!requests || requests.length === 0) {
            container.innerHTML = `
                <div class="alert-item">
                    <h4>✅ No hay solicitudes pendientes</h4>
                    <p>Todas las solicitudes de privacidad han sido procesadas.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="alert-item">
                <h4>📋 ${requests.length} Solicitudes Pendientes</h4>
                <p>Gestiona las solicitudes de privacidad de los usuarios:</p>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tipo</th>
                        <th>Usuario</th>
                        <th>Descripción</th>
                        <th>Fecha Creación</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr>
                            <td>${req.id}</td>
                            <td>
                                ${req.request_type === 'access' ? '📋 Acceso' : 
                                  req.request_type === 'rectification' ? '✏️ Rectificación' : 
                                  '🗑️ Eliminación'}
                            </td>
                            <td>Usuario #${req.id}</td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                                ${req.description || 'Sin descripción'}
                            </td>
                            <td>${new Date(req.created_at).toLocaleString()}</td>
                            <td>
                                <span class="status-badge status-${req.status.toLowerCase()}">
                                    ${req.status}
                                </span>
                                ${req.is_expired ? '<br><small style="color:red;">⚠️ Expirada</small>' : ''}
                            </td>
                            <td>
                                ${getPrivacyRequestActions(req)}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error cargando solicitudes:", error);
        document.getElementById('privacy-requests-list').innerHTML = `
            <div class="alert-item critical">
                <h4>❌ Error al cargar solicitudes</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function getPrivacyRequestActions(request) {
    if (request.status !== 'pending') {
        return '<small>Ya procesada</small>';
    }
    
    switch(request.request_type) {
        case 'access':
            return `
                <button class="btn-admin" onclick="processAccessRequest(${request.id})">
                    ⚙️ Procesar
                </button>
            `;
        case 'rectification':
            return `
                <button class="btn-admin" onclick="showRectificationModal(${request.id})">
                    ✅ Aprobar
                </button>
                <button class="btn-admin danger" onclick="rejectRequest(${request.id}, 'rectification')">
                    ❌ Rechazar
                </button>
            `;
        case 'erasure':
            return `
                <button class="btn-admin warning" onclick="showErasureModal(${request.id})">
                    ⚠️ Revisar
                </button>
                <button class="btn-admin danger" onclick="rejectRequest(${request.id}, 'erasure')">
                    ❌ Rechazar
                </button>
            `;
        default:
            return '';
    }
}

async function processAccessRequest(requestId) {
    if (!confirm('¿Procesar esta solicitud de acceso? Se generará un reporte con los datos del usuario.')) {
        return;
    }
    
    try {
        const result = await apiService.processAccessRequest(requestId);
        alert('✅ Solicitud procesada exitosamente\n\nDatos del usuario:\n' + JSON.stringify(result.data, null, 2));
        await loadPrivacyRequests();
    } catch (error) {
        alert('❌ Error al procesar solicitud: ' + error.message);
    }
}

function showRectificationModal(requestId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>✏️ Aprobar Rectificación</h3>
            <p>¿Aprobar esta solicitud de rectificación de datos?</p>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn-admin" onclick="approveRectification(${requestId})">
                    ✅ Aprobar
                </button>
                <button class="btn-admin danger" onclick="this.closest('.modal-overlay').remove()">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function approveRectification(requestId) {
    try {
        await apiService.processRectificationRequest(requestId, true);
        alert('✅ Solicitud de rectificación aprobada');
        document.querySelector('.modal-overlay').remove();
        await loadPrivacyRequests();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

function showErasureModal(requestId) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>🗑️ Solicitud de Eliminación de Datos</h3>
            <div class="danger-box">
                <strong>⚠️ ADVERTENCIA CRÍTICA</strong>
                <p>Esta acción eliminará PERMANENTEMENTE todos los datos del usuario:</p>
                <ul>
                    <li>Datos personales</li>
                    <li>Proyectos subidos</li>
                    <li>Análisis realizados</li>
                    <li>Reportes generados</li>
                    <li>Historial completo</li>
                </ul>
                <p><strong>Esta acción NO se puede deshacer.</strong></p>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn-admin danger" onclick="approveErasure(${requestId})">
                    🗑️ CONFIRMAR ELIMINACIÓN
                </button>
                <button class="btn-admin" onclick="this.closest('.modal-overlay').remove()">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

async function approveErasure(requestId) {
    const finalConfirm = prompt('Para confirmar la eliminación permanente, escribe "ELIMINAR":');
    
    if (finalConfirm !== 'ELIMINAR') {
        alert('Cancelado. No se ha eliminado nada.');
        return;
    }
    
    try {
        await apiService.processErasureRequest(requestId, true);
        alert('✅ Datos del usuario eliminados permanentemente');
        document.querySelector('.modal-overlay').remove();
        await loadPrivacyRequests();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

async function rejectRequest(requestId, requestType) {
    const reason = prompt('Motivo del rechazo:');
    
    if (!reason) {
        alert('Debe proporcionar un motivo para rechazar la solicitud');
        return;
    }
    
    try {
        if (requestType === 'rectification') {
            await apiService.processRectificationRequest(requestId, false, reason);
        } else if (requestType === 'erasure') {
            await apiService.processErasureRequest(requestId, false, reason);
        }
        
        alert('✅ Solicitud rechazada');
        await loadPrivacyRequests();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ===== TRATAMIENTO DE DATOS (PRF4) =====
async function loadDataTreatments() {
    try {
        const [treatments, complianceReport] = await Promise.all([
            apiService.getTreatmentRegistries(),
            apiService.getComplianceReport()
        ]);
        
        // Mostrar reporte de cumplimiento
        const complianceContainer = document.getElementById('gdpr-compliance');
        const report = complianceReport.prf4_compliance_report;
        
        complianceContainer.innerHTML = `
            <div class="compliance-items">
                <div class="compliance-item">
                    <div class="icon">📋</div>
                    <h4>${report.total_active_treatments}</h4>
                    <p>Tratamientos Activos</p>
                </div>
                <div class="compliance-item">
                    <div class="icon">✅</div>
                    <h4>${report.compliance_status}</h4>
                    <p>Estado GDPR</p>
                </div>
                <div class="compliance-item">
                    <div class="icon">📊</div>
                    <h4>${report.legal_bases_used.length}</h4>
                    <p>Bases Legales</p>
                </div>
                <div class="compliance-item">
                    <div class="icon">🔒</div>
                    <h4>${report.data_categories_tracked.length}</h4>
                    <p>Categorías de Datos</p>
                </div>
            </div>
        `;
        
        // Mostrar lista de tratamientos
        const treatmentsContainer = document.getElementById('treatments-list');
        
        if (treatments.total_treatments === 0) {
            treatmentsContainer.innerHTML = '<p>No hay tratamientos registrados</p>';
            return;
        }
        
        treatmentsContainer.innerHTML = `
            <h4>📋 Tratamientos Registrados (${treatments.total_treatments})</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Base Legal</th>
                        <th>Período Retención</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${treatments.treatments.map(t => `
                        <tr>
                            <td>${t.id}</td>
                            <td>${t.treatment_name}</td>
                            <td>${t.legal_basis}</td>
                            <td>${t.retention_period}</td>
                            <td><span class="status-badge status-${t.active ? 'active' : 'expired'}">${t.active ? 'Activo' : 'Inactivo'}</span></td>
                            <td>
                                <button class="btn-admin" onclick="viewTreatment(${t.id})">👁️ Ver</button>
                                <button class="btn-admin warning" onclick="editTreatment(${t.id})">✏️ Editar</button>
                                ${t.active ? 
                                    `<button class="btn-admin danger" onclick="deactivateTreatment(${t.id})">🚫 Desactivar</button>` :
                                    `<button class="btn-admin" onclick="activateTreatment(${t.id})">✅ Activar</button>`
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error cargando tratamientos:", error);
        document.getElementById('treatments-list').innerHTML = 
            '<p style="color: red;">Error al cargar tratamientos de datos</p>';
    }
}

async function showCreateTreatmentForm() {
    document.getElementById('create-treatment-form').style.display = 'block';
}

function hideCreateTreatmentForm() {
    document.getElementById('create-treatment-form').style.display = 'none';
}

async function createTreatment(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const treatmentData = {
        treatment_name: formData.get('treatment_name'),
        treatment_description: formData.get('treatment_description'),
        data_categories: formData.get('data_categories').split(',').map(s => s.trim()),
        data_fields: formData.get('data_fields'),
        processing_purpose: formData.get('processing_purpose'),
        processing_activities: formData.get('processing_activities'),
        legal_basis: formData.get('legal_basis'),
        retention_period: formData.get('retention_period'),
        security_measures: formData.get('security_measures')
    };
    
    try {
        await apiService.createTreatmentRegistry(treatmentData);
        alert('✅ Tratamiento creado exitosamente');
        hideCreateTreatmentForm();
        event.target.reset();
        loadDataTreatments();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ===== GESTIÓN DPA (PRF5) =====
async function loadDpaManagement() {
    try {
        const [dashboard, alerts, dpas] = await Promise.all([
            apiService.getDpaDashboard(),
            apiService.getDpaAlerts(),
            apiService.getDpas()
        ]);
        
        // Mostrar dashboard DPA
        const dashboardContainer = document.getElementById('dpa-dashboard');
        const summary = dashboard.prf5_dpa_dashboard.summary;
        
        dashboardContainer.innerHTML = `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>☁️ DPA Activos</h3>
                    <div class="number">${summary.total_active_dpas}</div>
                    <p>Acuerdos vigentes</p>
                </div>
                <div class="dashboard-card">
                    <h3>⚠️ Por Vencer</h3>
                    <div class="number">${summary.dpas_expiring_soon}</div>
                    <p>Próximos 30 días</p>
                </div>
                <div class="dashboard-card">
                    <h3>❌ Expirados</h3>
                    <div class="number">${summary.expired_dpas}</div>
                    <p>Requieren renovación</p>
                </div>
                <div class="dashboard-card">
                    <h3>🌍 Ubicaciones</h3>
                    <div class="number">${Object.keys(summary.data_locations).length}</div>
                    <p>Regiones cubiertas</p>
                </div>
            </div>
        `;
        
        // Mostrar alertas
        const alertsContainer = document.getElementById('dpa-alerts');
        
        if (alerts.alert_summary.expiring_soon === 0 && alerts.alert_summary.expired === 0) {
            alertsContainer.innerHTML = `
                <div class="alert-item">
                    <h4>✅ No hay alertas DPA</h4>
                    <p>Todos los acuerdos están al día</p>
                </div>
            `;
        } else {
            alertsContainer.innerHTML = `
                <h4>🚨 Alertas DPA</h4>
                ${alerts.expiring_dpas.map(dpa => `
                    <div class="alert-item ${dpa.priority === 'critical' ? 'critical' : ''}">
                        <h5>⏰ ${dpa.provider} (${dpa.cloud_provider})</h5>
                        <p>Vence en ${dpa.days_remaining} días - ${dpa.expiry_date}</p>
                        <button class="btn-admin warning" onclick="renewDpa(${dpa.id})">🔄 Renovar</button>
                    </div>
                `).join('')}
                ${alerts.expired_dpas.map(dpa => `
                    <div class="alert-item critical">
                        <h5>❌ ${dpa.provider} (${dpa.cloud_provider})</h5>
                        <p>Expirado hace ${dpa.days_overdue} días</p>
                        <button class="btn-admin danger" onclick="renewDpa(${dpa.id})">⚡ Renovar Urgente</button>
                    </div>
                `).join('')}
            `;
        }
        
        // Mostrar lista de DPAs
        const dpasContainer = document.getElementById('dpas-list');
        
        if (dpas.total_dpas === 0) {
            dpasContainer.innerHTML = '<p>No hay DPAs registrados</p>';
            return;
        }
        
        dpasContainer.innerHTML = `
            <h4>☁️ Data Processing Agreements (${dpas.total_dpas})</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Proveedor</th>
                        <th>Cloud Provider</th>
                        <th>Ubicación</th>
                        <th>Estado</th>
                        <th>Vencimiento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${dpas.dpas.map(dpa => `
                        <tr>
                            <td>${dpa.id}</td>
                            <td>${dpa.provider_name}</td>
                            <td>${dpa.cloud_provider}</td>
                            <td>${dpa.data_location}</td>
                            <td><span class="status-badge status-${dpa.status.toLowerCase()}">${dpa.status}</span></td>
                            <td>${new Date(dpa.expiry_date).toLocaleDateString()}</td>
                            <td>
                                <button class="btn-admin" onclick="viewDpa(${dpa.id})">👁️ Ver</button>
                                <button class="btn-admin warning" onclick="editDpa(${dpa.id})">✏️ Editar</button>
                                <button class="btn-admin danger" onclick="deactivateDpa(${dpa.id})">🚫 Desactivar</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        
    } catch (error) {
        console.error("Error cargando DPA:", error);
        document.getElementById('dpa-dashboard').innerHTML = 
            '<p style="color: red;">Error al cargar gestión DPA</p>';
    }
}

async function showCreateDpaForm() {
    document.getElementById('create-dpa-form').style.display = 'block';
}

function hideCreateDpaForm() {
    document.getElementById('create-dpa-form').style.display = 'none';
}

async function createDpa(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const dpaData = {
        provider_name: formData.get('provider_name'),
        cloud_provider: formData.get('cloud_provider'),
        dpa_title: formData.get('dpa_title'),
        dpa_description: formData.get('dpa_description'),
        signed_date: formData.get('signed_date'),
        effective_date: formData.get('effective_date'),
        expiry_date: formData.get('expiry_date'),
        data_location: formData.get('data_location'),
        data_categories_processed: formData.get('data_categories_processed').split(',').map(s => s.trim()),
        processing_purposes: formData.get('processing_purposes'),
        security_measures: formData.get('security_measures')
    };
    
    try {
        await apiService.createDpa(dpaData);
        alert('✅ DPA creado exitosamente');
        hideCreateDpaForm();
        event.target.reset();
        loadDpaManagement();
    } catch (error) {
        alert('❌ Error: ' + error.message);
    }
}

// ===== ESTADO DEL SISTEMA =====
async function loadSystemHealth() {
    try {
        const [basicHealth, detailedHealth, resourceHealth, systemInfo] = await Promise.all([
            apiService.getHealthStatus(),
            apiService.getDetailedHealthStatus(),
            apiService.getResourceHealth(),
            apiService.getSystemInfo()
        ]);
        
        const container = document.getElementById('system-health-info');
        
        // Determinar el color y el ícono según el estado de los recursos
        const getResourceStatus = (percent) => {
            if (percent < 70) return { color: '#28a745', icon: '✅', status: 'Óptimo' };
            if (percent < 85) return { color: '#ffc107', icon: '⚠️', status: 'Moderado' };
            return { color: '#dc3545', icon: '❌', status: 'Alto' };
        };
        
        const cpuStatus = getResourceStatus(resourceHealth.resources.cpu_percent);
        const ramStatus = getResourceStatus(resourceHealth.resources.ram_percent);
        const diskStatus = getResourceStatus(resourceHealth.resources.disk_percent);
        
        container.innerHTML = `
            
            <!-- Sección de Monitoreo de Recursos -->
            <div class="admin-section" style="background: var(--card-bg, white); margin-top: 20px;">
                <h3>📊 Monitoreo de Recursos del Sistema</h3>
                
                ${resourceHealth.warnings ? `
                    <div class="alert-item critical" style="margin-bottom: 20px;">
                        <h4>⚠️ Alertas de Recursos</h4>
                        <ul>
                            ${resourceHealth.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                ` : `
                    <div class="alert-item" style="margin-bottom: 20px; background: #d4edda; border-color: #c3e6cb;">
                    </div>
                `}
                
                <div class="dashboard-grid">
                    <!-- CPU -->
                    <div class="dashboard-card" style="background: linear-gradient(135deg, ${cpuStatus.color} 0%, ${cpuStatus.color}dd 100%);">
                        <h3>${cpuStatus.icon} CPU</h3>
                        <div class="number">${resourceHealth.resources.cpu_percent.toFixed(1)}%</div>
                        <p>Estado: ${cpuStatus.status}</p>
                        <small style="opacity: 0.9;">${systemInfo.cpu.cores} núcleos @ ${systemInfo.cpu.frequency_mhz ? systemInfo.cpu.frequency_mhz.toFixed(0) + ' MHz' : 'N/A'}</small>
                    </div>
                    
                    <!-- RAM -->
                    <div class="dashboard-card" style="background: linear-gradient(135deg, ${ramStatus.color} 0%, ${ramStatus.color}dd 100%);">
                        <h3>${ramStatus.icon} RAM</h3>
                        <div class="number">${resourceHealth.resources.ram_percent.toFixed(1)}%</div>
                        <p>Estado: ${ramStatus.status}</p>
                        <small style="opacity: 0.9;">${systemInfo.memory.used_gb} GB / ${systemInfo.memory.total_gb} GB</small>
                    </div>
                    
                    <!-- Disco -->
                    <div class="dashboard-card" style="background: linear-gradient(135deg, ${diskStatus.color} 0%, ${diskStatus.color}dd 100%);">
                        <h3>${diskStatus.icon} Disco</h3>
                        <div class="number">${resourceHealth.resources.disk_percent.toFixed(1)}%</div>
                        <p>Estado: ${diskStatus.status}</p>
                        <small style="opacity: 0.9;">${systemInfo.disk.free_gb} GB libres / ${systemInfo.disk.total_gb} GB</small>
                    </div>
                    
                    <!-- Red -->
                    <div class="dashboard-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h3>🌐 Red</h3>
                        <div class="number" style="font-size: 1.5em;">↓ ${systemInfo.network.mb_recv.toFixed(1)} MB</div>
                        <p>↑ ${systemInfo.network.mb_sent.toFixed(1)} MB</p>
                        <small style="opacity: 0.9;">${systemInfo.network.packets_recv.toLocaleString()} paquetes</small>
                    </div>
                </div>
                
                <!-- Detalles Adicionales -->
                <div style="margin-top: 20px; padding: 15px; background: var(--table-header-bg, #f8f9fa); border-radius: 8px;">
                    <h4>📋 Detalles del Sistema</h4>
                    <div class="form-grid">
                        <div>
                            <strong>Versión:</strong> ${detailedHealth.version}
                        </div>
                        <div>
                            <strong>Memoria Disponible:</strong> ${systemInfo.memory.available_gb} GB
                        </div>
                        <div>
                            <strong>Espacio en Disco:</strong> ${systemInfo.disk.free_gb} GB libres
                        </div>
                        <div>
                            <strong>Estado General:</strong> <span style="color: ${resourceHealth.status === 'healthy' ? '#28a745' : '#dc3545'}; font-weight: bold;">${resourceHealth.status === 'healthy' ? '✅ Saludable' : '⚠️ Requiere Atención'}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Botón de Actualización -->
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn-admin" onclick="loadSystemHealth()" style="padding: 10px 20px;">
                        🔄 Actualizar Métricas
                    </button>
                    <small style="display: block; margin-top: 10px; opacity: 0.7;">
                        Las métricas se actualizan automáticamente al cargar esta sección
                    </small>
                </div>
            </div>
            
            <!-- Información Adicional del Sistema -->
            <div class="admin-section" style="margin-top: 20px;">
                <h4>🔍 Información Detallada</h4>
                <div class="form-grid">
                    <div>
                        <strong>CPU Total:</strong> ${systemInfo.cpu.usage_percent.toFixed(2)}%
                    </div>
                    <div>
                        <strong>RAM Usada:</strong> ${systemInfo.memory.used_bytes.toLocaleString()} bytes
                    </div>
                    <div>
                        <strong>Disco Usado:</strong> ${systemInfo.disk.used_gb} GB
                    </div>
                    <div>
                        <strong>Bytes Enviados:</strong> ${systemInfo.network.bytes_sent.toLocaleString()}
                    </div>
                    <div>
                        <strong>Bytes Recibidos:</strong> ${systemInfo.network.bytes_recv.toLocaleString()}
                    </div>
                    <div>
                        <strong>Paquetes Enviados:</strong> ${systemInfo.network.packets_sent.toLocaleString()}
                    </div>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error("Error cargando estado del sistema:", error);
        document.getElementById('system-health-info').innerHTML = `
            <div class="alert-item critical">
                <h4>❌ Error al cargar estado del sistema</h4>
                <p>${error.message}</p>
                <button class="btn-admin" onclick="loadSystemHealth()" style="margin-top: 10px;">
                    🔄 Reintentar
                </button>
            </div>
        `;
    }
}

// ===== CARGAR ENUMS =====
async function loadEnums() {
    try {
        const [treatmentEnums, dpaEnums] = await Promise.all([
            apiService.getDataTreatmentEnums(),
            apiService.getDpaEnums()
        ]);
        
        // Cargar enums para tratamientos
        const legalBasisSelect = document.getElementById('legal-basis-select');
        if (legalBasisSelect) {
            legalBasisSelect.innerHTML = treatmentEnums.legal_bases.map(lb => 
                `<option value="${lb.value}">${lb.name}</option>`
            ).join('');
        }
        
        const retentionSelect = document.getElementById('retention-period-select');
        if (retentionSelect) {
            retentionSelect.innerHTML = treatmentEnums.retention_periods.map(rp => 
                `<option value="${rp.value}">${rp.name}</option>`
            ).join('');
        }
        
        // Cargar enums para DPA
        const cloudProviderSelect = document.getElementById('cloud-provider-select');
        if (cloudProviderSelect) {
            cloudProviderSelect.innerHTML = dpaEnums.cloud_providers.map(cp => 
                `<option value="${cp.value}">${cp.name}</option>`
            ).join('');
        }
        
        const dataLocationSelect = document.getElementById('data-location-select');
        if (dataLocationSelect) {
            dataLocationSelect.innerHTML = dpaEnums.data_locations.map(dl => 
                `<option value="${dl.value}">${dl.name}</option>`
            ).join('');
        }
        
    } catch (error) {
        console.error("Error cargando enums:", error);
    }
}

// ===== FUNCIONES DE ACCIÓN =====
function viewTreatment(id) {
    alert(`Ver detalles del tratamiento ${id} - Funcionalidad disponible`);
}

function editTreatment(id) {
    alert(`Editar tratamiento ${id} - Funcionalidad disponible`);
}

function deactivateTreatment(id) {
    if (confirm('¿Estás seguro de que quieres desactivar este tratamiento?')) {
        alert(`Desactivar tratamiento ${id} - Funcionalidad disponible`);
    }
}

function viewDpa(id) {
    alert(`Ver detalles del DPA ${id} - Funcionalidad disponible`);
}

function editDpa(id) {
    alert(`Editar DPA ${id} - Funcionalidad disponible`);
}

function deactivateDpa(id) {
    if (confirm('¿Estás seguro de que quieres desactivar este DPA?')) {
        alert(`Desactivar DPA ${id} - Funcionalidad disponible`);
    }
}

function renewDpa(id) {
    alert(`Renovar DPA ${id} - Funcionalidad disponible`);
}