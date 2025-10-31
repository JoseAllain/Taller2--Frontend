const token = localStorage.getItem("token");
if (!token) {
  alert("Debes iniciar sesión");
  window.location.href = "index.html";
}

const backendURL = "http://localhost:8000";

window.onload = async () => {
  try {
    const res = await fetch(`${backendURL}/proyectos`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.status === 401) {
      alert("Sesión expirada");
      return window.location.href = "index.html";
    }

    if (!res.ok) throw new Error("Fallo al obtener proyectos");

    const proyectos = await res.json();
    const contenedor = document.getElementById("lista-proyectos");
    contenedor.innerHTML = "";

    if (proyectos.length === 0) {
      contenedor.innerHTML = "<p>No tienes proyectos registrados.</p>";
      return;
    }

    proyectos.forEach(p => {
    const item = document.createElement("li");
    item.className = "project-card";

    item.innerHTML = `
        <div class="project-info">
        <h3>${p.nombre}</h3>
        <p>📅 Subido el ${new Date(p.fecha).toLocaleDateString()}</p>
        </div>
        <button class="btn-ver" onclick="verProyecto(${p.id})">Ver reporte</button>
    `;

    contenedor.appendChild(item);
    });


  } catch (error) {
    console.error(error);
    alert("Error al cargar proyectos");
  }
};

function verProyecto(id) {
  localStorage.setItem("proyecto_id", id);
  window.location.href = "reporte.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user_id");
  window.location.href = "index.html";
}
