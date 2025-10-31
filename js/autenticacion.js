const token = localStorage.getItem("token");
if (!token) {
  alert("Sesión expirada. Por favor inicia sesión nuevamente.");
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}

// Solo en reporte.html se necesita validar proyecto_id
if (location.pathname.endsWith("reporte.html")) {
  const proyectoId = localStorage.getItem("proyecto_id");
  if (!proyectoId) {
    alert("Debes subir un proyecto antes de ver el reporte.");
    window.location.href = "principal.html";
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
