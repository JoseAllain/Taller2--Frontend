// Controlador del modo oscuro
class DarkModeController {
  constructor() {
    this.batteryThreshold = 20; // Umbral de batería en porcentaje
    this.autoDarkModeEnabled = localStorage.getItem('autoDarkMode') !== 'false'; // Habilitado por defecto
    this.init();
  }

  init() {
    // Cargar el tema guardado o usar el tema claro por defecto
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    
    // Inicializar monitoreo de batería
    this.initBatteryMonitoring();
    
    // Crear el botón de alternancia
    this.createToggleButton();
  }

  async initBatteryMonitoring() {
    // Verificar si la API de Battery está disponible
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        
        // Verificar batería al inicio
        this.checkBatteryLevel(battery);
        
        // Escuchar cambios en el nivel de batería
        battery.addEventListener('levelchange', () => {
          this.checkBatteryLevel(battery);
        });
        
        // Escuchar cambios en el estado de carga
        battery.addEventListener('chargingchange', () => {
          this.checkBatteryLevel(battery);
        });
        
        console.log('✅ Monitoreo de batería activado');
      } catch (error) {
        console.log('ℹ️ API de batería no disponible:', error.message);
      }
    } else {
      console.log('ℹ️ Este dispositivo no soporta la API de batería');
    }
  }

  checkBatteryLevel(battery) {
    if (!this.autoDarkModeEnabled) {
      return;
    }

    const batteryLevel = battery.level * 100; // Convertir a porcentaje
    const isCharging = battery.charging;
    
    // Si la batería está baja y no está cargando, activar modo oscuro
    if (batteryLevel <= this.batteryThreshold && !isCharging) {
      const currentTheme = this.getCurrentTheme();
      if (currentTheme !== 'dark') {
        console.log(`🔋 Batería baja (${batteryLevel.toFixed(0)}%) - Activando modo oscuro automáticamente`);
        this.setTheme('dark', true); // true indica que fue automático
        this.showBatteryNotification(batteryLevel);
      }
    }
  }

  showBatteryNotification(batteryLevel) {
    // Crear una notificación temporal
    const notification = document.createElement('div');
    notification.className = 'battery-notification';
    notification.innerHTML = `
      🔋 Modo oscuro activado (Batería: ${batteryLevel.toFixed(0)}%)
      <button class="notification-close">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Añadir estilos si no existen
    if (!document.querySelector('#battery-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'battery-notification-styles';
      style.textContent = `
        .battery-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: var(--notification-bg, #333);
          color: var(--notification-text, #fff);
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          display: flex;
          align-items: center;
          gap: 15px;
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .notification-close {
          background: transparent;
          border: none;
          color: inherit;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        
        .notification-close:hover {
          opacity: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Cerrar notificación al hacer clic en la X
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  createToggleButton() {
    // Verificar si ya existe el botón para evitar duplicados
    if (document.querySelector('.dark-mode-toggle')) {
      return;
    }

    const toggleButton = document.createElement('button');
    toggleButton.className = 'dark-mode-toggle';
    toggleButton.innerHTML = '🌙';
    toggleButton.title = 'Alternar modo oscuro';
    
    toggleButton.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Añadir el botón al body
    document.body.appendChild(toggleButton);
    
    // Actualizar el icono según el tema actual
    this.updateToggleIcon(toggleButton);
  }

  setTheme(theme, isAutomatic = false) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Solo guardar en localStorage si no fue un cambio automático
    // o si el usuario cambia manualmente después
    if (!isAutomatic) {
      localStorage.setItem('theme', theme);
    }
    
    // Actualizar el icono del botón si existe
    const toggleButton = document.querySelector('.dark-mode-toggle');
    if (toggleButton) {
      this.updateToggleIcon(toggleButton);
    }
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  updateToggleIcon(button) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    button.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
    button.title = currentTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }

  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme');
  }
}

// Inicializar el controlador cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new DarkModeController();
});

// También inicializar inmediatamente si el DOM ya está listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DarkModeController();
  });
} else {
  new DarkModeController();
}