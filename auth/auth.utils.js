// ============================================
// UTILIDADES DE AUTENTICACIÓN
// Thinking Skills Program v2 - Sistema de Autenticación
// ============================================

import { CONFIG } from '../config/supabase.config.js';

// ============================================
// LOGGER - Sistema de Logs Condicional
// ============================================

/**
 * Sistema de logging que solo muestra mensajes si DEBUG_MODE está activo
 * Uso: Logger.log('mensaje'), Logger.error('error'), Logger.warn('advertencia')
 */
export const Logger = {
  /**
   * Log informativo (solo en modo debug)
   */
  log(...args) {
    if (CONFIG.DEBUG_MODE) {
      console.log(CONFIG.LOG_PREFIX, ...args);
    }
  },
  
  /**
   * Log de error (siempre se muestra)
   */
  error(...args) {
    console.error(CONFIG.LOG_PREFIX, '❌', ...args);
  },
  
  /**
   * Log de advertencia (siempre se muestra)
   */
  warn(...args) {
    console.warn(CONFIG.LOG_PREFIX, '⚠️', ...args);
  },
  
  /**
   * Log de éxito (solo en modo debug)
   */
  success(...args) {
    if (CONFIG.DEBUG_MODE) {
      console.log(CONFIG.LOG_PREFIX, '✅', ...args);
    }
  }
};

// ============================================
// DETECCIÓN DE ENTORNO Y RUTAS
// ============================================

/**
 * Detecta el entorno actual de ejecución
 * @returns {'github-pages' | 'vercel' | 'localhost' | 'other'}
 */
export function detectEnvironment() {
  if (typeof window === 'undefined') return 'other';
  
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('github.io')) {
    return 'github-pages';
  }
  
  if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
    return 'vercel';
  }
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'localhost';
  }
  
  return 'other';
}

/**
 * Obtiene el base path de la aplicación según el entorno
 * 
 * - GitHub Pages: /nombre-repositorio
 * - Vercel: / (root)
 * - Localhost: / (root)
 * 
 * @returns {string} Base path sin trailing slash
 */
export function getBasePath() {
  if (typeof window === 'undefined' || !window.location) return '';
  
  const env = detectEnvironment();
  const pathname = window.location.pathname.toLowerCase();
  
  switch (env) {
    case 'github-pages': {
      // GitHub Pages usa /nombre-repo como base
      // Extraer el primer segmento del pathname
      const match = pathname.match(/^\/([^/]+)/);
      if (match) {
        // Preservar el case original del repositorio
        const originalPath = window.location.pathname;
        const originalMatch = originalPath.match(/^\/([^/]+)/);
        return originalMatch ? '/' + originalMatch[1] : '';
      }
      return '';
    }
    
    case 'vercel':
    case 'localhost':
    default:
      return '';
  }
}

/**
 * Construye una URL completa para una ruta relativa
 * Maneja automáticamente el base path según el entorno
 * 
 * @param {string} path - Ruta relativa (ej: 'dashboard.html', '/admin/login.html')
 * @returns {string} URL completa
 * 
 * @example
 * // En GitHub Pages (https://usuario.github.io/mi-repo/...)
 * buildUrl('dashboard.html') // → https://usuario.github.io/mi-repo/dashboard.html
 * 
 * // En Vercel (https://mi-app.vercel.app/...)
 * buildUrl('dashboard.html') // → https://mi-app.vercel.app/dashboard.html
 */
export function buildUrl(path) {
  const base = getBasePath();
  
  // Limpiar el path: remover slash inicial si existe
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Construir URL
  if (base) {
    return `${window.location.origin}${base}/${cleanPath}`;
  }
  
  return `${window.location.origin}/${cleanPath}`;
}

/**
 * Obtiene la ruta relativa actual (sin el base path)
 * Útil para saber en qué página estamos
 * 
 * @returns {string} Ruta relativa actual
 */
export function getCurrentPath() {
  const base = getBasePath();
  let path = window.location.pathname;
  
  if (base && path.startsWith(base)) {
    path = path.substring(base.length);
  }
  
  // Asegurar que empiece con /
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return path;
}

// ============================================
// VALIDACIÓN DE DATOS
// ============================================

/**
 * Valida formato de email
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Regex simple pero efectivo para validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Valida que un rol sea válido según la configuración
 * @param {string} role 
 * @returns {boolean}
 */
export function isValidRole(role) {
  if (!role || typeof role !== 'string') return false;
  return CONFIG.VALID_ROLES.includes(role.toLowerCase());
}

/**
 * Sanitiza un string para prevenir XSS básico
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valida fortaleza de contraseña
 * @param {string} password 
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validatePasswordStrength(password) {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================
// HASH DE CONTRASEÑAS (FRONTEND)
// ============================================

/**
 * Genera un hash SHA-256 de una contraseña
 * NOTA: Esto es solo para comparación en frontend.
 * El hash real de seguridad debe hacerse en el backend/Supabase
 * 
 * @param {string} password 
 * @returns {Promise<string>} Hash en hexadecimal
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================
// MANEJO DE TIEMPO Y EXPIRACIÓN
// ============================================

/**
 * Obtiene el timestamp actual en milisegundos
 * @returns {number}
 */
export function now() {
  return Date.now();
}

/**
 * Verifica si un timestamp ha expirado
 * @param {number} timestamp - Timestamp en milisegundos
 * @param {number} hoursValid - Horas de validez
 * @returns {boolean}
 */
export function isExpired(timestamp, hoursValid = CONFIG.SESSION_DURATION_HOURS) {
  if (!timestamp || typeof timestamp !== 'number') return true;
  
  const expirationTime = timestamp + (hoursValid * 60 * 60 * 1000);
  return now() > expirationTime;
}

/**
 * Calcula cuándo expira un timestamp
 * @param {number} timestamp 
 * @param {number} hoursValid 
 * @returns {Date}
 */
export function getExpirationDate(timestamp, hoursValid = CONFIG.SESSION_DURATION_HOURS) {
  return new Date(timestamp + (hoursValid * 60 * 60 * 1000));
}

// ============================================
// MANEJO DE ERRORES
// ============================================

/**
 * Formatea errores de Supabase a mensajes amigables
 * @param {Error|Object|string} error 
 * @returns {string}
 */
export function formatError(error) {
  if (!error) return 'Error desconocido';
  
  // Si es un string, devolverlo directamente
  if (typeof error === 'string') return error;
  
  // Errores de Supabase
  if (error.message) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('invalid login credentials')) {
      return 'Credenciales inválidas. Verifica tu email y contraseña.';
    }
    
    if (msg.includes('email not confirmed')) {
      return 'Email no confirmado. Revisa tu bandeja de entrada.';
    }
    
    if (msg.includes('user not found')) {
      return 'Usuario no encontrado.';
    }
    
    if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
      return 'Este email ya está registrado.';
    }
    
    if (msg.includes('network') || msg.includes('fetch')) {
      return 'Error de conexión. Verifica tu internet.';
    }
    
    if (msg.includes('rate limit')) {
      return 'Demasiados intentos. Espera un momento.';
    }
    
    return error.message;
  }
  
  // Error con código HTTP
  if (error.status) {
    switch (error.status) {
      case 400: return 'Solicitud inválida';
      case 401: return 'No autorizado';
      case 403: return 'Acceso denegado';
      case 404: return 'No encontrado';
      case 429: return 'Demasiadas solicitudes';
      case 500: return 'Error del servidor';
      default: return `Error ${error.status}`;
    }
  }
  
  return 'Error desconocido';
}

// ============================================
// PROTECCIÓN CONTRA ATAQUES
// ============================================

/**
 * Rate limiting simple usando localStorage
 * @param {string} key - Clave única para el rate limit
 * @param {number} maxAttempts - Número máximo de intentos
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {boolean} true si se permite el intento
 */
export function checkRateLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  try {
    const data = localStorage.getItem(storageKey);
    let attempts = data ? JSON.parse(data) : { count: 0, resetAt: now + windowMs };
    
    // Resetear si la ventana expiró
    if (now > attempts.resetAt) {
      attempts = { count: 0, resetAt: now + windowMs };
    }
    
    // Incrementar contador
    attempts.count++;
    
    // Guardar
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    
    // Verificar límite
    if (attempts.count > maxAttempts) {
      return false;
    }
    
    return true;
  } catch (error) {
    Logger.warn('Error en rate limiting:', error);
    return true; // Permitir en caso de error
  }
}

/**
 * Limpia el rate limit para una clave específica
 * @param {string} key 
 */
export function clearRateLimit(key) {
  try {
    localStorage.removeItem(`rate_limit_${key}`);
  } catch (error) {
    Logger.warn('Error al limpiar rate limit:', error);
  }
}

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
  Logger,
  detectEnvironment,
  getBasePath,
  buildUrl,
  getCurrentPath,
  isValidEmail,
  isValidRole,
  sanitizeString,
  validatePasswordStrength,
  hashPassword,
  now,
  isExpired,
  getExpirationDate,
  formatError,
  checkRateLimit,
  clearRateLimit
};
