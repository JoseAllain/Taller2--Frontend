// Controlador del modo oscuro
class DarkModeController {
  constructor() {
    this.init();
  }

  init() {
    // Cargar el tema guardado o usar el tema claro por defecto
    const savedTheme = localStorage.getItem('theme') || 'light';
    this.setTheme(savedTheme);
    
    // Crear el botón de alternancia
    this.createToggleButton();
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

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
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