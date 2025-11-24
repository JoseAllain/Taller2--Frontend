// dashboard-admin.js - Gestión del dashboard administrativo con métricas y gráficos

let chartsInstances = {};
let metricsData = null;
let currentUserRole = null; // Almacenar el rol del usuario actual

// Función para redirigir a la página de inicio según el rol
function goToHomePage() {
    if (currentUserRole === 'administrador') {
        window.location.href = 'admin.html';
    } else if (currentUserRole === 'docente') {
        window.location.href = 'docente.html';
    } else {
        window.location.href = 'panel.html';
    }
}

// Función para obtener colores según el tema
function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    return {
        textColor: isDark ? '#ecf0f1' : '#333',
        gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        tooltipBg: isDark ? '#34495e' : 'rgba(0, 0, 0, 0.8)',
        tooltipText: isDark ? '#ecf0f1' : '#fff'
    };
}

// Observar cambios en el tema y actualizar gráficos
const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
            if (metricsData) {
                renderCharts(metricsData.data);
            }
        }
    });
});

// Iniciar observador del tema
themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
});

// Verificar permisos y cargar datos al iniciar
window.onload = async () => {
    try {
        const userInfo = await apiService.getCurrentUser();
        
        // Almacenar el rol del usuario
        currentUserRole = userInfo.role;
        
        if (userInfo.role !== 'administrador' && userInfo.role !== 'docente') {
            alert("❌ Acceso denegado. Solo administradores y docentes pueden acceder al dashboard.");
            window.location.href = userInfo.role === 'docente' ? "docente.html" : "admin.html";
            return;
        }
        
        await loadAllMetrics();
        
    } catch (error) {
        console.error("Error inicializando dashboard:", error);
        if (error.message === "Sesión expirada") return;
        showError(error.message);
    }
};

// Cargar todas las métricas
async function loadAllMetrics() {
    try {
        showLoading();
        
        // Obtener métricas del backend
        metricsData = await apiService.getAdminMetrics();
        
        if (!metricsData || !metricsData.data) {
            throw new Error("No se recibieron datos del servidor");
        }
        
        // Actualizar timestamp
        updateTimestamp(metricsData.data.timestamp);
        
        // Renderizar todo
        renderMetricCards(metricsData.data);
        renderCharts(metricsData.data);
        renderRecentActivity(metricsData.data.actividad_reciente);
        
        showDashboard();
        
    } catch (error) {
        console.error("Error cargando métricas:", error);
        showError(error.message);
    }
}

// Mostrar loading
function showLoading() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
    
    // Animar el botón de refresh
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.display = 'inline-block';
        refreshIcon.style.animation = 'spin 1s linear infinite';
    }
}

// Mostrar dashboard
function showDashboard() {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    document.getElementById('error-state').style.display = 'none';
    
    // Detener animación del botón
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.animation = 'none';
    }
}

// Mostrar error
function showError(message) {
    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'block';
    document.getElementById('error-message').textContent = message;
    
    // Detener animación del botón
    const refreshIcon = document.getElementById('refresh-icon');
    if (refreshIcon) {
        refreshIcon.style.animation = 'none';
    }
}

// Actualizar timestamp
function updateTimestamp(timestamp) {
    const date = new Date(timestamp);
    const formattedDate = date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('last-update').textContent = `Última actualización: ${formattedDate}`;
}

// Renderizar tarjetas de métricas
function renderMetricCards(data) {
    const container = document.getElementById('metrics-grid');
    
    const cards = [
        {
            icon: '👥',
            value: data.usuarios.activos_24h,
            label: 'Usuarios Activos',
            sublabel: 'Últimas 24 horas',
            color: 'blue'
        },
        {
            icon: '📁',
            value: data.proyectos.total,
            label: 'Total Proyectos',
            sublabel: `${data.proyectos.analizados} analizados`,
            color: 'green'
        },
        {
            icon: '🔒',
            value: data.vulnerabilidades.total,
            label: 'Vulnerabilidades',
            sublabel: `${data.vulnerabilidades.proyectos_con_vulnerabilidades} proyectos afectados`,
            color: 'orange'
        },
        {
            icon: '⏱️',
            value: `${data.analisis.tiempo_promedio_segundos}s`,
            label: 'Tiempo Promedio',
            sublabel: `${data.analisis.total_analisis} análisis realizados`,
            color: 'purple'
        },
        {
            icon: '⚡',
            value: `${data.energia.consumo_total_kwh.toFixed(8)} kWh`,
            label: 'Consumo Energético Total',
            sublabel: `${data.energia.consumo_promedio_por_analisis_kwh.toFixed(8)} kWh promedio`,
            color: 'teal'
        }
    ];
    
    container.innerHTML = cards.map(card => `
        <div class="metric-card ${card.color}">
            <div class="icon">${card.icon}</div>
            <div class="value">${card.value}</div>
            <div class="label">${card.label}</div>
            <div class="sublabel">${card.sublabel}</div>
        </div>
    `).join('');
}

// Renderizar todos los gráficos
function renderCharts(data) {
    renderUsersRoleChart(data.usuarios);
    renderProjectsChart(data.proyectos);
    renderVulnerabilitiesChart(data.vulnerabilidades);
    renderAnalysisTimeChart(data.analisis);
    renderFilesChart(data.archivos);
    renderSystemHealthChart(data.salud_sistema);
}

// Gráfico de usuarios por rol (o activos/inactivos para docentes)
function renderUsersRoleChart(usuarios) {
    const ctx = document.getElementById('usersRoleChart');
    const titleElement = document.getElementById('users-chart-title');
    const colors = getChartColors();
    
    if (chartsInstances['usersRoleChart']) {
        chartsInstances['usersRoleChart'].destroy();
    }
    
    // Si es docente, mostrar gráfico de activos vs inactivos
    if (currentUserRole === 'docente') {
        // Cambiar título del gráfico
        if (titleElement) {
            titleElement.textContent = '👥 Estudiantes Activos vs Inactivos';
        }
        
        const totalEstudiantes = usuarios.por_rol.estudiantes;
        const activos = usuarios.activos_24h;
        const inactivos = totalEstudiantes - activos;
        
        chartsInstances['usersRoleChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Estudiantes Activos (24h)', 'Estudiantes Inactivos'],
                datasets: [{
                    data: [activos, inactivos],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(201, 203, 207, 0.8)'
                    ],
                    borderColor: [
                        'rgba(75, 192, 192, 1)',
                        'rgba(201, 203, 207, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Si es administrador, mostrar distribución por rol
        if (titleElement) {
            titleElement.textContent = '👥 Distribución de Usuarios por Rol';
        }
        
        chartsInstances['usersRoleChart'] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Estudiantes', 'Docentes', 'Administradores'],
                datasets: [{
                    data: [
                        usuarios.por_rol.estudiantes,
                        usuarios.por_rol.docentes,
                        usuarios.por_rol.administradores
                    ],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(255, 99, 132, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colors.textColor,
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Gráfico de proyectos
function renderProjectsChart(proyectos) {
    const ctx = document.getElementById('projectsChart');
    const colors = getChartColors();
    
    if (chartsInstances['projectsChart']) {
        chartsInstances['projectsChart'].destroy();
    }
    
    chartsInstances['projectsChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total', 'Analizados', 'Sin Analizar', 'Recientes (7 días)'],
            datasets: [{
                label: 'Proyectos',
                data: [
                    proyectos.total,
                    proyectos.analizados,
                    proyectos.sin_analizar,
                    proyectos.recientes_7_dias
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText
                }
            }
        }
    });
}

// Gráfico de vulnerabilidades por severidad
function renderVulnerabilitiesChart(vulnerabilidades) {
    const ctx = document.getElementById('vulnerabilitiesChart');
    const colors = getChartColors();
    
    if (chartsInstances['vulnerabilitiesChart']) {
        chartsInstances['vulnerabilitiesChart'].destroy();
    }
    
    const severityData = vulnerabilidades.por_severidad || {};
    
    chartsInstances['vulnerabilitiesChart'] = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(severityData),
            datasets: [{
                data: Object.values(severityData),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.textColor,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value} vulnerabilidades`;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de tiempos de análisis
function renderAnalysisTimeChart(analisis) {
    const ctx = document.getElementById('analysisTimeChart');
    const colors = getChartColors();
    
    if (chartsInstances['analysisTimeChart']) {
        chartsInstances['analysisTimeChart'].destroy();
    }
    
    chartsInstances['analysisTimeChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Promedio', 'Mínimo', 'Máximo'],
            datasets: [{
                label: 'Tiempo (segundos)',
                data: [
                    analisis.tiempo_promedio_segundos,
                    analisis.tiempo_minimo_segundos,
                    analisis.tiempo_maximo_segundos
                ],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textColor,
                        callback: function(value) {
                            return value + 's';
                        }
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText
                }
            }
        }
    });
}

// Gráfico de archivos
function renderFilesChart(archivos) {
    const ctx = document.getElementById('filesChart');
    const colors = getChartColors();
    
    if (chartsInstances['filesChart']) {
        chartsInstances['filesChart'].destroy();
    }
    
    chartsInstances['filesChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Tamaño Total (MB)', 'Promedio por Archivo (KB)'],
            datasets: [{
                data: [
                    archivos.tamano_total_mb,
                    archivos.tamano_promedio_kb / 1000 // Convertir a MB para visualización proporcional
                ],
                backgroundColor: [
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)'
                ],
                borderColor: [
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.textColor,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            if (label.includes('Total')) {
                                return `Total: ${value.toFixed(2)} MB`;
                            } else {
                                return `Promedio: ${(value * 1000).toFixed(2)} KB`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// Gráfico de salud del sistema
function renderSystemHealthChart(salud) {
    const ctx = document.getElementById('systemHealthChart');
    const colors = getChartColors();
    
    if (chartsInstances['systemHealthChart']) {
        chartsInstances['systemHealthChart'].destroy();
    }
    
    chartsInstances['systemHealthChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Usuarios Activos', 'Usuarios Inactivos', 'Análisis Completados'],
            datasets: [{
                label: 'Cantidad',
                data: [
                    salud.usuarios.activos,
                    salud.usuarios.inactivos,
                    salud.analisis_completados
                ],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colors.tooltipBg,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText
                }
            }
        }
    });
}

// Gráfico de top vulnerabilidades
function renderTopVulnerabilitiesChart(vulnerabilidades) {
    const ctx = document.getElementById('topVulnerabilitiesChart');
    
    if (chartsInstances['topVulnerabilitiesChart']) {
        chartsInstances['topVulnerabilitiesChart'].destroy();
    }
    
    const topTypes = vulnerabilidades.tipos_mas_comunes || [];
    
    if (topTypes.length === 0) {
        ctx.parentElement.innerHTML = '<p style="text-align: center; padding: 50px;">No hay datos de vulnerabilidades</p>';
        return;
    }
    
    chartsInstances['topVulnerabilitiesChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topTypes.map(v => v.tipo),
            datasets: [{
                label: 'Cantidad de Vulnerabilidades',
                data: topTypes.map(v => v.cantidad),
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color') || '#333'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color') || '#333'
                    },
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Renderizar actividad reciente
function renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">No hay actividad reciente</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const date = new Date(activity.fecha);
        const formattedDate = date.toLocaleString('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const statusIcon = activity.analizado ? '✅' : '⏳';
        const statusText = activity.analizado ? 'Analizado' : 'Pendiente';
        
        return `
            <div class="activity-item">
                <div class="time">${formattedDate}</div>
                <div class="description">
                    <strong>${activity.proyecto_nombre}</strong> - 
                    ${activity.usuario_email} 
                    <span style="margin-left: 10px;">${statusIcon} ${statusText}</span>
                </div>
            </div>
        `;
    }).join('');
}

