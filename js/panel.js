const token = localStorage.getItem("token");
if (!token) {
  alert("Debes iniciar sesión");
  window.location.href = "index.html";
}

// Variables para lazy loading y paginación
let todosLosProyectos = [];
let proyectosCargados = 0;
const PROYECTOS_POR_PAGINA = 5;
let cargandoMasProyectos = false;

window.onload = async () => {
  try {
    // Obtener información del usuario actual
    const userInfo = await apiService.getCurrentUser();
    
    // Agregar navegación dinámica
    addDynamicNavigation(userInfo.role);
    
    // Mostrar información del usuario
    document.getElementById("user-info").innerHTML = `
      <div class="user-card">
        <h3>👤 ${userInfo.email}</h3>
        <p><strong>Rol:</strong> ${userInfo.role}</p>
        <p><strong>Permisos:</strong> ${userInfo.permissions.role_description}</p>
        ${userInfo.permissions.can_view_all_reports ? 
          '<span class="badge admin">🔐 Acceso Total</span>' : 
          '<span class="badge user">📁 Acceso Limitado</span>'
        }
      </div>
    `;

    // Obtener proyectos del usuario
    const projectsData = await apiService.getUserProjects();
    todosLosProyectos = projectsData.projects;
    
    const contenedor = document.getElementById("lista-proyectos");
    contenedor.innerHTML = "";

    if (todosLosProyectos.length === 0) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <h3>📂 No tienes proyectos registrados</h3>
          <p>Sube tu primer proyecto desde el panel principal</p>
          <a href="principal.html" class="btn-primary">Subir Proyecto</a>
        </div>
      `;
      return;
    }

    // Implementar lazy loading: cargar solo los primeros proyectos
    cargarMasProyectos();
    
    // Configurar scroll infinito para cargar más proyectos
    configurarScrollInfinito();

    // Si es admin o docente, cargar reportes de forma diferida
    if (userInfo.permissions.can_view_all_reports) {
      setTimeout(() => cargarReportesAccesibles(), 500);
    }

  } catch (error) {
    console.error("Error al cargar panel:", error);
    if (error.message === "Sesión expirada") {
      return; // apiService ya redirige
    }
    alert("Error al cargar información: " + error.message);
  }
};

// ===== LAZY LOADING Y SCROLL INFINITO =====

function cargarMasProyectos() {
  if (cargandoMasProyectos) return;
  
  cargandoMasProyectos = true;
  const contenedor = document.getElementById("lista-proyectos");
  
  // Calcular cuántos proyectos cargar
  const inicio = proyectosCargados;
  const fin = Math.min(proyectosCargados + PROYECTOS_POR_PAGINA, todosLosProyectos.length);
  
  console.log(`🔄 Cargando proyectos ${inicio + 1} a ${fin} de ${todosLosProyectos.length}`);
  
  // Cargar proyectos del rango actual
  for (let i = inicio; i < fin; i++) {
    const p = todosLosProyectos[i];
    const item = document.createElement("li");
    item.className = "project-card";
    item.style.opacity = "0";
    item.style.transform = "translateY(20px)";
    item.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    item.innerHTML = `
      <div class="project-info">
        <h3>📁 ${p.name}</h3>
        <p>📅 Creado: ${new Date(p.created_at).toLocaleDateString()}</p>
        <p>📝 ${p.description || 'Sin descripción'}</p>
      </div>
      <div class="project-actions">
        <button class="btn-ver" onclick="verProyecto(${p.id})">📊 Ver Reporte</button>
        <button class="btn-metrics" onclick="verMetricas(${p.id})">📈 Métricas</button>
        <button class="btn-analyze" onclick="analizarProyecto(${p.id})">🔍 Re-analizar</button>
      </div>
    `;

    contenedor.appendChild(item);
    
    // Animación de entrada con retraso
    setTimeout(() => {
      item.style.opacity = "1";
      item.style.transform = "translateY(0)";
    }, (i - inicio) * 50);
  }
  
  proyectosCargados = fin;
  
  // Mostrar indicador si hay más proyectos
  let loadingIndicator = document.getElementById("loading-more");
  
  if (proyectosCargados < todosLosProyectos.length) {
    if (!loadingIndicator) {
      loadingIndicator = document.createElement("div");
      loadingIndicator.id = "loading-more";
      loadingIndicator.className = "loading-more";
      loadingIndicator.innerHTML = `
        <div class="loading-spinner"></div>
        <p>Cargando más proyectos...</p>
      `;
      contenedor.appendChild(loadingIndicator);
    }
  } else {
    // Remover indicador si ya no hay más proyectos
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
    console.log("✅ Todos los proyectos han sido cargados");
  }
  
  cargandoMasProyectos = false;
}

function configurarScrollInfinito() {
  const contenedor = document.getElementById("lista-proyectos");
  
  // Configurar Intersection Observer para detectar cuándo llegar al final
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && proyectosCargados < todosLosProyectos.length) {
        console.log("📜 Usuario llegó al final, cargando más proyectos...");
        cargarMasProyectos();
      }
    });
  }, {
    root: null,
    rootMargin: '100px',
    threshold: 0.1
  });
  
  // Observar el indicador de carga
  const checkForIndicator = () => {
    const loadingIndicator = document.getElementById("loading-more");
    if (loadingIndicator) {
      observer.observe(loadingIndicator);
    }
  };
  
  // Intentar observar después de un pequeño delay
  setTimeout(checkForIndicator, 100);
}

// Funciones auxiliares para el panel

async function cargarReportesAccesibles() {
  try {
    const reportesData = await apiService.getAccessibleReports();
    
    const contenedorReportes = document.getElementById("reportes-todos");
    if (!contenedorReportes) return;
    
    contenedorReportes.innerHTML = `
      <div class="admin-section">
        <h3>📋 Reportes Accesibles (${reportesData.access_level})</h3>
        <p>${reportesData.message}</p>
        <div class="reports-grid">
          ${reportesData.reports.map(r => `
            <div class="report-card">
              <h4>Proyecto #${r.project_id}</h4>
              <p>${r.project_name}</p>
              <button onclick="verProyecto(${r.project_id})" class="btn-small">Ver</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error cargando reportes:", error);
  }
}

async function verMetricas(projectId) {
  try {
    const metricas = await apiService.getLatestProjectMetrics(projectId);
    
    if (metricas.mensaje) {
      alert("No hay métricas disponibles para este proyecto");
      return;
    }
    
    const modalContent = `
      <div class="metrics-modal">
        <h3>📈 Métricas del Proyecto #${projectId}</h3>
        <div class="metrics-grid">
          <div class="metric-card">
            <h4>⏱️ Tiempo de Análisis</h4>
            <p>${metricas.metricas.tiempo_analisis}s</p>
          </div>
          <div class="metric-card">
            <h4>🔍 Vulnerabilidades</h4>
            <p>${metricas.metricas.vulnerabilidades_detectadas}</p>
          </div>
          <div class="metric-card">
            <h4>📁 Archivos Analizados</h4>
            <p>${metricas.metricas.total_archivos_analizados}</p>
          </div>
          <div class="metric-card">
            <h4>🎯 Precisión</h4>
            <p>${metricas.metricas.precision}%</p>
          </div>
          <div class="metric-card">
            <h4>💰 Costo</h4>
            <p>$${metricas.metricas.costo}</p>
          </div>
          <div class="metric-card">
            <h4>✅ Detecciones Correctas</h4>
            <p>${metricas.metricas.detecciones_correctas}</p>
          </div>
        </div>
        <button onclick="closeModal()" class="btn-close">Cerrar</button>
      </div>
    `;
    
    showModal(modalContent);
  } catch (error) {
    alert("Error al obtener métricas: " + error.message);
  }
}

async function analizarProyecto(projectId) {
  if (!confirm("¿Quieres re-analizar este proyecto? Esto puede tomar unos minutos.")) {
    return;
  }
  
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = "🔄 Analizando...";
  btn.disabled = true;
  
  try {
    const resultado = await apiService.analyzeProject(projectId);
    alert("✅ Análisis completado exitosamente");
    
    // Recargar la página para mostrar datos actualizados
    window.location.reload();
  } catch (error) {
    alert("❌ Error en el análisis: " + error.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function verProyecto(id) {
  localStorage.setItem("proyecto_id", id);
  window.location.href = "reporte.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  localStorage.removeItem("proyecto_id");
  window.location.href = "index.html";
}

// Utilidades para modales
function showModal(content) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      ${content}
    </div>
  `;
  document.body.appendChild(modal);
}

function closeModal() {
  const modal = document.querySelector(".modal-overlay");
  if (modal) modal.remove();
}

// ===== NAVEGACIÓN DINÁMICA =====
function addDynamicNavigation(userRole) {
  const navbar = document.querySelector('.navbar');
  
  // Enlaces específicos según el rol
  let roleSpecificLinks = [];
  
  if (userRole === 'administrador') {
    roleSpecificLinks = [
      { href: 'admin.html', text: '⚙️ Administración' }
    ];
  } else if (userRole === 'docente') {
    roleSpecificLinks = [
      { href: 'docente.html', text: '👨‍🏫 Panel Docente' }
    ];
  }
  
  // Solo agregar enlaces si hay enlaces específicos del rol
  if (roleSpecificLinks.length > 0) {
    // Crear estructura de navegación
    const navLinksContainer = document.createElement('div');
    navLinksContainer.className = 'nav-links';
    navLinksContainer.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
      margin-left: auto;
      margin-right: 15px;
    `;
    
    // Crear enlaces de navegación
    roleSpecificLinks.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.href;
      linkElement.textContent = link.text;
      linkElement.style.cssText = `
        color: white;
        text-decoration: none;
        padding: 6px 12px;
        border-radius: 4px;
        background-color: rgba(255,255,255,0.1);
        font-size: 14px;
        transition: background-color 0.3s;
      `;
      linkElement.addEventListener('mouseover', () => {
        linkElement.style.backgroundColor = 'rgba(255,255,255,0.2)';
      });
      linkElement.addEventListener('mouseout', () => {
        linkElement.style.backgroundColor = 'rgba(255,255,255,0.1)';
      });
      navLinksContainer.appendChild(linkElement);
    });
    
    // Insertar navegación antes del botón de logout
    const logoutBtn = navbar.querySelector('.logout');
    navbar.insertBefore(navLinksContainer, logoutBtn);
  }
}
