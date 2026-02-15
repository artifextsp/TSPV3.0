// ============================================
// 🔒 TENANT GUARD - Aislamiento Multi-Tenant
// Thinking Skills Program v2 / Ludens
// ============================================
//
// Segunda capa de defensa contra filtración de datos
// entre colegios/plataformas.
//
// Uso:
//   import { TenantGuard } from '../auth/tenant-guard.js';
//   
//   // Inicializar al cargar la página
//   TenantGuard.init();
//   
//   // Validar datos antes de renderizar
//   const datosSeguros = TenantGuard.validarDatos(usuarios, 'colegio_id');
//
// ============================================

import { CONFIG } from '../config/supabase.config.js';

/**
 * Módulo de guardia multi-tenant.
 * Valida que los datos devueltos por la API correspondan
 * al colegio del usuario autenticado.
 */
export const TenantGuard = {
  
  // Estado interno
  _colegioId: null,
  _userId: null,
  _role: null,
  _initialized: false,
  _violations: [],
  
  /**
   * Inicializa el guard leyendo la sesión actual.
   * Debe llamarse al cargar cada página admin.
   * 
   * @returns {boolean} true si se inicializó correctamente
   */
  init() {
    try {
      const sessionData = localStorage.getItem(CONFIG.STORAGE_KEY);
      if (!sessionData) {
        console.error('[TenantGuard] No hay sesión activa');
        this._initialized = false;
        return false;
      }
      
      const user = JSON.parse(sessionData);
      this._userId = user.id;
      this._role = user.role || user.tipo_usuario;
      this._colegioId = user.colegio_id || (user.extra && user.extra.colegio_id);
      this._initialized = true;
      this._violations = [];
      
      if (!this._colegioId && this._role !== 'super_admin') {
        console.warn('[TenantGuard] ⚠️ Usuario sin colegio_id:', {
          id: this._userId,
          role: this._role
        });
      }
      
      console.log('[TenantGuard] ✅ Inicializado para colegio:', this._colegioId);
      return true;
    } catch (error) {
      console.error('[TenantGuard] Error al inicializar:', error);
      this._initialized = false;
      return false;
    }
  },
  
  /**
   * Obtiene el colegio_id del tenant actual.
   * @returns {string|null}
   */
  getColegioId() {
    if (!this._initialized) this.init();
    return this._colegioId;
  },
  
  /**
   * Verifica si el guard está activo (tiene colegio_id).
   * @returns {boolean}
   */
  isActive() {
    if (!this._initialized) this.init();
    return !!this._colegioId;
  },
  
  /**
   * Valida un array de datos y filtra registros de otros tenants.
   * Registra violaciones para auditoría.
   * 
   * @param {Array} datos - Array de objetos devueltos por la API
   * @param {string} campoColegioId - Campo que contiene el colegio_id
   * @returns {Array} Solo los registros válidos para este tenant
   */
  validarDatos(datos, campoColegioId = 'colegio_id') {
    if (!this._initialized) this.init();
    if (!Array.isArray(datos) || !this._colegioId) return datos;
    
    // Super admin puede ver todo
    if (this._role === 'super_admin') return datos;
    
    const validos = [];
    const violaciones = [];
    
    for (const item of datos) {
      const itemColegioId = item[campoColegioId];
      
      // Si el item no tiene colegio_id, dejarlo pasar con advertencia
      if (!itemColegioId) {
        validos.push(item);
        continue;
      }
      
      // Si coincide con el tenant, es válido
      if (itemColegioId === this._colegioId) {
        validos.push(item);
        continue;
      }
      
      // VIOLACIÓN: dato de otro tenant
      violaciones.push({
        timestamp: new Date().toISOString(),
        itemId: item.id,
        itemColegioId: itemColegioId,
        expectedColegioId: this._colegioId,
        campo: campoColegioId
      });
    }
    
    if (violaciones.length > 0) {
      console.error(`[TenantGuard] 🚨 VIOLACIÓN DE TENANT: ${violaciones.length} registros de otros colegios detectados y bloqueados`);
      this._violations.push(...violaciones);
      
      // Registrar en sessionStorage para diagnóstico
      try {
        const existentes = JSON.parse(sessionStorage.getItem('tenant_violations') || '[]');
        sessionStorage.setItem('tenant_violations', JSON.stringify([...existentes, ...violaciones].slice(-100)));
      } catch (e) { /* ignorar */ }
    }
    
    return validos;
  },
  
  /**
   * Valida datos de acudientes.
   * Los acudientes no tienen colegio_id directo; se valida
   * a través del estudiante vinculado.
   * 
   * @param {Array} acudientes - Array de acudientes con sus estudiantes
   * @param {Array} estudiantesIdsDelColegio - IDs de estudiantes válidos
   * @returns {Array} Solo acudientes vinculados a estudiantes del colegio
   */
  validarAcudientes(acudientes, estudiantesIdsDelColegio) {
    if (!Array.isArray(acudientes) || !Array.isArray(estudiantesIdsDelColegio)) {
      return acudientes;
    }
    
    // Super admin puede ver todo
    if (this._role === 'super_admin') return acudientes;
    
    const idsSet = new Set(estudiantesIdsDelColegio);
    
    return acudientes.filter(acu => {
      if (!acu.estudiante_id) return true; // Sin vínculo, dejar pasar
      
      if (idsSet.has(acu.estudiante_id)) return true;
      
      console.warn(`[TenantGuard] Acudiente ${acu.id} bloqueado: estudiante ${acu.estudiante_id} no pertenece al colegio`);
      return false;
    });
  },
  
  /**
   * Valida que una operación de escritura incluya colegio_id.
   * 
   * @param {Object} datos - Datos a enviar en la operación
   * @param {string} operacion - Nombre de la operación (para logging)
   * @returns {Object} Datos con colegio_id asegurado
   * @throws {Error} Si no se puede determinar el colegio_id
   */
  asegurarColegioId(datos, operacion = 'operación') {
    if (!this._initialized) this.init();
    
    if (!this._colegioId) {
      throw new Error(`[TenantGuard] No se puede ejecutar ${operacion}: falta colegio_id del admin`);
    }
    
    // Si los datos ya tienen colegio_id, verificar que coincida
    if (datos.colegio_id && datos.colegio_id !== this._colegioId) {
      if (this._role !== 'super_admin') {
        throw new Error(`[TenantGuard] ${operacion}: intento de escribir en colegio_id=${datos.colegio_id} desde tenant ${this._colegioId}`);
      }
    }
    
    return {
      ...datos,
      colegio_id: datos.colegio_id || this._colegioId
    };
  },
  
  /**
   * Obtiene las violaciones detectadas (para diagnóstico).
   * @returns {Array}
   */
  getViolations() {
    return [...this._violations];
  },
  
  /**
   * Limpia el historial de violaciones.
   */
  clearViolations() {
    this._violations = [];
    sessionStorage.removeItem('tenant_violations');
  },
  
  /**
   * Genera un reporte de seguridad para la consola.
   */
  report() {
    console.group('🔒 TenantGuard - Reporte de Seguridad');
    console.log('Inicializado:', this._initialized);
    console.log('Colegio ID:', this._colegioId || 'N/A');
    console.log('User ID:', this._userId || 'N/A');
    console.log('Role:', this._role || 'N/A');
    console.log('Violaciones detectadas:', this._violations.length);
    
    if (this._violations.length > 0) {
      console.table(this._violations.slice(-10)); // Últimas 10
    }
    
    console.groupEnd();
  }
};

// Auto-inicializar al importar (si hay sesión)
if (typeof window !== 'undefined') {
  try {
    const sessionData = localStorage.getItem(CONFIG?.STORAGE_KEY);
    if (sessionData) {
      TenantGuard.init();
    }
  } catch (e) {
    // Silenciar error si CONFIG no está disponible aún
  }
}

export default TenantGuard;
