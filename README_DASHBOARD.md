# 📊 Dashboard Administrativo de Métricas - BlackQuery

## Descripción

Panel de control completo con visualizaciones gráficas de métricas clave del sistema para administradores. Proporciona una vista unificada de todas las estadísticas importantes en tiempo real.

## Características

### 📈 Métricas Visualizadas

1. **Usuarios Activos** - Usuarios conectados en las últimas 24 horas
2. **Total de Proyectos** - Con desglose de analizados vs sin analizar
3. **Vulnerabilidades Detectadas** - Total y distribución por severidad
4. **Tiempo Promedio de Análisis** - Estadísticas de rendimiento
5. **Tamaño de Archivos** - Uso de almacenamiento del sistema
6. **Costos del Sistema** - Basados en tiempo de procesamiento

### 📊 Gráficos Interactivos

- **Distribución de Usuarios por Rol** (Doughnut Chart)
- **Estado de Proyectos** (Bar Chart)
- **Vulnerabilidades por Severidad** (Pie Chart)
- **Estadísticas de Análisis** (Bar Chart)
- **Tamaño de Archivos** (Doughnut Chart)
- **Salud del Sistema** (Bar Chart)
- **Top 5 Vulnerabilidades Más Comunes** (Horizontal Bar Chart)

### 🎨 Características Adicionales

- ✨ Modo Oscuro compatible
- 🔄 Actualización en tiempo real
- 📱 Diseño responsivo
- 🎯 Animaciones suaves
- 💾 Optimización de rendimiento

## Acceso

### Requisitos

- Rol de **Administrador**
- Sesión activa en el sistema

### Cómo Acceder

1. Iniciar sesión como administrador en `index.html`
2. Navegar al panel administrativo (`admin.html`)
3. Hacer clic en el botón "📊 Dashboard Métricas" en la barra de navegación
4. O acceder directamente a `dashboard-admin.html`

## Estructura de Archivos

```
frontend/
├── dashboard-admin.html          # Página principal del dashboard
├── css/
│   └── dashboard-admin.css       # Estilos personalizados
└── js/
    ├── dashboard-admin.js        # Lógica y gráficos
    └── api-service.js            # Cliente API (actualizado)
```

## Backend - Endpoints Utilizados

### Endpoint Principal

```http
GET /api/v1/admin/metrics
```

**Respuesta:**

```json
{
  "status": "success",
  "data": {
    "usuarios": {
      "activos_24h": 15,
      "por_rol": {
        "estudiantes": 50,
        "docentes": 5,
        "administradores": 2,
        "total": 57
      },
      "registrados_hoy": 3
    },
    "proyectos": {
      "total": 120,
      "recientes_7_dias": 25,
      "analizados": 95,
      "sin_analizar": 25
    },
    "archivos": {
      "total_archivos": 450,
      "tamano_total_mb": 125.5,
      "tamano_promedio_kb": 285.6,
      "tamano_maximo_mb": 5.2
    },
    "analisis": {
      "total_analisis": 95,
      "tiempo_promedio_segundos": 12.5,
      "tiempo_total_minutos": 19.8,
      "tiempo_minimo_segundos": 2.1,
      "tiempo_maximo_segundos": 45.3
    },
    "vulnerabilidades": {
      "total": 234,
      "proyectos_con_vulnerabilidades": 78,
      "por_severidad": {
        "ALTO": 45,
        "MEDIO": 120,
        "BAJO": 69
      },
      "tipos_mas_comunes": [
        {"tipo": "SQL Injection", "cantidad": 89},
        {"tipo": "Blind SQL Injection", "cantidad": 67}
      ]
    },
    "costos": {
      "costo_total": 0.000627,
      "costo_promedio_por_analisis": 0.0000066
    },
    "salud_sistema": {
      "usuarios": {
        "total": 57,
        "activos": 54,
        "inactivos": 3,
        "porcentaje_activos": 94.74
      },
      "analisis_completados": 95,
      "proyectos_activos_ultimo_mes": 38
    },
    "actividad_reciente": [...],
    "timestamp": "2025-11-23T10:30:00"
  }
}
```

### Endpoints Adicionales

```http
GET /api/v1/admin/metrics/users?hours=24
GET /api/v1/admin/metrics/projects
GET /api/v1/admin/metrics/analysis
GET /api/v1/admin/metrics/vulnerabilities
GET /api/v1/admin/metrics/health
GET /api/v1/admin/metrics/activity?limit=10
```

## Uso

### Actualizar Métricas

Haz clic en el botón "🔄 Actualizar" en la esquina superior derecha para recargar todas las métricas del sistema.

### Navegación

- **Volver a Admin**: Botón "← Volver a Admin" para regresar al panel administrativo principal
- **Modo Oscuro**: Toggle en la barra de navegación

### Interpretación de Métricas

#### Tarjetas de Métricas

- **Color Azul**: Información de usuarios
- **Color Verde**: Datos de proyectos
- **Color Naranja**: Vulnerabilidades
- **Color Morado**: Tiempos de análisis
- **Color Rojo**: Almacenamiento
- **Color Teal**: Costos

#### Actividad Reciente

- ✅ **Analizado**: Proyecto con análisis completado
- ⏳ **Pendiente**: Proyecto sin analizar

## Tecnologías

- **HTML5**: Estructura
- **CSS3**: Estilos y animaciones
- **JavaScript ES6+**: Lógica
- **Chart.js 4.4.0**: Visualizaciones gráficas
- **FastAPI**: Backend API
- **SQLAlchemy**: Consultas a base de datos

## Características de Rendimiento

- ⚡ Carga asíncrona de datos
- 🎯 Renderizado optimizado de gráficos
- 📊 Actualización eficiente sin recargar página
- 💾 Caché de instancias de gráficos
- 🔄 Estados de loading/error/success

## Modo Oscuro

El dashboard incluye soporte completo para modo oscuro que:

- Se sincroniza con la preferencia del sistema
- Actualiza automáticamente los colores de los gráficos
- Mantiene la legibilidad en todos los componentes

## Resolución de Problemas

### Error "Acceso Denegado"

**Causa**: El usuario no tiene rol de administrador
**Solución**: Contactar a un administrador para cambiar el rol

### Métricas no cargan

**Causa**: Backend no disponible o token expirado
**Solución**:

1. Verificar que el backend esté corriendo
2. Cerrar sesión y volver a iniciar sesión
3. Verificar consola del navegador para errores

### Gráficos no se muestran

**Causa**: Chart.js no cargó correctamente
**Solución**: Verificar conexión a internet y recargar la página

## Desarrollo

### Agregar Nueva Métrica

1. **Backend**: Agregar cálculo en `admin_metrics_service.py`
2. **Frontend**: Actualizar `renderMetricCards()` en `dashboard-admin.js`
3. **Gráfico**: Crear función `renderNuevoChart()` y llamarla en `renderCharts()`

### Personalizar Gráficos

Los gráficos se pueden personalizar modificando las opciones de Chart.js en cada función `render*Chart()`:

```javascript
chartsInstances['myChart'] = new Chart(ctx, {
    type: 'bar', // pie, doughnut, line, etc.
    data: {...},
    options: {
        // Personalización aquí
    }
});
```

## Contribuciones

Para agregar nuevas métricas o mejorar el dashboard:

1. Crear nueva función en el servicio backend
2. Agregar endpoint en `admin_metrics.py`
3. Actualizar `api-service.js` con el nuevo método
4. Implementar visualización en `dashboard-admin.js`

## Licencia

Proyecto académico - Universidad

## Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0.0
