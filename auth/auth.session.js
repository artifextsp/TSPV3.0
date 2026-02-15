// ============================================
// GESTIÓN DE SESIÓN
// Thinking Skills Program v2 - Sistema de Autenticación
// ============================================

import { CONFIG } from '../config/supabase.config.js';
import { Logger, isExpired, now, isValidRole } from './auth.utils.js';

// ============================================
// ESTRUCTURA DE SESIÓN
// ============================================

/**
 * @typedef {Object} UserSession
 * @property {string} id - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {string} nombre - Nombre del usuario
 * @property {string} role - Rol/tipo del usuario
 * @property {boolean} activo - Si el usuario está activo
 * @property {boolean} primera_vez - Si es el primer login
 * @property {string|null} rol_activo - Rol activo (para usuarios con múltiples roles)
 * @property {number} timestamp - Timestamp de creación de la sesión
 * @property {Object} extra - Datos adicionales del usuario
 */

// ============================================
// FUNCIONES DE SESIÓN
// ============================================

/**
 * Obtiene el usuario de la sesión actual desde localStorage
 * Incluye validación de expiración y integridad de datos
 * 
 * @returns {UserSession|null} Usuario actual o null si no hay sesión válida
 * 
 * @example
 * const user = getUser();
 * if (user) {
 *   console.log(`Bienvenido, ${user.nombre}`);
 * }
 */
export function getUser() {
  try {
    const sessionData = localStorage.getItem(CONFIG.STORAGE_KEY);
    
    // No hay sesión guardada
    if (!sessionData) {
      Logger.log('No hay sesión en localStorage');
      return null;
    }
    
    // Parsear datos
    const user = JSON.parse(sessionData);
    
    // Validación de campos obligatorios
    if (!user || !user.id || !user.role) {
      Logger.warn('Sesión inválida: faltan campos obligatorios');
      clearSession();
      return null;
    }
    
    // Validación de rol
    if (!isValidRole(user.role)) {
      Logger.warn('Sesión inválida: rol no reconocido:', user.role);
      clearSession();
      return null;
    }
    
    // Validación de expiración
    if (user.timestamp && isExpired(user.timestamp)) {
      Logger.warn('Sesión expirada');
      clearSession();
      return null;
    }
    
    Logger.success('Usuario recuperado:', user.id, user.role);
    return user;
    
  } catch (error) {
    // Error de parsing u otro - limpiar sesión corrupta
    Logger.error('Error al leer sesión:', error);
    clearSession();
    return null;
  }
}

/**
 * Guarda el usuario en la sesión (localStorage)
 * Normaliza y valida los datos antes de guardar
 * 
 * @param {Object} userData - Datos del usuario a guardar
 * @returns {boolean} true si se guardó correctamente
 * 
 * @example
 * const success = setUser({
 *   id: '123',
 *   email: 'usuario@ejemplo.com',
 *   nombre: 'Juan Pérez',
 *   role: 'admin'
 * });
 */
export function setUser(userData) {
  try {
    // Validación de datos obligatorios
    if (!userData) {
      Logger.error('setUser: No se proporcionaron datos');
      return false;
    }
    
    // El rol puede venir como 'role' o como el campo configurado (ej: 'tipo_usuario')
    const role = userData.role || userData[CONFIG.USER_ROLE_FIELD];
    
    if (!userData.id) {
      Logger.error('setUser: Falta el ID del usuario');
      return false;
    }
    
    if (!role) {
      Logger.error('setUser: Falta el rol del usuario');
      return false;
    }
    
    // Validar que el rol sea válido
    if (!isValidRole(role)) {
      Logger.error('setUser: Rol inválido:', role);
      return false;
    }
    
    // Construir objeto de sesión normalizado
    const session = {
      // Campos obligatorios
      id: String(userData.id).trim(),
      role: String(role).toLowerCase().trim(),
      
      // Campos comunes
      email: String(userData.email || '').trim(),
      nombre: String(userData.nombre || userData.username || userData.id).trim(),
      
      // Campos opcionales
      activo: userData.activo !== false, // Default true
      primera_vez: Boolean(userData.primera_vez),
      rol_activo: userData.rol_activo ? String(userData.rol_activo).toLowerCase().trim() : null,
      
      // 🔒 CRÍTICO: colegio_id para aislamiento multi-tenant
      colegio_id: userData.colegio_id || null,
      
      // Timestamp para control de expiración
      timestamp: now(),
      
      // Datos extra que no se mapean directamente
      extra: {}
    };
    
    // Guardar campos adicionales en 'extra'
    const knownFields = ['id', 'role', 'email', 'nombre', 'username', 
                         'activo', 'primera_vez', 'rol_activo', 'colegio_id', CONFIG.USER_ROLE_FIELD];
    
    for (const [key, value] of Object.entries(userData)) {
      if (!knownFields.includes(key) && value !== undefined) {
        session.extra[key] = value;
      }
    }
    
    // Guardar en localStorage
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(session));
    
    Logger.success('Usuario guardado:', session.id, session.role);
    return true;
    
  } catch (error) {
    Logger.error('Error al guardar usuario:', error);
    return false;
  }
}

/**
 * Actualiza campos específicos del usuario en sesión
 * Útil para actualizar el rol activo sin recargar toda la sesión
 * 
 * @param {Object} updates - Campos a actualizar
 * @returns {boolean} true si se actualizó correctamente
 * 
 * @example
 * // Cambiar rol activo
 * updateUser({ rol_activo: 'docente' });
 */
export function updateUser(updates) {
  try {
    const currentUser = getUser();
    
    if (!currentUser) {
      Logger.error('updateUser: No hay sesión activa');
      return false;
    }
    
    // Mezclar datos actuales con actualizaciones
    const updatedUser = {
      ...currentUser,
      ...updates,
      // Actualizar timestamp
      timestamp: now()
    };
    
    // Si se actualiza el rol, validarlo
    if (updates.role && !isValidRole(updates.role)) {
      Logger.error('updateUser: Rol inválido:', updates.role);
      return false;
    }
    
    if (updates.rol_activo && !isValidRole(updates.rol_activo)) {
      Logger.error('updateUser: Rol activo inválido:', updates.rol_activo);
      return false;
    }
    
    // Guardar
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(updatedUser));
    
    Logger.success('Usuario actualizado');
    return true;
    
  } catch (error) {
    Logger.error('Error al actualizar usuario:', error);
    return false;
  }
}

/**
 * Limpia la sesión actual de localStorage
 * También limpia datos relacionados con el prefijo de la app
 */
export function clearSession() {
  try {
    // Limpiar sesión principal
    localStorage.removeItem(CONFIG.STORAGE_KEY);
    
    // Limpiar datos relacionados (con el mismo prefijo)
    const prefix = CONFIG.STORAGE_KEY.split('_')[0] + '_';
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    Logger.success('Sesión limpiada');
    
  } catch (error) {
    Logger.error('Error al limpiar sesión:', error);
  }
}

/**
 * Verifica si hay una sesión activa y válida
 * 
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getUser() !== null;
}

/**
 * Obtiene el rol efectivo del usuario
 * Prioriza rol_activo sobre role si existe
 * 
 * @returns {string|null} Rol efectivo o null si no hay sesión
 */
export function getEffectiveRole() {
  const user = getUser();
  if (!user) return null;
  
  return user.rol_activo || user.role;
}

/**
 * Verifica si el usuario tiene un rol específico
 * 
 * @param {string|string[]} roles - Rol o array de roles a verificar
 * @returns {boolean}
 * 
 * @example
 * if (hasRole('admin')) { ... }
 * if (hasRole(['admin', 'super_admin'])) { ... }
 */
export function hasRole(roles) {
  const effectiveRole = getEffectiveRole();
  if (!effectiveRole) return false;
  
  if (Array.isArray(roles)) {
    return roles.map(r => r.toLowerCase()).includes(effectiveRole);
  }
  
  return effectiveRole === roles.toLowerCase();
}

/**
 * Extiende la sesión actual (renueva el timestamp)
 * Útil para mantener la sesión activa mientras el usuario interactúa
 * 
 * @returns {boolean}
 */
export function extendSession() {
  return updateUser({ timestamp: now() });
}

// ============================================
// EXPORTACIONES
// ============================================

export default {
  getUser,
  setUser,
  updateUser,
  clearSession,
  isAuthenticated,
  getEffectiveRole,
  hasRole,
  extendSession
};
