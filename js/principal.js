// principal.js
const backendURL = "http://localhost:8000";

async function subirZip() {
  const archivoInput = document.getElementById("archivo");
  const archivo = archivoInput.files[0];
  if (!archivo) return alert("Selecciona un archivo ZIP.");

  const formData = new FormData();
  formData.append("file", archivo);

  try {
    const res = await fetch(`${backendURL}/upload/${archivo.name}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (res.status === 401) return redirigirLogin();
    if (!res.ok) throw new Error("Error al subir archivo");

    const json = await res.json();
    localStorage.setItem("proyecto_id", json.db_id);
    if (json.status?.startsWith("Estructura no válida")) return alert("Error de estructura: " + json.status);

    window.location.href = "reporte.html";
  } catch (error) {
    alert("Fallo al subir: " + error.message);
  }
}

document.querySelector('.file-select-btn').addEventListener('click', () => {
  document.querySelector('.file-input').click();
});

document.querySelector('.file-input').addEventListener('change', (event) => {
  const fileName = event.target.files[0] ? event.target.files[0].name : "Ningún archivo seleccionado";
  document.querySelector('#file-name').value = fileName;
});
