// ============================================
// LÓGICA DE REDIRECCIÓN POR ROL
// Thinking Skills Program v2 - Sistema de Autenticación
// ============================================

import { CONFIG } from '../config/supabase.config.js';
import { Logger, buildUrl } from './auth.utils.js';
import { getUser, getEffectiveRole, clearSession } from './auth.session.js';

// ============================================
// CONFIGURACIÓN DE ROLES Y RUTAS
// ============================================

/**
 * ⚠️ CONFIGURACIÓN DE RUTAS POR ROL
 * 
 * Define aquí las rutas para cada rol de Thinking Skills Program.
 * 
 * Roles del sistema:
 * - estudiante: Realizan las prácticas → dashboard_estudiante.html
 * - docente: Dirigen las prácticas, visualizan resultados en tiempo real → dashboard_docente.html
 * - rector: Visualizan resultados y estadísticas → dashboard_rector.html
 * - acudiente: Visualizan resultados de prácticas de su hijo/a → dashboard_acudiente.html
 * 
 * Cada rol necesita:
 * - dashboard: Página principal después del login
 * - loginPage: Página de login (para redirección cuando no autorizado)
 * - changePassword (opcional): Página de cambio de contraseña
 * 
 * IMPORTANTE: Las rutas son relativas al root del proyecto
 */
const ROLES_CONFIG = {
  // ═══════════════════════════════════════════
  // 🔴 CONFIGURACIÓN DE RUTAS - TSP
  // ═══════════════════════════════════════════
  
  /**
   * ESTUDIANTES
   * Realizan las prácticas del Thinking Skills Program
   */
  estudiante: {
    dashboard: 'estudiante/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'estudiante/cambiar_password.html'
  },
  
  /**
   * DOCENTES
   * Dirigen las prácticas y visualizan resultados en tiempo real
   */
  docente: {
    dashboard: 'docente/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'docente/cambiar_password.html'
  },
  
  /**
   * ADMINISTRADORES
   * Gestionan estudiantes, colegios y docentes
   */
  admin: {
    dashboard: 'admin/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'admin/cambiar_password.html'
  },
  
  /**
   * SUPER ADMINISTRADORES
   * Acceso completo al sistema
   */
  super_admin: {
    dashboard: 'admin/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'admin/cambiar_password.html'
  },
  
  /**
   * RECTORES
   * Visualizan resultados y estadísticas generales
   */
  rector: {
    dashboard: 'rector/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'rector/cambiar_password.html'
  },
  
  /**
   * ACUDIENTES
   * Visualizan resultados de prácticas de su hijo/a
   */
  acudiente: {
    dashboard: 'acudiente/dashboard.html',
    loginPage: 'index.html',
    changePassword: 'acudiente/cambiar_password.html'
  }
};

/**
 * Página por defecto si el rol no está configurado
 */
const DEFAULT_PAGES = {
  dashboard: 'dashboard.html',
  loginPage: 'index.html',
  changePassword: 'cambiar_password.html',
  roleSelection: 'seleccionar_rol.html'
};

// ============================================
// FUNCIONES DE OBTENCIÓN DE RUTAS
// ============================================

/**
 * Obtiene la configuración de rutas para un rol
 * 
 * @param {string} role - Rol del usuario
 * @returns {Object} Configuración de rutas del rol
 */
export function getRoleConfig(role) {
  if (!role) return DEFAULT_PAGES;
  
  const normalizedRole = role.toLowerCase();
  return ROLES_CONFIG[normalizedRole] || DEFAULT_PAGES;
}

/**
 * Obtiene la URL del dashboard para un rol específico
 * 
 * @param {string} role - Rol del usuario
 * @returns {string} URL completa del dashboard
 */
export function getDashboardUrl(role) {
  const config = getRoleConfig(role);
  return buildUrl(config.dashboard);
}

/**
 * Obtiene la URL de login para un rol específico
 * 
 * @param {string} role - Rol del usuario
 * @returns {string} URL completa de la página de login
 */
export function getLoginUrl(role = null) {
  if (!role) {
    return buildUrl(DEFAULT_PAGES.loginPage);
  }
  
  const config = getRoleConfig(role);
  return buildUrl(config.loginPage);
}

/**
 * Obtiene la URL de cambio de contraseña
 * 
 * @param {string} role - Rol del usuario (opcional)
 * @returns {string} URL completa de la página de cambio de contraseña
 */
export function getChangePasswordUrl(role = null) {
  const config = role ? getRoleConfig(role) : DEFAULT_PAGES;
  const page = config.changePassword || DEFAULT_PAGES.changePassword;
  return buildUrl(page);
}

/**
 * Obtiene la URL de selección de rol (para usuarios con múltiples roles)
 * 
 * @returns {string} URL completa de la página de selección de rol
 */
export function getRoleSelectionUrl() {
  return buildUrl(DEFAULT_PAGES.roleSelection);
}

// ============================================
// FUNCIONES DE REDIRECCIÓN
// ============================================

/**
 * Redirige al usuario a su dashboard según su rol
 * Maneja casos especiales como primera vez y múltiples roles
 * 
 * @param {Object} options - Opciones de redirección
 * @param {boolean} options.checkFirstTime - Verificar si es primera vez (default: true)
 * @param {boolean} options.checkMultipleRoles - Verificar múltiples roles (default: false)
 * @param {Function} options.hasMultipleRoles - Función async que verifica múltiples roles
 */
export async function redirectToDashboard(options = {}) {
  const {
    checkFirstTime = true,
    checkMultipleRoles = false,
    hasMultipleRoles = null
  } = options;
  
  const user = getUser();
  
  if (!user) {
    Logger.error('redirectToDashboard: No hay usuario autenticado');
    logout();
    return;
  }
  
  Logger.log('Iniciando redirección para:', user.id, user.role);
  
  // Verificar si es primera vez y debe cambiar contraseña
  if (checkFirstTime && user.primera_vez) {
    Logger.log('Usuario debe cambiar contraseña (primera vez)');
    window.location.href = getChangePasswordUrl(user.role);
    return;
  }
  
  // Verificar múltiples roles (si se proporciona la función)
  if (checkMultipleRoles && hasMultipleRoles && !user.rol_activo) {
    try {
      const multipleRoles = await hasMultipleRoles(user);
      if (multipleRoles) {
        Logger.log('Usuario tiene múltiples roles, redirigiendo a selección');
        window.location.href = getRoleSelectionUrl();
        return;
      }
    } catch (error) {
      Logger.warn('Error al verificar múltiples roles:', error);
      // Continuar con redirección normal
    }
  }
  
  // Obtener rol efectivo (rol_activo si existe, sino role)
  const effectiveRole = getEffectiveRole();
  
  // Obtener URL del dashboard
  const dashboardUrl = getDashboardUrl(effectiveRole);
  
  Logger.success('Redirigiendo a:', dashboardUrl);
  
  // Redirección directa e inmediata
  window.location.href = dashboardUrl;
}

/**
 * Cierra sesión y redirige al login
 * 
 * @param {string} role - Rol para determinar página de login (opcional)
 */
export function logout(role = null) {
  const user = getUser();
  const effectiveRole = role || (user ? user.role : null);
  
  clearSession();
  
  const loginUrl = getLoginUrl(effectiveRole);
  Logger.log('Cerrando sesión, redirigiendo a:', loginUrl);
  
  window.location.replace(loginUrl);
}

/**
 * Requiere autenticación - redirige al login si no hay sesión
 * 
 * @param {string} requiredRole - Rol requerido (opcional)
 * @returns {Object|null} Usuario si está autenticado, null si redirige
 * 
 * @example
 * // Solo requiere autenticación
 * const user = requireAuth();
 * 
 * // Requiere rol específico
 * const admin = requireAuth('admin');
 */
export function requireAuth(requiredRole = null) {
  const user = getUser();
  
  // Sin usuario autenticado
  if (!user) {
    Logger.error('requireAuth: No hay sesión activa');
    
    const loginUrl = requiredRole ? getLoginUrl(requiredRole) : getLoginUrl();
    window.location.replace(loginUrl);
    return null;
  }
  
  // Verificar rol si se requiere
  if (requiredRole) {
    const effectiveRole = getEffectiveRole();
    const normalizedRequired = requiredRole.toLowerCase();
    
    // Verificar coincidencia de rol
    if (effectiveRole !== normalizedRequired) {
      // Casos especiales de herencia de roles
      const isAllowed = checkRoleHierarchy(effectiveRole, normalizedRequired);
      
      if (!isAllowed) {
        Logger.error(`Rol requerido: ${requiredRole}, rol actual: ${effectiveRole}`);
        showError('No tienes permisos para acceder a esta página');
        
        setTimeout(() => {
          const loginUrl = getLoginUrl(requiredRole);
          window.location.replace(loginUrl);
        }, 2000);
        
        return null;
      }
    }
  }
  
  return user;
}

/**
 * Alias de requireAuth con verificación de rol
 * 
 * @param {string} requiredRole - Rol requerido
 * @returns {Object|null}
 */
export function requireRole(requiredRole) {
  return requireAuth(requiredRole);
}

// ============================================
// JERARQUÍA DE ROLES
// ============================================

/**
 * Verifica si un rol tiene acceso a otro según la jerarquía
 * 
 * Jerarquía de roles TSP:
 * - rector: Acceso completo (puede ver todo)
 * - docente: Acceso a funciones de docente y puede ver datos de estudiantes
 * - estudiante: Solo acceso a sus propias funciones
 * 
 * @param {string} userRole - Rol del usuario
 * @param {string} requiredRole - Rol requerido
 * @returns {boolean}
 */
function checkRoleHierarchy(userRole, requiredRole) {
  // rector tiene acceso a todo
  if (userRole === 'rector') {
    return true;
  }
  
  // docente puede acceder a funciones de estudiante (para visualizar)
  if (userRole === 'docente' && requiredRole === 'estudiante') {
    return true;
  }
  
  // estudiante solo tiene acceso a sus propias funciones
  if (userRole === 'estudiante' && requiredRole === 'estudiante') {
    return true;
  }
  
  return false;
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Muestra un mensaje de error al usuario
 * Usa alert como fallback, pero se puede personalizar
 * 
 * @param {string} message 
 */
function showError(message) {
  // Si existe una función global mostrarAlerta, usarla
  if (typeof window !== 'undefined' && typeof window.mostrarAlerta === 'function') {
    window.mostrarAlerta(message, 'error');
    return;
  }
  
  // Fallback a alert
  alert(message);
}

// ============================================
// EXPORTACIONES
// ============================================

export { ROLES_CONFIG, DEFAULT_PAGES };

export default {
  getRoleConfig,
  getDashboardUrl,
  getLoginUrl,
  getChangePasswordUrl,
  getRoleSelectionUrl,
  redirectToDashboard,
  logout,
  requireAuth,
  requireRole,
  ROLES_CONFIG,
  DEFAULT_PAGES
};
