const token = localStorage.getItem("token");
if (!token) {
  alert("Sesión expirada. Por favor inicia sesión nuevamente.");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}

// Solo en reporte.html se necesita validar proyecto_id
if (location.pathname.endsWith("reporte.html")) {
  // Verificar si hay ID en la URL o en localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const proyectoIdFromUrl = urlParams.get('id');
  const proyectoIdFromStorage = localStorage.getItem("proyecto_id");
  
  // Si hay ID en la URL o en localStorage, está bien
  if (!proyectoIdFromUrl && !proyectoIdFromStorage) {
    alert("Debes subir un proyecto antes de ver el reporte.");
    
    // Redirigir según el rol del usuario
    apiService.getCurrentUser()
      .then(user => {
        if (user.rol === 'docente') {
          window.location.href = "docente.html";
        } else {
          window.location.href = "principal.html";
        }
      })
      .catch(() => {
        // Si falla, redirigir a principal por defecto
        window.location.href = "principal.html";
      });
  }
}

function redirigirLogin() {
  alert("Sesión expirada. Por favor inicia sesión nuevamente.");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}
