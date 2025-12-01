// principal.js

// ===== FUNCIONES DE UTILIDAD =====
// Función para mostrar alertas de seguridad formateadas
function showSecurityAlert(details) {
  // Detectar tema actual
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Crear modal personalizado
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: ${isDarkMode ? '#1e1e1e' : 'white'};
    padding: 30px;
    border-radius: 15px;
    max-width: 600px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
    color: ${isDarkMode ? '#e0e0e0' : '#333'};
  `;

  // Función auxiliar para obtener icono y color según tipo de amenaza
  function getThreatInfo(type) {
    const threats = {
      'binary_executable': {
        icon: '💀',
        title: 'Archivo Ejecutable Binario',
        color: '#dc3545',
        bgColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : '#ffe6e6'
      },
      'suspected_binary': {
        icon: '🔍',
        title: 'Binario Sospechoso',
        color: '#fd7e14',
        bgColor: isDarkMode ? 'rgba(253, 126, 20, 0.15)' : '#fff3e6'
      },
      'deep_path': {
        icon: '💣',
        title: 'Posible ZIP Bomb',
        color: '#dc3545',
        bgColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : '#ffe6e6'
      },
      'suspicious_system_file': {
        icon: '⚠️',
        title: 'Archivo de Sistema Sospechoso',
        color: '#ffc107',
        bgColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#fff3cd'
      },
      'unreadable_file': {
        icon: '❌',
        title: 'Archivo No Legible',
        color: '#dc3545',
        bgColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : '#ffe6e6'
      },
      'scan_error': {
        icon: '🔥',
        title: 'Error de Escaneo',
        color: '#dc3545',
        bgColor: isDarkMode ? 'rgba(220, 53, 69, 0.15)' : '#ffe6e6'
      }
    };
    
    return threats[type] || {
      icon: '⚠️',
      title: 'Amenaza de Seguridad',
      color: '#ffc107',
      bgColor: isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#fff3cd'
    };
  }

  // Parsear las amenazas desde el mensaje de detalles
  let threatsHTML = '';
  
  try {
    // Intentar parsear si es JSON
    const threats = typeof details === 'string' ? JSON.parse(details) : details;
    
    if (Array.isArray(threats)) {
      // Múltiples amenazas
      threatsHTML = threats.map(threat => {
        const info = getThreatInfo(threat.type);
        return `
          <div style="
            background: ${info.bgColor};
            border-left: 4px solid ${info.color};
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;
            ">
              <span style="font-size: 24px;">${info.icon}</span>
              <div style="
                font-weight: 700;
                font-size: 1.1rem;
                color: ${info.color};
              ">
                ${info.title}
              </div>
            </div>
            <div style="
              color: ${isDarkMode ? '#e0e0e0' : '#666'};
              line-height: 1.6;
              font-size: 0.9rem;
              margin-left: 34px;
            ">
              <strong>Archivo:</strong> ${threat.file || 'Desconocido'}<br>
              ${threat.extension ? `<strong>Extensión:</strong> ${threat.extension}<br>` : ''}
              <strong>Razón:</strong> ${threat.reason || 'No especificada'}
            </div>
          </div>
        `;
      }).join('');
    } else {
      // Una sola amenaza
      const info = getThreatInfo(threats.type);
      threatsHTML = `
        <div style="
          background: ${info.bgColor};
          border-left: 4px solid ${info.color};
          padding: 15px;
          border-radius: 8px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
          ">
            <span style="font-size: 24px;">${info.icon}</span>
            <div style="
              font-weight: 700;
              font-size: 1.1rem;
              color: ${info.color};
            ">
              ${info.title}
            </div>
          </div>
          <div style="
            color: ${isDarkMode ? '#e0e0e0' : '#666'};
            line-height: 1.6;
            font-size: 0.9rem;
            margin-left: 34px;
          ">
            <strong>Archivo:</strong> ${threats.file || 'Desconocido'}<br>
            ${threats.extension ? `<strong>Extensión:</strong> ${threats.extension}<br>` : ''}
            <strong>Razón:</strong> ${threats.reason || details}
          </div>
        </div>
      `;
    }
  } catch (e) {
    // Si no se puede parsear, mostrar mensaje genérico
    threatsHTML = `
      <div style="
        background: ${isDarkMode ? 'rgba(255, 193, 7, 0.15)' : '#fff3cd'};
        border-left: 4px solid #ffc107;
        padding: 15px;
        border-radius: 8px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        ">
          <span style="font-size: 24px;">⚠️</span>
          <div style="
            font-weight: 700;
            font-size: 1.1rem;
            color: ${isDarkMode ? '#ffc107' : '#856404'};
          ">
            Amenaza de Seguridad Detectada
          </div>
        </div>
        <div style="
          color: ${isDarkMode ? '#e0e0e0' : '#856404'};
          line-height: 1.6;
          font-size: 0.95rem;
          margin-left: 34px;
        ">
          ${details}
        </div>
      </div>
    `;
  }

  modalContent.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 50px; margin-bottom: 10px;">🛡️</div>
      <h2 style="color: #dc3545; margin: 0; font-size: 1.5rem;">Archivo Rechazado por Seguridad</h2>
      <p style="color: ${isDarkMode ? '#999' : '#666'}; margin-top: 8px; font-size: 0.9rem;">
        Se detectaron amenazas potenciales en el archivo
      </p>
    </div>
    
    ${threatsHTML}
    
    <button id="closeSecurityModal" style="
      width: 100%;
      padding: 12px;
      background: linear-gradient(45deg, #dc3545, #c82333);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 15px;
    ">
      Entendido
    </button>
  `;

  // Agregar estilos de animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideIn {
      from { transform: translateY(-50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    #closeSecurityModal:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
    }
  `;
  document.head.appendChild(style);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Cerrar modal al hacer clic en el botón
  document.getElementById('closeSecurityModal').addEventListener('click', () => {
    modal.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      modal.remove();
      style.remove();
    }, 300);
  });

  // Cerrar modal al hacer clic fuera del contenido
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        modal.remove();
        style.remove();
      }, 300);
    }
  });
}

// ===== VALIDACIÓN DE CONSENTIMIENTO =====
// Función para habilitar/deshabilitar el botón de subir según el checkbox
function toggleUploadButton() {
  const checkbox = document.getElementById('data-consent');
  const uploadBtn = document.getElementById('upload-btn');
  
  if (uploadBtn) {
    uploadBtn.disabled = !checkbox.checked;
    
    // Cambiar estilo visual cuando está deshabilitado
    if (checkbox.checked) {
      uploadBtn.style.opacity = '1';
      uploadBtn.style.cursor = 'pointer';
    } else {
      uploadBtn.style.opacity = '0.5';
      uploadBtn.style.cursor = 'not-allowed';
    }
  }
}

// Inicializar el estado del botón cuando carga la página
window.addEventListener('DOMContentLoaded', async () => {
  // Configurar botón de subida inicialmente deshabilitado
  const uploadBtn = document.getElementById('upload-btn');
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.style.opacity = '0.5';
    uploadBtn.style.cursor = 'not-allowed';
  }

  // Cargar navegación dinámica según el rol del usuario
  try {
    const userInfo = await apiService.getCurrentUser();
    loadDynamicNavigation(userInfo.role);
  } catch (error) {
    console.error("Error cargando información del usuario:", error);
  }
});

async function subirZip(event) {
  // Validar que el checkbox esté marcado
  const checkbox = document.getElementById('data-consent');
  if (!checkbox || !checkbox.checked) {
    alert("⚠️ Debes aceptar la Ley N°29733 de Protección de Datos Personales antes de subir tu proyecto.");
    return;
  }

  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];
  if (!archivo) return alert("Selecciona un archivo ZIP.");

  // Validar que sea un archivo ZIP
  if (!archivo.name.toLowerCase().endsWith('.zip')) {
    return alert("Por favor selecciona un archivo ZIP válido.");
  }

  // Mostrar indicador de carga
  const uploadBtn = event.target || document.querySelector('button[onclick="subirZip()"]') || document.getElementById('upload-btn');
  const originalText = uploadBtn.textContent;
  uploadBtn.textContent = "Subiendo...";
  uploadBtn.disabled = true;

  try {
    // Debug: Verificar token antes de subir
    const token = localStorage.getItem("token");
    console.log("🔑 Token disponible:", !!token);
    
    if (!token) {
      alert("No hay token de autenticación. Por favor, inicia sesión nuevamente.");
      window.location.href = "index.html";
      return;
    }
    
    // Verificar conectividad del backend primero
    console.log("🔍 Verificando conectividad del backend...");
    try {
      const healthCheck = await fetch("https://sqli-ecologico-backend.onrender.com/health");
      if (!healthCheck.ok) {
        throw new Error("El backend no está respondiendo.");
      }
      console.log("✅ Backend conectado correctamente");
    } catch (healthError) {
      throw new Error("El backend no está respondiendo. Verifica que esté ejecutándose en el puerto 8000.");
    }
    
    // Usar el nombre del archivo sin extensión como nombre del proyecto
    const nombreProyecto = archivo.name.replace('.zip', '');
    console.log("📁 Subiendo proyecto:", nombreProyecto);
    console.log("📁 Tamaño del archivo:", archivo.size, "bytes");
    
    // Paso 1: Subir el archivo
    uploadBtn.textContent = "Subiendo archivo...";
    const result = await apiService.uploadProject(nombreProyecto, archivo);
    console.log("✅ Respuesta completa del servidor:", result);
    
    // Verificar si hay alertas de seguridad (SRF3)
    if (result.error === "SRF3_SECURITY_VIOLATION") {
      console.log("🛡️ Detectado SRF3_SECURITY_VIOLATION, mostrando modal de seguridad");
      console.log("🛡️ Detalles de amenazas:", result.details);
      showSecurityAlert(result.details);
      uploadBtn.textContent = originalText;
      uploadBtn.disabled = !checkbox.checked;
      return;
    }
    
    // Verificar que se recibió un db_id válido
    if (!result.db_id) {
      console.error("❌ No se recibió db_id del servidor. Respuesta:", result);
      throw new Error("El servidor no devolvió un ID de proyecto válido");
    }
    
    const proyectoId = result.db_id;
    localStorage.setItem("proyecto_id", proyectoId);
    console.log("💾 Proyecto ID guardado:", proyectoId);
    
    // Paso 2: Ejecutar análisis automáticamente
    uploadBtn.textContent = "Analizando proyecto...";
    console.log("🔍 Iniciando análisis automático del proyecto...");
    
    try {
      const analysisResult = await apiService.analyzeProject(proyectoId);
      console.log("✅ Análisis completado:", analysisResult);
      
      // Verificar si el análisis fue exitoso
      if (analysisResult.project_id || analysisResult.vulnerabilities) {
        console.log("✅ Redirigiendo a reporte.html");
        alert("✅ Proyecto subido y analizado exitosamente.");
        
        window.location.href = "reporte.html";
      } else {
        // Si el análisis no fue exitoso, aún redirigir pero mostrar mensaje
        console.warn("⚠️ El análisis se completó con advertencias");
        alert("✅ Proyecto subido.");
        window.location.href = "reporte.html";
      }
      
    } catch (analysisError) {
      console.error("❌ Error en el análisis:", analysisError);
      console.error("❌ Stack trace del análisis:", analysisError.stack);
      // Aún así, redirigir al reporte para que el usuario pueda ver qué pasó
      alert("⚠️ Proyecto subido pero hubo un problema en el análisis. Revisa los resultados en el reporte.");
      window.location.href = "reporte.html";
    }
    
  } catch (error) {
    console.error("❌ Error detallado al subir archivo:", error);
    console.error("❌ Stack trace:", error.stack);
    
    let errorMessage = "Error desconocido";
    if (error.message.includes("Failed to fetch") || error.message.includes("fetch") || error.message.includes("backend no está respondiendo")) {
      errorMessage = "No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 8000.";
    } else if (error.message === "Sesión expirada") {
      errorMessage = "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 2000);
    } else {
      errorMessage = error.message;
    }
    
    alert("❌ Error al subir: " + errorMessage);
  } finally {
    // Restaurar botón solo si no hubo redirección
    if (uploadBtn && uploadBtn.textContent !== originalText) {
      uploadBtn.textContent = originalText;
      uploadBtn.disabled = !checkbox.checked;
    }
  }
}

document.querySelector('.file-select-btn').addEventListener('click', () => {
  document.querySelector('.file-input').click();
});

document.querySelector('.file-input').addEventListener('change', (event) => {
  const fileName = event.target.files[0] ? event.target.files[0].name : "Ningún archivo seleccionado";
  document.querySelector('#file-name').value = fileName;
});

// ===== NAVEGACIÓN DINÁMICA =====
function loadDynamicNavigation(userRole) {
  const navbar = document.querySelector('.navbar');
  
  // Crear estructura de navegación base
  const navLinksContainer = document.createElement('div');
  navLinksContainer.className = 'nav-links';
  navLinksContainer.style.cssText = `
    display: flex;
    gap: 15px;
    align-items: center;
    margin-left: auto;
    margin-right: 20px;
  `;
  
  // Enlaces comunes para todos los usuarios
  const commonLinks = [
    { href: 'principal.html', text: '🏠 Inicio', active: true },
    { href: 'panel.html', text: '📊 Mis Proyectos' },
    { href: 'privacy.html', text: '🔒 Privacidad' }
  ];
  
  // Enlaces específicos según el rol
  let roleSpecificLinks = [];
  
  if (userRole === 'administrador') {
    roleSpecificLinks = [
      { href: 'admin.html', text: '⚙️ Administración' }
    ];
  } else if (userRole === 'docente') {
    roleSpecificLinks = [
      { href: 'docente.html', text: '👨‍🏫 Panel Docente' },
      { href: 'admin.html', text: '⚙️ Gestión' }
    ];
  }
  
  // Combinar todos los enlaces
  const allLinks = [...commonLinks, ...roleSpecificLinks];
  
  // Crear enlaces de navegación
  allLinks.forEach(link => {
    const linkElement = document.createElement('a');
    linkElement.href = link.href;
    linkElement.textContent = link.text;
    linkElement.style.cssText = `
      color: white;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 4px;
      transition: background-color 0.3s;
      ${link.active ? 'background-color: rgba(255,255,255,0.2);' : ''}
    `;
    linkElement.addEventListener('mouseover', () => {
      if (!link.active) linkElement.style.backgroundColor = 'rgba(255,255,255,0.1)';
    });
    linkElement.addEventListener('mouseout', () => {
      if (!link.active) linkElement.style.backgroundColor = 'transparent';
    });
    navLinksContainer.appendChild(linkElement);
  });
  
  // Insertar navegación antes del botón de logout
  const logoutBtn = navbar.querySelector('.logout');
  navbar.insertBefore(navLinksContainer, logoutBtn);
}

// Función para mostrar la encuesta de feedback desde el navbar
function mostrarEncuestaFeedback() {
  if (typeof feedbackModule === 'undefined') {
    alert('El módulo de feedback no está disponible en este momento.');
    return;
  }
  
  // Obtener el ID del último proyecto analizado si existe
  const ultimoProyectoId = localStorage.getItem('proyecto_id') || null;
  
  // Mostrar la encuesta con tipo "general" para feedback del sistema
  feedbackModule.showFeedbackSurvey(ultimoProyectoId, null);
}
