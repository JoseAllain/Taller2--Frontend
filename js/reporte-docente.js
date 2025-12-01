// reporte-docente.js - Lógica específica para docentes viendo reportes de estudiantes
let resultadosProyecto = {};
let currentProjectData = {};
let studentInfo = {};
let loadedComponents = {
  summary: false,
  metrics: false,
  graph: false
};

window.onload = async () => {
  // Obtener el ID del proyecto SOLO desde la URL (los docentes siempre vienen desde docente.html)
  const urlParams = new URLSearchParams(window.location.search);
  const proyectoId = urlParams.get('id');
  const estudianteId = urlParams.get('student_id'); // Parámetro opcional para identificar al estudiante
  
  const token = localStorage.getItem("token");
  
  console.log("🔍 [DOCENTE] Iniciando carga de reporte...");
  console.log("📁 Proyecto ID:", proyectoId);
  console.log("👨‍🎓 Estudiante ID:", estudianteId);
  console.log("🔑 Token disponible:", !!token);
  
  if (!proyectoId) {
    console.error("❌ No hay proyecto seleccionado");
    alert("No hay proyecto seleccionado");
    window.location.href = "docente.html";
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

    // Verificar autenticación y rol de docente
    console.log("🔍 Verificando autenticación y rol...");
    try {
      const userInfo = await apiService.getCurrentUser();
      console.log("✅ Usuario autenticado:", userInfo);
      console.log("✅ Email:", userInfo.correo || userInfo.email);
      console.log("✅ Rol (rol):", userInfo.rol);
      console.log("✅ Rol (role):", userInfo.role);
      
      // Verificar rol - puede venir como 'rol' o 'role' del backend
      const userRole = (userInfo.rol || userInfo.role || '').toLowerCase();
      console.log("✅ Rol normalizado:", userRole);
      
      if (userRole !== 'docente') {
        console.error("❌ Usuario no es docente, rol actual:", userRole);
        alert("Esta página es solo para docentes. Serás redirigido.");
        window.location.href = "reporte.html?id=" + proyectoId;
        return;
      }
      
      console.log("✅ Verificación de rol exitosa - Usuario es docente");
    } catch (authError) {
      console.error("❌ Error de autenticación:", authError);
      if (authError.message === "Sesión expirada") {
        return; // Ya redirige automáticamente
      }
      throw new Error("Error de autenticación: " + authError.message);
    }
    
    // Obtener información del proyecto primero
    console.log("📊 Obteniendo información del proyecto...");
    const projectInfo = await apiService.getProject(proyectoId);
    console.log("✅ Información del proyecto obtenida:", projectInfo);
    
    // Obtener información del estudiante dueño del proyecto
    if (projectInfo.usuario_id) {
      try {
        const studentData = await apiService.getUserById(projectInfo.usuario_id);
        studentInfo = studentData;
        mostrarInfoEstudiante(studentData, projectInfo);
      } catch (error) {
        console.warn("⚠️ No se pudo obtener información del estudiante:", error);
        mostrarInfoEstudiante({ correo: "Estudiante desconocido" }, projectInfo);
      }
    }
    
    // Obtener los resultados del análisis como docente
    console.log("📊 Obteniendo resultados del análisis como docente...");
    const resultsData = await apiService.getAnalysisResultsAsTeacher(proyectoId);
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
    } else if (err.message.includes("No tienes permisos")) {
      errorMessage = "No tienes permisos para ver este proyecto. Solo puedes ver proyectos de tus estudiantes.";
    } else {
      errorMessage = err.message;
    }
    
    alert("Error al cargar el proyecto: " + errorMessage);
    console.log("🔧 Debug info:");
    console.log("- Proyecto ID:", proyectoId);
    console.log("- Token disponible:", !!localStorage.getItem("token"));
    console.log("- Base URL:", apiService.baseURL);
    
    // Redirigir a docente.html después de un error
    setTimeout(() => {
      window.location.href = "docente.html";
    }, 2000);
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

function mostrarInfoEstudiante(studentData, projectInfo) {
  const container = document.getElementById("info-estudiante");
  if (!container) return;
  
  container.innerHTML = `
    <div class="student-info-card" style="background: var(--card-bg, #f8f9fa); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <h3 style="margin: 0 0 10px 0; color: var(--text-color, #2c3e50);">👨‍🎓 Información del Estudiante</h3>
      <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${studentData.correo || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>📁 Proyecto:</strong> ${projectInfo.name || projectInfo.nombre || 'N/A'}</p>
      <p style="margin: 5px 0;"><strong>📅 Creado:</strong> ${projectInfo.created_at ? new Date(projectInfo.created_at).toLocaleDateString('es-ES') : 'N/A'}</p>
      ${projectInfo.description ? `<p style="margin: 5px 0;"><strong>📝 Descripción:</strong> ${projectInfo.description}</p>` : ''}
    </div>
  `;
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

// Funciones de lazy loading
async function cargarComponenteLazy(componentName, proyectoId) {
  if (loadedComponents[componentName]) {
    console.log(`⏭️ Componente ${componentName} ya fue cargado`);
    return;
  }
  
  console.log(`🔄 Cargando componente: ${componentName}`);
  
  try {
    mostrarIndicadorCarga(componentName);
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

function getNombreComponente(componentName) {
  const nombres = {
    'summary': 'resumen',
    'metrics': 'métricas',
    'graph': 'grafo'
  };
  return nombres[componentName] || componentName;
}

async function reintentar(componentName) {
  const urlParams = new URLSearchParams(window.location.search);
  const proyectoId = urlParams.get('id');
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
                <span>⚡ ${m.consumo_energetico_kwh.toFixed(8)} kWh</span>
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

function mostrarSinResultados() {
  document.getElementById("codigo").textContent = "// No se detectaron archivos con vulnerabilidades.";
  document.getElementById("report-container").innerHTML = `
    <div class="no-results">
      <h3>✅ ¡Excelente!</h3>
      <p>No se detectaron vulnerabilidades de inyección SQL en este proyecto.</p>
      <p>El código parece estar seguro contra este tipo de ataques.</p>
    </div>
  `;
  
  const listaArchivos = document.getElementById("lista-archivos");
  if (listaArchivos) {
    listaArchivos.innerHTML = '<p>No hay archivos vulnerables que mostrar.</p>';
  }
}

// Función para regresar al panel de docente
function goBack() {
  console.log('🔙 Regresando a docente.html');
  window.location.href = 'docente.html';
}
