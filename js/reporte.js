// reporte.js
const backendURL = "http://localhost:8000";
let resultadosProyecto = {};

window.onload = async () => {
  const proyectoId = localStorage.getItem("proyecto_id");
  const token = localStorage.getItem("token");
  console.log("Proyecto cargado:", proyectoId);

  try {
    const resContent = await fetch(`${backendURL}/analysis/${proyectoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const res = await fetch(`${backendURL}/analysis/${proyectoId}/results`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok || !resContent.ok) return redirigirLogin();

    const data = await res.json();
    resultadosProyecto = transformarResultados(data);
    console.log("Resultados transformados:", resultadosProyecto);
    const archivos = Object.keys(resultadosProyecto);
    /* if (!archivos.length) return mostrarSinResultados(); */

    mostrarArchivos(archivos);
    cargarDetalles(archivos[0]);

    /* await mostrarHeatmap();  
    await mostrarGrafo();   */ 

  } catch (err) {
    console.error("Error al cargar resultados:", err.message);
    redirigirLogin();
  }
};

function transformarResultados(data) {
  const resultados = {};

  data.vulnerable_files.forEach(file => {
    resultados[file.filename] = {
      codigo: file.file_content,
      vulnerabilidades: file.vulnerabilities.map(v => ({
        linea: v.line,
        codigo: v.vulnerable_fragment,
        detalles: [
          `Predicción: ${v.prediction}`,
          `Fecha detección: ${new Date(v.created_at).toLocaleString()}`
        ]
      }))
    };
  });

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

function mostrarSinResultados() {
    const contenedor = document.getElementById("report-container");
    contenedor.innerHTML = `
        <div class="alert alert-warning" style="text-align:center; padding: 10px; border: 1px solid #f0ad4e; background-color: #fcf8e3; color: #8a6d3b;">
            No se encontraron vulnerabilidades en este proyecto.
        </div>
    `;
}

