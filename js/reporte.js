// reporte.js
let resultadosProyecto = {};
let currentProjectData = {};
let loadedComponents = {
  summary: false,
  metrics: false,
  graph: false
};

window.onload = async () => {
  const proyectoId = localStorage.getItem("proyecto_id");
  const token = localStorage.getItem("token");
  
  console.log("🔍 Iniciando carga de reporte...");
  console.log("📁 Proyecto ID:", proyectoId);
  console.log("🔑 Token disponible:", !!token);
  
  if (!proyectoId) {
    console.error("❌ No hay proyecto seleccionado");
    alert("No hay proyecto seleccionado");
    window.location.href = "panel.html";
    return;
  }
  
  if (!token) {
    console.error("❌ No hay token de autenticación");
    alert("Sesión expirada. Por favor, inicia sesión nuevamente.");
    window.location.href = "index.html";
    return;
  }
  
  try {
    // Verificar conectividad del backend primero
    console.log("🔍 Verificando conectividad del backend...");
    const healthCheck = await fetch("https://sqli-ecologico-backend.onrender.com/health");
    if (!healthCheck.ok) {
      throw new Error("El backend no está respondiendo. Verifica que esté ejecutándose.");
    }
    console.log("✅ Backend conectado correctamente");

    // Verificar autenticación
    console.log("🔍 Verificando autenticación...");
    try {
      const userInfo = await apiService.getCurrentUser();
      console.log("✅ Usuario autenticado:", userInfo.correo);
    } catch (authError) {
      console.error("❌ Error de autenticación:", authError);
      if (authError.message === "Sesión expirada") {
        return; // Ya redirige automáticamente
      }
      throw new Error("Error de autenticación: " + authError.message);
    }
    
    // Obtener los resultados del análisis directamente (el análisis ya se ejecutó)
    console.log("📊 Obteniendo resultados del análisis...");
    const resultsData = await apiService.getAnalysisResults(proyectoId);
    console.log("✅ Resultados obtenidos:", resultsData);
    
    if (!resultsData) {
      console.warn("⚠️ No se recibieron datos de resultados");
      resultadosProyecto = {};
    } else if (!resultsData.archivos_vulnerables || resultsData.archivos_vulnerables.length === 0) {
      console.log("ℹ️ No se encontraron archivos vulnerables");
      resultadosProyecto = {};
      
      // Mostrar información del proyecto aunque no haya vulnerabilidades
      mostrarInfoProyecto({ message: "Análisis completado - No se encontraron vulnerabilidades" });
      mostrarSinResultados();
      
      // Aún así, cargar componentes adicionales con lazy loading
      setTimeout(() => cargarComponenteLazy('summary', proyectoId), 100);
      setTimeout(() => cargarComponenteLazy('metrics', proyectoId), 300);
      setTimeout(() => cargarComponenteLazy('graph', proyectoId), 500);
      console.log("✅ Componentes cargándose - proyecto sin vulnerabilidades");
      return;
    } else {
      // Hay vulnerabilidades, transformar la estructura del backend
      resultadosProyecto = transformarResultados(resultsData);
      console.log("✅ Resultados transformados:", resultadosProyecto);
    }
    
    // Mostrar información del proyecto
    mostrarInfoProyecto({ message: "Análisis completado exitosamente" });
    
    // Mostrar archivos
    const archivos = Object.keys(resultadosProyecto);
    console.log("📁 Archivos encontrados:", archivos.length);
    
    if (archivos.length === 0) {
      console.log("ℹ️ No se encontraron vulnerabilidades");
      mostrarSinResultados();
      return;
    }
    
    mostrarArchivos(archivos);
    cargarDetalles(archivos[0]);
    
    // Cargar componentes adicionales con lazy loading (carga diferida)
    console.log("🔄 Iniciando carga diferida de componentes adicionales...");
    
    // Cargar componentes de forma progresiva en lugar de paralela
    setTimeout(() => cargarComponenteLazy('summary', proyectoId), 100);
    setTimeout(() => cargarComponenteLazy('metrics', proyectoId), 300);
    setTimeout(() => cargarComponenteLazy('graph', proyectoId), 500);
    
    console.log("✅ Componentes principales cargados. Componentes adicionales se están cargando...");

  } catch (err) {
    console.error("❌ Error al cargar resultados:", err);
    console.error("❌ Stack trace:", err.stack);
    
    // Mostrar error más específico
    let errorMessage = "Error desconocido";
    if (err.message.includes("Failed to fetch") || err.message.includes("fetch")) {
      errorMessage = "No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 8000.";
    } else if (err.message === "Sesión expirada") {
      return; // Ya se maneja automáticamente
    } else {
      errorMessage = err.message;
    }
    
    alert("Error al cargar el proyecto: " + errorMessage);
    console.log("🔧 Debug info:");
    console.log("- Proyecto ID:", proyectoId);
    console.log("- Token disponible:", !!localStorage.getItem("token"));
    console.log("- Base URL:", apiService.baseURL);
    
    // No redirigir automáticamente para poder ver el error
    setTimeout(() => {
      if (confirm("¿Deseas volver al panel de proyectos?")) {
        window.location.href = "panel.html";
      }
    }, 1000);
  }
};

function transformarResultados(data) {
  console.log("🔄 Transformando resultados:", data);
  const resultados = {};

  // El backend devuelve archivos_vulnerables como array
  const vulnerableFiles = data.archivos_vulnerables || [];

  console.log("📁 Archivos vulnerables encontrados:", vulnerableFiles.length);

  vulnerableFiles.forEach(file => {
    // Usar la ruta completa o el nombre del archivo como clave
    const fileName = file.nombre_archivo || file.ruta_archivo;
    
    if (fileName && file.vulnerabilidades) {
      resultados[fileName] = {
        codigo: file.contenido_archivo || "// Contenido del archivo no disponible",
        vulnerabilidades: file.vulnerabilidades.map(v => ({
          linea: v.linea || "N/A",
          codigo: v.fragmento_vulnerable || "N/A",
          detalles: [
            `Predicción: ${v.prediccion || "N/A"}`,
            `Fecha detección: ${v.fecha_creacion ? new Date(v.fecha_creacion).toLocaleString() : "N/A"}`
          ]
        }))
      };
    }
  });

  console.log("✅ Resultados transformados:", Object.keys(resultados).length, "archivos");
  return resultados;
}

function mostrarArchivos(listaArchivos) {
  const contenedor = document.getElementById("lista-archivos");
  contenedor.innerHTML = "";

  listaArchivos.forEach(nombre => {
    const boton = document.createElement("button");
    const nombreCorto = nombre.split(/[\\/]/).pop();
    boton.textContent = nombreCorto;
    boton.onclick = () => cargarDetalles(nombre);
    contenedor.appendChild(boton);
  });
}

async function cargarDetalles(nombreArchivo) {
  const data = resultadosProyecto[nombreArchivo];
  if (!data) {
    document.getElementById("codigo").textContent = "// Archivo no encontrado en resultados.";
    document.getElementById("report-container").innerHTML = "";
    return;
  }

  document.getElementById("codigo").textContent = data.codigo || "// No se pudo cargar el archivo";

  const rep = document.getElementById("report-container");
  rep.innerHTML = "";

  if (!data.vulnerabilidades?.length) {
    rep.innerHTML = "<p>No se detectaron vulnerabilidades en este archivo.</p>";
  } else {
    data.vulnerabilidades.forEach((vuln) => {
      const div = document.createElement("div");
      div.className = "vulnerability-report";
      div.innerHTML = `
        <p><span class="critico">Archivo:</span> ${nombreArchivo}</p>
        <p><span class="linea">Línea:</span> ${vuln.linea}</p>
        <p><span class="fragmento">Fragmento:</span> <code>${vuln.codigo || vuln.fragmento || "N/A"}</code></p>
        ${vuln.detalles.map(d => `<p class="mensaje">- ${d}</p>`).join("")}
      `;
      rep.appendChild(div);
    });
  }

  Prism.highlightElement(document.getElementById("codigo"));
}

/* async function mostrarGrafo() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const iframe = document.getElementById("grafo-frame");

  try {
    const res = await fetch(`${backendURL}/grafo/${proyectoId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (!res.ok) {
      iframe.srcdoc = "<p>Error al cargar el grafo.</p>";
      return;
    }

    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);
  } catch (error) {
    iframe.srcdoc = "<p>Error de red al mostrar el grafo.</p>";
  }
} */



/* async function descargarPDF() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const res = await fetch(`${backendURL}/report/download/${proyectoId}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  if (res.status === 401) return redirigirLogin();
  if (!res.ok) return alert("No hay reporte disponible");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reporte_vulnerabilidades.pdf";
  a.click();
}


async function mostrarHeatmap() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const iframe = document.getElementById("heatmap-frame");

  try {
    const res = await fetch(`${backendURL}/interactive-heatmap/${proyectoId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    if (res.status === 401) return redirigirLogin();
    if (!res.ok) throw new Error("No se pudo obtener el heatmap");

    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    iframe.src = URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error al cargar el heatmap:", error);
    iframe.srcdoc = "<p>Error al cargar el heatmap interactivo.</p>";
  }
} */

// Funciones auxiliares para mostrar información del proyecto

// Función de carga diferida (lazy loading) para componentes
async function cargarComponenteLazy(componentName, proyectoId) {
  // Evitar cargar el mismo componente dos veces
  if (loadedComponents[componentName]) {
    console.log(`⏭️ Componente ${componentName} ya fue cargado`);
    return;
  }
  
  console.log(`🔄 Cargando componente: ${componentName}`);
  
  try {
    // Mostrar indicador de carga
    mostrarIndicadorCarga(componentName);
    
    // Cargar el componente correspondiente
    switch(componentName) {
      case 'summary':
        await cargarSummary(proyectoId);
        break;
      case 'metrics':
        await cargarMetricas(proyectoId);
        break;
      case 'graph':
        await mostrarGrafo(proyectoId);
        break;
      default:
        console.warn(`⚠️ Componente desconocido: ${componentName}`);
        return;
    }
    
    loadedComponents[componentName] = true;
    console.log(`✅ Componente ${componentName} cargado exitosamente`);
    
  } catch (error) {
    console.error(`❌ Error al cargar componente ${componentName}:`, error);
    mostrarErrorCarga(componentName, error.message);
  }
}

// Mostrar indicadores de carga para componentes
function mostrarIndicadorCarga(componentName) {
  const containerId = `${componentName}-container`;
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-indicator">
      <div class="spinner"></div>
      <p>Cargando ${getNombreComponente(componentName)}...</p>
    </div>
  `;
}

// Mostrar error de carga
function mostrarErrorCarga(componentName, errorMessage) {
  const containerId = `${componentName}-container`;
  const container = document.getElementById(containerId);
  
  if (!container) return;
  
  container.innerHTML = `
    <div class="error-indicator">
      <p>⚠️ Error al cargar ${getNombreComponente(componentName)}</p>
      <small>${errorMessage}</small>
      <button onclick="reintentar('${componentName}')" class="btn-retry">🔄 Reintentar</button>
    </div>
  `;
}

// Obtener nombre legible del componente
function getNombreComponente(componentName) {
  const nombres = {
    'summary': 'resumen',
    'metrics': 'métricas',
    'graph': 'grafo'
  };
  return nombres[componentName] || componentName;
}

// Función para reintentar la carga de un componente
async function reintentar(componentName) {
  const proyectoId = localStorage.getItem("proyecto_id");
  loadedComponents[componentName] = false;
  await cargarComponenteLazy(componentName, proyectoId);
}

function mostrarInfoProyecto(analysisData) {
  const infoContainer = document.getElementById("project-info");
  if (!infoContainer) return;
  
  const metricas = analysisData.metricas_analisis;
  
  infoContainer.innerHTML = `
    <div class="project-header">
      <h2>📊 Análisis del Proyecto</h2>
      ${metricas ? `
        <div class="metrics-summary">
          <div class="metric">
            <span class="label">⏱️ Tiempo:</span>
            <span class="value">${metricas.tiempo_analisis}s</span>
          </div>
          <div class="metric">
            <span class="label">🔍 Vulnerabilidades:</span>
            <span class="value">${metricas.vulnerabilidades_detectadas}</span>
          </div>
          <div class="metric">
            <span class="label">📁 Archivos:</span>
            <span class="value">${metricas.total_archivos_analizados}</span>
          </div>
          <div class="metric">
            <span class="label">🎯 Precisión:</span>
            <span class="value">${metricas.precision}%</span>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

async function cargarSummary(proyectoId) {
  try {
    const summary = await apiService.getAnalysisSummary(proyectoId);
    
    const summaryContainer = document.getElementById("summary-container");
    if (!summaryContainer) return;
    
    summaryContainer.innerHTML = `
      <div class="summary-card">
        <h3>📋 Resumen del Análisis</h3>
        <div class="summary-stats">
          <div class="stat">
            <h4>📁 Total de Archivos</h4>
            <p>${summary.total_files || 0}</p>
          </div>
          <div class="stat">
            <h4>⚠️ Archivos Vulnerables</h4>
            <p>${summary.vulnerable_files || 0}</p>
          </div>
          <div class="stat">
            <h4>🔒 Archivos Seguros</h4>
            <p>${summary.safe_files || 0}</p>
          </div>
          <div class="stat">
            <h4>🎯 Porcentaje de Seguridad</h4>
            <p>${summary.safety_percentage || 0}%</p>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error cargando summary:", error);
  }
}

async function cargarMetricas(proyectoId) {
  try {
    const metricas = await apiService.getProjectMetrics(proyectoId);
    
    const metricsContainer = document.getElementById("metrics-container");
    if (!metricsContainer) return;
    
    if (metricas.cantidad_metricas === 0) {
      metricsContainer.innerHTML = '<p>No hay métricas disponibles</p>';
      return;
    }
    
    metricsContainer.innerHTML = `
      <div class="metrics-history">
        <h3>📈 Historial de Métricas</h3>
        <div class="metrics-list">
          ${metricas.metricas.map((m, index) => `
            <div class="metric-entry">
              <h4>Análisis #${index + 1}</h4>
              <div class="metric-details">
                <span>⏱️ ${m.tiempo_analisis}s</span>
                <span>🔍 ${m.vulnerabilidades_detectadas} vuln.</span>
                <span>🎯 ${m.precision}%</span>
                <span>💰 $${m.costo}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error("Error cargando métricas:", error);
  }
}

async function mostrarGrafo(proyectoId) {
  try {
    const grafoBlob = await apiService.getProjectGraph(proyectoId);
    const grafoUrl = URL.createObjectURL(grafoBlob);
    
    const grafoContainer = document.getElementById("grafo-container");
    if (!grafoContainer) return;
    
    grafoContainer.innerHTML = `
      <div class="graph-card">
        <h3>🌐 Grafo de Vulnerabilidades</h3>
        <div class="graph-image">
          <img src="${grafoUrl}" alt="Grafo de vulnerabilidades" style="max-width: 100%; height: auto;" />
        </div>
        <button onclick="descargarGrafo('${grafoUrl}')" class="btn-download">
          📥 Descargar Grafo
        </button>
      </div>
    `;
  } catch (error) {
    console.error("Error cargando grafo:", error);
    const grafoContainer = document.getElementById("grafo-container");
    if (grafoContainer) {
      grafoContainer.innerHTML = `
        <div class="graph-card">
          <h3>🌐 Grafo de Vulnerabilidades</h3>
          <p class="error">No se pudo cargar el grafo: ${error.message}</p>
        </div>
      `;
    }
  }
}

function descargarGrafo(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = 'grafo_vulnerabilidades.png';
  a.click();
}

async function generarReporte() {
  const proyectoId = localStorage.getItem("proyecto_id");
  
  try {
    const reporte = await apiService.getReport(proyectoId);
    
    // Mostrar modal con el reporte
    const modalContent = `
      <div class="report-modal">
        <h3>📄 Reporte Completo</h3>
        <div class="report-content">
          <pre>${JSON.stringify(reporte, null, 2)}</pre>
        </div>
        <div class="modal-actions">
          <button onclick="descargarReporteJSON()" class="btn-download">📥 Descargar JSON</button>
          <button onclick="closeModal()" class="btn-close">Cerrar</button>
        </div>
      </div>
    `;
    
    showModal(modalContent);
  } catch (error) {
    alert("Error al generar reporte: " + error.message);
  }
}

function descargarReporteJSON() {
  const proyectoId = localStorage.getItem("proyecto_id");
  const reportData = {
    proyecto_id: proyectoId,
    fecha_generacion: new Date().toISOString(),
    resultados: resultadosProyecto,
    proyecto_data: currentProjectData
  };
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_proyecto_${proyectoId}.json`;
  a.click();
  
  closeModal();
}

// Funciones auxiliares para mostrar información cuando no hay resultados
function mostrarSinResultados() {
  document.getElementById("codigo").textContent = "// No se detectaron archivos con vulnerabilidades.";
  document.getElementById("report-container").innerHTML = `
    <div class="no-results">
      <h3>✅ ¡Excelente!</h3>
      <p>No se detectaron vulnerabilidades de inyección SQL en tu proyecto.</p>
      <p>Tu código parece estar seguro contra este tipo de ataques.</p>
    </div>
  `;
  
  const listaArchivos = document.getElementById("lista-archivos");
  if (listaArchivos) {
    listaArchivos.innerHTML = '<p>No hay archivos vulnerables que mostrar.</p>';
  }
}

// Funciones de modal
function showModal(content) {
  // Crear overlay del modal
  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'modal-overlay';
  modalOverlay.className = 'modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  `;
  
  // Crear contenedor del modal
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.style.cssText = `
    background: white;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90%;
    overflow-y: auto;
    padding: 20px;
    position: relative;
  `;
  
  modalContainer.innerHTML = content;
  modalOverlay.appendChild(modalContainer);
  document.body.appendChild(modalOverlay);
  
  // Cerrar modal al hacer click fuera
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

function closeModal() {
  const modal = document.getElementById('modal-overlay');
  if (modal) {
    modal.remove();
  }
}

