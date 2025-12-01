// Módulo de retroalimentación rápida
class FeedbackModule {
  constructor() {
    this.apiBaseUrl = 'https://sqli-ecologico-backend.onrender.com/api/v1'; // Ajustar según tu configuración
    this.currentProjectId = null;
    this.feedbackShown = false;
  }

  /**
   * Mostrar encuesta de retroalimentación después de un análisis
   * @param {number} projectId - ID del proyecto analizado
   * @param {number} analysisTime - Tiempo que tomó el análisis en segundos
   */
  showFeedbackSurvey(projectId, analysisTime = null) {
    // Evitar mostrar múltiples encuestas
    if (this.feedbackShown) {
      return;
    }

    this.currentProjectId = projectId;
    this.feedbackShown = true;

    // Crear el modal de retroalimentación
    const modal = this.createFeedbackModal(analysisTime);
    document.body.appendChild(modal);

    // Mostrar modal con animación
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);
  }

  createFeedbackModal(analysisTime) {
    const modal = document.createElement('div');
    modal.className = 'feedback-modal';
    modal.id = 'feedbackModal';

    const timeInfo = analysisTime 
      ? `<p class="analysis-time">⏱️ Tiempo de análisis: <strong>${analysisTime}s</strong></p>` 
      : '';

    modal.innerHTML = `
      <div class="feedback-content">
        <button class="feedback-close" onclick="feedbackModule.closeFeedback()">&times;</button>
        
        <h3>📊 ¡Tu opinión es importante!</h3>
        ${timeInfo}
        
        <div class="feedback-form">
          <!-- Pregunta sobre rapidez del análisis -->
          <div class="feedback-question">
            <label>¿El análisis fue rápido?</label>
            <div class="star-rating" data-type="analysis_speed">
              ${this.createStarRating()}
            </div>
          </div>

          <!-- Pregunta sobre precisión -->
          <div class="feedback-question">
            <label>¿Qué tan preciso fue el análisis?</label>
            <div class="star-rating" data-type="accuracy">
              ${this.createStarRating()}
            </div>
          </div>

          <!-- Pregunta sobre usabilidad -->
          <div class="feedback-question">
            <label>¿Fue fácil de usar?</label>
            <div class="star-rating" data-type="usability">
              ${this.createStarRating()}
            </div>
          </div>

          <!-- Comentario opcional -->
          <div class="feedback-question">
            <label>Comentarios adicionales (opcional)</label>
            <textarea 
              id="feedbackComment" 
              placeholder="Cuéntanos tu experiencia..." 
              maxlength="1000"
              rows="3"
            ></textarea>
          </div>

          <div class="feedback-actions">
            <button class="btn-secondary" onclick="feedbackModule.closeFeedback()">
              Omitir
            </button>
            <button class="btn-primary" onclick="feedbackModule.submitFeedback()">
              Enviar retroalimentación
            </button>
          </div>
        </div>
      </div>
    `;

    // Agregar event listeners para las estrellas
    modal.querySelectorAll('.star-rating').forEach(ratingDiv => {
      const stars = ratingDiv.querySelectorAll('.star');
      stars.forEach((star, index) => {
        star.addEventListener('click', () => {
          this.selectRating(ratingDiv, index + 1);
        });
        
        star.addEventListener('mouseenter', () => {
          this.highlightStars(ratingDiv, index + 1);
        });
      });

      ratingDiv.addEventListener('mouseleave', () => {
        const selectedRating = ratingDiv.getAttribute('data-rating') || 0;
        this.highlightStars(ratingDiv, selectedRating);
      });
    });

    this.addFeedbackStyles();
    return modal;
  }

  createStarRating() {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<span class="star" data-value="${i}">★</span>`;
    }
    return stars;
  }

  selectRating(ratingDiv, rating) {
    ratingDiv.setAttribute('data-rating', rating);
    this.highlightStars(ratingDiv, rating);
  }

  highlightStars(ratingDiv, rating) {
    const stars = ratingDiv.querySelectorAll('.star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('selected');
      } else {
        star.classList.remove('selected');
      }
    });
  }

  async submitFeedback() {
    try {
      const modal = document.getElementById('feedbackModal');
      const ratingDivs = modal.querySelectorAll('.star-rating');
      const comment = document.getElementById('feedbackComment').value;

      // Recopilar todas las calificaciones
      const feedbacks = [];
      let hasRating = false;

      ratingDivs.forEach(ratingDiv => {
        const rating = parseInt(ratingDiv.getAttribute('data-rating') || '0');
        if (rating > 0) {
          hasRating = true;
          const type = ratingDiv.getAttribute('data-type');
          feedbacks.push({
            tipo_feedback: type,
            calificacion: rating,
            proyecto_id: this.currentProjectId,
            comentario: comment || null
          });
        }
      });

      // Validar que al menos una calificación fue dada
      if (!hasRating) {
        this.showNotification('Por favor, califica al menos un aspecto', 'warning');
        return;
      }

      // Obtener token de autenticación (intentar ambos nombres)
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      
      console.log('🔍 Debug Feedback - Token encontrado:', !!token);
      console.log('🔍 Debug Feedback - Token (primeros 20 caracteres):', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      if (!token) {
        console.error('❌ No se encontró token de autenticación');
        this.showNotification('Debes iniciar sesión para enviar retroalimentación', 'error');
        this.closeFeedback();
        return;
      }

      // Enviar cada feedback al backend
      console.log('📤 Enviando', feedbacks.length, 'feedbacks al servidor...');
      const promises = feedbacks.map(feedback => {
        console.log('📊 Feedback a enviar:', feedback);
        return fetch(`${this.apiBaseUrl}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(feedback)
        });
      });

      const results = await Promise.all(promises);
      
      // Verificar que todas las peticiones fueron exitosas
      const allSuccess = results.every(r => r.ok);
      
      // Log de resultados
      console.log('📥 Resultados de envío:', results.map(r => ({ ok: r.ok, status: r.status })));

      if (allSuccess) {
        this.showNotification('¡Gracias por tu retroalimentación! 🎉', 'success');
        this.closeFeedback();
      } else {
        // Obtener detalles del error
        const errorDetails = await Promise.all(
          results.map(async (r) => {
            if (!r.ok) {
              const errorText = await r.text();
              console.error('❌ Error en respuesta:', r.status, errorText);
              return { status: r.status, error: errorText };
            }
            return null;
          })
        );
        console.error('❌ Errores detallados:', errorDetails.filter(e => e));
        throw new Error('Algunas retroalimentaciones no pudieron ser enviadas');
      }

    } catch (error) {
      console.error('❌ Error al enviar retroalimentación:', error);
      this.showNotification('Error al enviar retroalimentación. Inténtalo de nuevo.', 'error');
    }
  }

  closeFeedback() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
        this.feedbackShown = false;
      }, 300);
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `feedback-notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  addFeedbackStyles() {
    if (document.getElementById('feedback-module-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'feedback-module-styles';
    style.textContent = `
      /* Modal de retroalimentación */
      .feedback-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .feedback-modal.show {
        opacity: 1;
      }

      .feedback-content {
        background: var(--bg-color, #fff);
        color: var(--text-color, #333);
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
        transform: translateY(-20px);
        transition: transform 0.3s ease;
      }

      .feedback-modal.show .feedback-content {
        transform: translateY(0);
      }

      .feedback-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: transparent;
        border: none;
        font-size: 28px;
        cursor: pointer;
        color: var(--text-color, #666);
        line-height: 1;
        padding: 0;
        width: 30px;
        height: 30px;
        transition: color 0.2s;
      }

      .feedback-close:hover {
        color: var(--danger-color, #e74c3c);
      }

      .feedback-content h3 {
        margin: 0 0 10px 0;
        color: var(--primary-color, #2563eb);
        font-size: 22px;
      }

      .analysis-time {
        margin: 10px 0 20px 0;
        padding: 10px;
        background: var(--info-bg, #e3f2fd);
        border-radius: 6px;
        font-size: 14px;
      }

      .feedback-question {
        margin-bottom: 25px;
      }

      .feedback-question label {
        display: block;
        margin-bottom: 10px;
        font-weight: 500;
        color: var(--text-color, #333);
      }

      .star-rating {
        display: flex;
        gap: 5px;
        font-size: 32px;
        cursor: pointer;
      }

      .star {
        color: #ddd;
        transition: color 0.2s, transform 0.2s;
        user-select: none;
      }

      .star:hover,
      .star.selected {
        color: #ffc107;
        transform: scale(1.1);
      }

      .feedback-question textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color, #ddd);
        border-radius: 6px;
        font-family: inherit;
        font-size: 14px;
        resize: vertical;
        background: var(--input-bg, #fff);
        color: var(--text-color, #333);
      }

      /* Dark Mode Support */
      [data-theme="dark"] .feedback-content {
        background: #2c3e50 !important;
        color: #ecf0f1 !important;
      }

      [data-theme="dark"] .feedback-content h3 {
        color: #3498db !important;
      }

      [data-theme="dark"] .feedback-question label {
        color: #ecf0f1 !important;
      }

      [data-theme="dark"] .feedback-question textarea {
        background: #34495e !important;
        border-color: #2c3e50 !important;
        color: #ecf0f1 !important;
      }

      [data-theme="dark"] .feedback-question textarea::placeholder {
        color: #95a5a6 !important;
      }

      [data-theme="dark"] .feedback-close {
        color: #bdc3c7 !important;
      }

      [data-theme="dark"] .feedback-close:hover {
        color: #e74c3c !important;
      }

      [data-theme="dark"] .analysis-time {
        background: #34495e !important;
        color: #ecf0f1 !important;
      }

      .feedback-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }

      .feedback-actions button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-primary {
        background: var(--primary-color, #2563eb);
        color: white;
      }

      .btn-primary:hover {
        background: var(--primary-hover, #1d4ed8);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }

      .btn-secondary {
        background: var(--secondary-color, #6b7280);
        color: white;
      }

      .btn-secondary:hover {
        background: var(--secondary-hover, #4b5563);
      }

      /* Notificaciones */
      .feedback-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        display: flex;
        align-items: center;
        gap: 15px;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
      }

      .feedback-notification.show {
        opacity: 1;
        transform: translateX(0);
      }

      .feedback-notification.success {
        background: #10b981;
        color: white;
      }

      .feedback-notification.error {
        background: #ef4444;
        color: white;
      }

      .feedback-notification.warning {
        background: #f59e0b;
        color: white;
      }

      .feedback-notification button {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      /* Tema oscuro */
      [data-theme="dark"] .feedback-content {
        background: #1e293b;
        color: #e2e8f0;
      }

      [data-theme="dark"] .feedback-question textarea {
        background: #0f172a;
        color: #e2e8f0;
        border-color: #334155;
      }

      [data-theme="dark"] .analysis-time {
        background: #334155;
        color: #e2e8f0;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Auto-mostrar encuesta después de completar un análisis
   * Llamar esta función al final de la función de análisis
   */
  autoShowAfterAnalysis(projectId, analysisStartTime) {
    const analysisTime = analysisStartTime 
      ? Math.round((Date.now() - analysisStartTime) / 1000)
      : null;
    
    // Mostrar después de un pequeño delay para no interrumpir la visualización de resultados
    setTimeout(() => {
      this.showFeedbackSurvey(projectId, analysisTime);
    }, 2000);
  }
}

// Instancia global del módulo de feedback
const feedbackModule = new FeedbackModule();

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackModule;
}
