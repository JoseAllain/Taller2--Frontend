/**
 * Servicio centralizado para todas las llamadas a la API del backend
 * Conecta todos los endpoints disponibles con el frontend
 */
class ApiService {
    constructor() {
        this.baseURL = "http://localhost:8000/api/v1";
        this.updateToken();
    }

    // Método para actualizar el token
    updateToken() {
        this.token = localStorage.getItem("token");
    }

    // ===== MÉTODOS DE UTILIDAD =====
    getAuthHeaders() {
        // Asegurar que tenemos el token más reciente
        this.updateToken();
        const headers = { "Content-Type": "application/json" };
        if (this.token && this.token !== "null" && this.token !== "undefined" && this.token.trim() !== "") {
            headers["Authorization"] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // ===== DOCENTE: ESTUDIANTES CREADOS =====
    async getStudentsByCreator() {
        const response = await fetch(`${this.baseURL}/auth/students/by-creator`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async handleResponse(response) {
        console.log("🔍 Handling response:", response.status, response.statusText);
        console.log("🔍 Response URL:", response.url);
        
        if (response.status === 401) {
            console.warn("⚠️ Unauthorized - redirecting to login");
            this.redirectToLogin();
            throw new Error("Sesión expirada");
        }
        
        if (!response.ok) {
            console.error("❌ Response not OK:", response.status, response.statusText);
            let errorData;
            try {
                errorData = await response.json();
                console.error("❌ Error data:", errorData);
            } catch (parseError) {
                console.error("❌ Error parsing error response:", parseError);
                errorData = { detail: "Error del servidor" };
            }
            
            const errorMessage = errorData.detail || errorData.message || `Error HTTP ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }
        
        try {
            const data = await response.json();
            console.log("✅ Response data:", data);
            return data;
        } catch (parseError) {
            console.error("❌ Error parsing successful response:", parseError);
            throw new Error("Error al procesar la respuesta del servidor");
        }
    }

    redirectToLogin() {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("proyecto_id");
        window.location.href = "index.html";
    }

    // ===== AUTENTICACIÓN =====
    async login(username, password) {
        const response = await fetch(`${this.baseURL}/auth/iniciar-sesion`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ username, password })
        });
        return this.handleResponse(response);
    }

    async register(correo, contrasena, rol = "estudiante") {
        const response = await fetch(`${this.baseURL}/auth/registrar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena, rol })
        });
        return this.handleResponse(response);
    }

    async getCurrentUser() {
        const response = await fetch(`${this.baseURL}/auth/me`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async changeUserRole(targetEmail, newRole) {
        const response = await fetch(`${this.baseURL}/auth/change-role`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ 
                target_email: targetEmail, 
                new_role: newRole 
            })
        });
        return this.handleResponse(response);
    }

    async getUserById(userId) {
        console.log("👤 Obteniendo información del usuario ID:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // ===== GESTIÓN DE USUARIOS =====
    async createUser(userData) {
        console.log("👤 Creando nuevo usuario:", userData.username);
        // Normalizamos el body para el endpoint /auth/register (campos en inglés)
        const body = {
            email: userData.email,
            password: userData.password,
            role: userData.role,
            full_name: userData.full_name
        };

        // Limpiar token inválido
        this.updateToken();
        if (!this.token || this.token === "null" || this.token === "undefined" || this.token.trim() === "") {
            localStorage.removeItem("token");
            this.token = null;
        }

        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(body)
        });
        return this.handleResponse(response);
    }

    async getAllUsers() {
        console.log("👥 Obteniendo lista de usuarios");
        const response = await fetch(`${this.baseURL}/auth/users`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getUsersByRole(role) {
        console.log("👥 Obteniendo usuarios por rol:", role);
        const response = await fetch(`${this.baseURL}/auth/users/role/${role}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async deactivateUser(userId) {
        console.log("🚫 Desactivando usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}/deactivate`, {
            method: "POST",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async activateUser(userId) {
        console.log("✅ Activando usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}/activate`, {
            method: "POST",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // ===== GESTIÓN DE PROYECTOS =====
    async uploadProject(nombreProyecto, file) {
        console.log("📤 Iniciando upload del proyecto:", nombreProyecto);
        console.log("📤 Archivo:", file.name, "Tamaño:", file.size);
        
        const formData = new FormData();
        formData.append("file", file);

        console.log("📤 URL de upload:", `${this.baseURL}/upload/${nombreProyecto}`);
        console.log("📤 Token disponible:", !!this.token);

        const response = await fetch(`${this.baseURL}/upload/${nombreProyecto}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${this.token}` },
            body: formData
        });
        
        console.log("📤 Response status:", response.status);
        
        // Manejar específicamente el caso de SRF3_SECURITY_VIOLATION
        if (response.status === 400) {
            try {
                const errorData = await response.json();
                console.log("⚠️ Error 400 data:", errorData);
                
                // Si es una violación de seguridad, devolver los datos en lugar de lanzar error
                if (errorData.error === "SRF3_SECURITY_VIOLATION") {
                    console.log("🛡️ Archivo rechazado por seguridad:", errorData);
                    return errorData;  // Devolver el error como respuesta válida para que se muestre en el modal
                }
            } catch (e) {
                console.error("❌ Error parseando respuesta 400:", e);
            }
        }
        
        return this.handleResponse(response);
    }

    async getUserProjects() {
        console.log("📂 Obteniendo proyectos del usuario");
        const response = await fetch(`${this.baseURL}/upload/projects`, {
            headers: this.getAuthHeaders()
        });
        console.log("📂 Response status de proyectos:", response.status);
        return this.handleResponse(response);
    }

    async getUserProjectsById(userId) {
        console.log("📂 Obteniendo proyectos del usuario ID:", userId);
        const response = await fetch(`${this.baseURL}/upload/projects/user/${userId}`, {
            headers: this.getAuthHeaders()
        });
        console.log("📂 Response status de proyectos por usuario:", response.status);
        return this.handleResponse(response);
    }

    async getProject(projectId) {
        console.log("📂 Obteniendo información del proyecto ID:", projectId);
        const response = await fetch(`${this.baseURL}/upload/projects/${projectId}`, {
            headers: this.getAuthHeaders()
        });
        console.log("📂 Response status de proyecto:", response.status);
        return this.handleResponse(response);
    }

    // ===== ANÁLISIS =====
    async analyzeProject(projectId) {
        console.log("🔍 Iniciando análisis del proyecto:", projectId);
        const response = await fetch(`${this.baseURL}/analysis/${projectId}`, {
            headers: this.getAuthHeaders()
        });
        console.log("🔍 Response status del análisis:", response.status);
        return this.handleResponse(response);
    }

    async getAnalysisResults(projectId) {
        console.log("📊 Obteniendo resultados del análisis:", projectId);
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/results`, {
            headers: this.getAuthHeaders()
        });
        console.log("📊 Response status de resultados:", response.status);
        return this.handleResponse(response);
    }

    async getAnalysisResultsAsTeacher(projectId) {
        console.log("📊 [DOCENTE] Obteniendo resultados del análisis:", projectId);
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/results`, {
            headers: this.getAuthHeaders()
        });
        console.log("📊 [DOCENTE] Response status de resultados:", response.status);
        return this.handleResponse(response);
    }

    async getAnalysisSummary(projectId) {
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/summary`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getProjectMetrics(projectId) {
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/metrics`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getLatestProjectMetrics(projectId) {
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/metrics/latest`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async updateMetricsPrecision(metricsId, precision) {
        const response = await fetch(`${this.baseURL}/analysis/metrics/${metricsId}/precision`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ precision })
        });
        return this.handleResponse(response);
    }

    async getAllMetrics() {
        const response = await fetch(`${this.baseURL}/analysis/all-metrics`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getProjectGraph(projectId) {
        const response = await fetch(`${this.baseURL}/analysis/${projectId}/graph`, {
            headers: this.getAuthHeaders()
        });
        
        if (response.status === 401) {
            this.redirectToLogin();
            throw new Error("Sesión expirada");
        }
        
        if (!response.ok) {
            throw new Error("No se pudo obtener el grafo");
        }
        
        return response.blob(); // Retorna imagen como blob
    }

    // ===== REPORTES =====
    async getReport(projectId) {
        const response = await fetch(`${this.baseURL}/report/${projectId}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getAccessibleReports() {
        const response = await fetch(`${this.baseURL}/report/`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    // ===== PRIVACIDAD (PRF2) =====
    async createAccessRequest(description = "Solicito acceso a todos mis datos personales") {
        const response = await fetch(`${this.baseURL}/privacy/request/access`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ description })
        });
        return this.handleResponse(response);
    }

    async createRectificationRequest(description, rectificationData) {
        const response = await fetch(`${this.baseURL}/privacy/request/rectification`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ 
                description, 
                rectification_data: rectificationData 
            })
        });
        return this.handleResponse(response);
    }

    async createErasureRequest(description, confirmation = true) {
        const response = await fetch(`${this.baseURL}/privacy/request/erasure`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ description, confirmation })
        });
        return this.handleResponse(response);
    }

    async getMyPrivacyRequests() {
        const response = await fetch(`${this.baseURL}/privacy/requests`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getPrivacyRightsInfo() {
        const response = await fetch(`${this.baseURL}/privacy/rights`);
        return this.handleResponse(response);
    }

    // ===== TRATAMIENTO DE DATOS (PRF4) =====
    async createTreatmentRegistry(treatmentData) {
        const response = await fetch(`${this.baseURL}/data-treatment/registry`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(treatmentData)
        });
        return this.handleResponse(response);
    }

    async getTreatmentRegistries(activeOnly = true) {
        const response = await fetch(`${this.baseURL}/data-treatment/registry?active_only=${activeOnly}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getComplianceReport() {
        const response = await fetch(`${this.baseURL}/data-treatment/compliance-report`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getDataTreatmentEnums() {
        const response = await fetch(`${this.baseURL}/data-treatment/enums`);
        return this.handleResponse(response);
    }

    // ===== ADMINISTRACIÓN DPA (PRF5) =====
    async createDpa(dpaData) {
        const response = await fetch(`${this.baseURL}/dpa-admin/dpa`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(dpaData)
        });
        return this.handleResponse(response);
    }

    async getDpas(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${this.baseURL}/dpa-admin/dpa?${params}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getDpaDashboard() {
        const response = await fetch(`${this.baseURL}/dpa-admin/dashboard`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getDpaAlerts(daysAhead = 30) {
        const response = await fetch(`${this.baseURL}/dpa-admin/alerts?days_ahead=${daysAhead}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getDpaEnums() {
        const response = await fetch(`${this.baseURL}/dpa-admin/enums`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async getDpaDetails(dpaId) {
        const response = await fetch(`${this.baseURL}/dpa-admin/dpa/${dpaId}`, {
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    async changeDpaStatus(dpaId, newStatus) {
        const response = await fetch(`${this.baseURL}/dpa-admin/dpa/${dpaId}/status?new_status=${newStatus}`, {
            method: "PATCH",
            headers: {
                ...this.getAuthHeaders(),
                'Accept': 'application/json'
            }
        });
        return this.handleResponse(response);
    }

    // ===== SALUD DEL SISTEMA =====
    async getHealthStatus() {
        const response = await fetch("http://localhost:8000/health");
        return this.handleResponse(response);
    }

    async getDetailedHealthStatus() {
        const response = await fetch("http://localhost:8000/health/detailed");
        return this.handleResponse(response);
    }

    // ===== GESTIÓN DE USUARIOS =====
    async getAllUsers() {
        console.log("👥 Obteniendo lista de todos los usuarios");
        const response = await fetch(`${this.baseURL}/auth/users`, {
            headers: this.getAuthHeaders()
        });
        console.log("👥 Response status usuarios:", response.status);
        return this.handleResponse(response);
    }

    async getUsersByRole(role) {
        console.log("👥 Obteniendo usuarios por rol:", role);
        const response = await fetch(`${this.baseURL}/auth/users/role/${role}`, {
            headers: this.getAuthHeaders()
        });
        console.log("👥 Response status usuarios por rol:", response.status);
        return this.handleResponse(response);
    }

    async getTeacherStudents() {
        console.log("👨‍🎓 Obteniendo estudiantes del docente");
        const response = await fetch(`${this.baseURL}/auth/teacher/students`, {
            headers: this.getAuthHeaders()
        });
        console.log("👨‍🎓 Response status estudiantes:", response.status);
        return this.handleResponse(response);
    }

    async createUser(userData) {
        console.log("➕ Creando nuevo usuario:", userData);
        const response = await fetch(`${this.baseURL}/auth/register`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        console.log("➕ Response status crear usuario:", response.status);
        return this.handleResponse(response);
    }

    async getUserDetails(userId) {
        console.log("🔍 Obteniendo detalles del usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}`, {
            headers: this.getAuthHeaders()
        });
        console.log("🔍 Response status detalles usuario:", response.status);
        return this.handleResponse(response);
    }

    async updateUser(userId, userData) {
        console.log("✏️ Actualizando usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}`, {
            method: "PUT",
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        console.log("✏️ Response status actualizar usuario:", response.status);
        return this.handleResponse(response);
    }

    async activateUser(userId) {
        console.log("✅ Activando usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}/activate`, {
            method: "POST",
            headers: this.getAuthHeaders()
        });
        console.log("✅ Response status activar usuario:", response.status);
        return this.handleResponse(response);
    }

    async deactivateUser(userId) {
        console.log("🚫 Desactivando usuario:", userId);
        const response = await fetch(`${this.baseURL}/auth/users/${userId}/deactivate`, {
            method: "POST",
            headers: this.getAuthHeaders()
        });
        console.log("🚫 Response status desactivar usuario:", response.status);
        return this.handleResponse(response);
    }

    async changeUserRole(userEmail, newRole) {
        console.log("🔄 Cambiando rol de usuario:", userEmail, "a", newRole);
        const response = await fetch(`${this.baseURL}/auth/change-role`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                target_email: userEmail,
                new_role: newRole
            })
        });
        console.log("🔄 Response status cambiar rol:", response.status);
        return this.handleResponse(response);
    }

    // ===== PRIVACIDAD - SOLICITUDES DE USUARIOS =====
    
    /**
     * Crear solicitud de acceso a datos personales (Art. 15 GDPR)
     */
    async createAccessRequest(description) {
        console.log("🔐 Creando solicitud de acceso a datos");
        const response = await fetch(`${this.baseURL}/privacy/request/access`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ description })
        });
        console.log("🔐 Response status solicitud acceso:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Crear solicitud de rectificación de datos (Art. 16 GDPR)
     */
    async createRectificationRequest(description, rectificationData) {
        console.log("✏️ Creando solicitud de rectificación");
        const response = await fetch(`${this.baseURL}/privacy/request/rectification`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                description,
                rectification_data: rectificationData
            })
        });
        console.log("✏️ Response status solicitud rectificación:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Crear solicitud de eliminación de datos (Art. 17 GDPR - Derecho al Olvido)
     */
    async createErasureRequest(description, confirmation) {
        console.log("🗑️ Creando solicitud de eliminación de datos");
        const response = await fetch(`${this.baseURL}/privacy/request/erasure`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                description,
                confirmation
            })
        });
        console.log("🗑️ Response status solicitud eliminación:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Obtener todas las solicitudes de privacidad del usuario actual
     */
    async getMyPrivacyRequests() {
        console.log("📋 Obteniendo mis solicitudes de privacidad");
        const response = await fetch(`${this.baseURL}/privacy/requests`, {
            headers: this.getAuthHeaders()
        });
        console.log("📋 Response status mis solicitudes:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Obtener detalles de una solicitud específica
     */
    async getPrivacyRequestDetail(requestId) {
        console.log("🔍 Obteniendo detalles de solicitud:", requestId);
        const response = await fetch(`${this.baseURL}/privacy/request/${requestId}`, {
            headers: this.getAuthHeaders()
        });
        console.log("🔍 Response status detalles solicitud:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Obtener los datos del usuario (JSON) de una solicitud de acceso completada
     */
    async getPrivacyRequestData(requestId) {
        console.log("📄 Obteniendo datos de solicitud de acceso:", requestId);
        const response = await fetch(`${this.baseURL}/privacy/request/${requestId}/data`, {
            headers: this.getAuthHeaders()
        });
        console.log("📄 Response status datos de solicitud:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Obtener información sobre derechos de privacidad
     */
    async getPrivacyRightsInfo() {
        console.log("ℹ️ Obteniendo información sobre derechos de privacidad");
        const response = await fetch(`${this.baseURL}/privacy/rights`, {
            headers: this.getAuthHeaders()
        });
        console.log("ℹ️ Response status info privacidad:", response.status);
        return this.handleResponse(response);
    }

    // ===== PRIVACIDAD - ADMINISTRACIÓN (Solo Admins) =====

    /**
     * Obtener todas las solicitudes de privacidad pendientes (Admin)
     */
    async getPendingPrivacyRequests() {
        console.log("📋 [ADMIN] Obteniendo solicitudes pendientes");
        const response = await fetch(`${this.baseURL}/privacy/admin/requests/pending`, {
            headers: this.getAuthHeaders()
        });
        console.log("📋 [ADMIN] Response status solicitudes pendientes:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Procesar solicitud de acceso (Admin)
     */
    async processAccessRequest(requestId) {
        console.log("⚙️ [ADMIN] Procesando solicitud de acceso:", requestId);
        const response = await fetch(`${this.baseURL}/privacy/admin/request/${requestId}/process/access`, {
            method: "POST",
            headers: this.getAuthHeaders()
        });
        console.log("⚙️ [ADMIN] Response status procesar acceso:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Procesar solicitud de rectificación (Admin)
     */
    async processRectificationRequest(requestId, approve, reason = null) {
        console.log("⚙️ [ADMIN] Procesando solicitud de rectificación:", requestId);
        const response = await fetch(`${this.baseURL}/privacy/admin/request/${requestId}/process/rectification`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                approve,
                reason
            })
        });
        console.log("⚙️ [ADMIN] Response status procesar rectificación:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Procesar solicitud de eliminación (Admin)
     */
    async processErasureRequest(requestId, approve, reason = null) {
        console.log("⚙️ [ADMIN] Procesando solicitud de eliminación:", requestId);
        const response = await fetch(`${this.baseURL}/privacy/admin/request/${requestId}/process/erasure`, {
            method: "POST",
            headers: this.getAuthHeaders(),
            body: JSON.stringify({
                approve,
                reason
            })
        });
        console.log("⚙️ [ADMIN] Response status procesar eliminación:", response.status);
        return this.handleResponse(response);
    }

    // ===== MONITOREO DE RECURSOS =====
    
    /**
     * Obtener métricas de recursos del sistema (CPU, RAM, disco)
     */
    async getResourceHealth() {
        console.log("📊 Obteniendo métricas de recursos del sistema...");
        const response = await fetch(`${this.baseURL}/monitoring/health/resources`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        console.log("📊 Response status recursos:", response.status);
        return this.handleResponse(response);
    }

    /**
     * Obtener información completa del sistema en JSON
     */
    async getSystemInfo() {
        console.log("📊 Obteniendo información completa del sistema...");
        const response = await fetch(`${this.baseURL}/monitoring/system-info`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        console.log("📊 Response status system-info:", response.status);
        return this.handleResponse(response);
    }

    // ===== MÉTRICAS ADMINISTRATIVAS =====
    /**
     * Obtiene métricas completas del sistema para el dashboard administrativo
     * Solo accesible para administradores
     */
    async getAdminMetrics() {
        console.log("📊 Obteniendo métricas administrativas...");
        const response = await fetch(`${this.baseURL}/admin/metrics`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene métricas específicas de usuarios
     * @param {number} hours - Horas para considerar usuarios activos
     */
    async getUserMetrics(hours = 24) {
        console.log(`📊 Obteniendo métricas de usuarios (${hours}h)...`);
        const response = await fetch(`${this.baseURL}/admin/metrics/users?hours=${hours}`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene métricas específicas de proyectos
     */
    async getProjectMetrics() {
        console.log("📊 Obteniendo métricas de proyectos...");
        const response = await fetch(`${this.baseURL}/admin/metrics/projects`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene métricas de análisis realizados
     */
    async getAnalysisMetrics() {
        console.log("📊 Obteniendo métricas de análisis...");
        const response = await fetch(`${this.baseURL}/admin/metrics/analysis`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene métricas de vulnerabilidades detectadas
     */
    async getVulnerabilityMetrics() {
        console.log("📊 Obteniendo métricas de vulnerabilidades...");
        const response = await fetch(`${this.baseURL}/admin/metrics/vulnerabilities`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene métricas de salud del sistema
     */
    async getSystemHealthMetrics() {
        console.log("📊 Obteniendo métricas de salud del sistema...");
        const response = await fetch(`${this.baseURL}/admin/metrics/health`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Obtiene actividad reciente del sistema
     * @param {number} limit - Número de actividades a mostrar
     */
    async getRecentActivity(limit = 10) {
        console.log(`📊 Obteniendo actividad reciente (${limit} items)...`);
        const response = await fetch(`${this.baseURL}/admin/metrics/activity?limit=${limit}`, {
            method: "GET",
            headers: this.getAuthHeaders()
        });
        return this.handleResponse(response);
    }
}

// Exportar instancia global
window.apiService = new ApiService();