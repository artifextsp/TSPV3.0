// ============================================
// NÚCLEO DE AUTENTICACIÓN
// Thinking Skills Program v2 - Sistema de Autenticación
// ============================================

/**
 * Este módulo contiene las funciones principales de autenticación
 * que interactúan directamente con Supabase.
 * 
 * Exporta todas las funciones necesarias para:
 * - Login/Logout
 * - Registro de usuarios
 * - Recuperación de contraseña
 * - Verificación de sesión
 * - Control de acceso por roles
 * - Cambio de contraseña
 */

import { CONFIG, validateConfig } from '../config/supabase.config.js';
import { 
  Logger, 
  formatError, 
  hashPassword, 
  buildUrl,
  isValidEmail,
  validatePasswordStrength,
  checkRateLimit,
  clearRateLimit
} from './auth.utils.js';
import { 
  getUser, 
  setUser, 
  clearSession, 
  isAuthenticated, 
  hasRole,
  getEffectiveRole,
  updateUser,
  extendSession
} from './auth.session.js';
import { 
  redirectToDashboard, 
  requireAuth, 
  requireRole,
  getDashboardUrl,
  getLoginUrl
} from './auth.redirect.js';

// ============================================
// RESULTADO DE AUTENTICACIÓN
// ============================================

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success - Si la operación fue exitosa
 * @property {Object|null} user - Datos del usuario (si success)
 * @property {string|null} error - Mensaje de error (si !success)
 * @property {string|null} code - Código de error para manejo específico
 */

/**
 * Crea un resultado de autenticación exitoso
 * @param {Object} user 
 * @returns {AuthResult}
 */
function successResult(user) {
  return { success: true, user, error: null, code: null };
}

/**
 * Crea un resultado de autenticación fallido
 * @param {string} error 
 * @param {string} code 
 * @returns {AuthResult}
 */
function errorResult(error, code = 'AUTH_ERROR') {
  return { success: false, user: null, error, code };
}

// ============================================
// MAPEO DE ROLES LEGACY
// ============================================

/**
 * Mapea roles antiguos a los nuevos roles del sistema
 * Permite compatibilidad durante la migración
 * 
 * @param {string} legacyRole - Rol antiguo del sistema
 * @returns {string} Rol válido del nuevo sistema
 */
function mapLegacyRole(legacyRole) {
  if (!legacyRole) return 'estudiante';
  
  const role = legacyRole.toLowerCase().trim();
  
  // Mapeo de roles antiguos a nuevos
  const roleMap = {
    'usuario': 'estudiante',
    'admin': 'admin',  // Mantener admin como admin (no mapear a rector)
    'super_admin': 'admin',  // Mapear super_admin a admin
    'administrador': 'admin',  // Mapear administrador a admin
    'profesor': 'docente',
    'maestro': 'docente',
    'teacher': 'docente',
    'student': 'estudiante',
    'estudiante': 'estudiante',
    'docente': 'docente',
    'rector': 'rector',
    'acudiente': 'acudiente',
    'padre': 'acudiente',
    'madre': 'acudiente',
    'parent': 'acudiente'
  };
  
  // Si el rol está en el mapa, retornar el mapeo
  if (roleMap[role]) {
    return roleMap[role];
  }
  
  // Si el rol ya es válido, retornarlo
  if (CONFIG.VALID_ROLES.includes(role)) {
    return role;
  }
  
  // Por defecto, retornar 'estudiante'
  Logger.warn(`Rol desconocido "${legacyRole}" mapeado a "estudiante"`);
  return 'estudiante';
}

// ============================================
// CAMPOS SEGUROS PARA TABLA USUARIOS
// ============================================
// Algunas BDs pueden no tener la columna colegio_id. Si detectamos 400 por esa
// columna, se marca en sessionStorage y se usan campos sin colegio_id en las peticiones.

const STORAGE_KEY_BD_SIN_COLEGIO_ID = 'tsp_bd_sin_colegio_id';

function getUsuarioSelectFields() {
  let list = CONFIG.USER_FIELDS.filter(f => f !== 'username');
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(STORAGE_KEY_BD_SIN_COLEGIO_ID) === '1') {
    list = list.filter(f => f !== 'colegio_id');
  }
  return list.join(',');
}

function markBDSinColegioId() {
  try { sessionStorage.setItem(STORAGE_KEY_BD_SIN_COLEGIO_ID, '1'); } catch (_) {}
}

function isErrorColegioIdInexistente(body) {
  if (!body || typeof body !== 'object') return false;
  const msg = (body.message || '').toLowerCase();
  return body.code === '42703' && msg.includes('colegio_id');
}

// ============================================
// FUNCIONES AUXILIARES DE BÚSQUEDA
// ============================================

/**
 * Busca un usuario en la tabla usuarios
 * 
 * @param {string} identifier - Username o email
 * @param {boolean} isUsername - Si es username (TSP001) o email
 * @returns {Promise<Object|null>} Datos del usuario o null si no existe
 */
async function findUsuario(identifier, isUsername) {
  try {
    const doRequest = (selectFields) => {
      let queryUrl;
      if (isUsername) {
        let codigoEstudiante;
        if (identifier.toUpperCase().startsWith('EST')) {
          codigoEstudiante = identifier.toUpperCase();
        } else {
          const numeroMatch = identifier.match(/\d+/);
          if (!numeroMatch) return null;
          codigoEstudiante = `EST${numeroMatch[0].padStart(4, '0')}`;
        }
        Logger.log('Buscando usuario por codigo_estudiante:', codigoEstudiante);
        queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?codigo_estudiante=eq.${encodeURIComponent(codigoEstudiante)}&select=${selectFields}`;
      } else {
        Logger.log('Buscando usuario por email:', identifier.toLowerCase());
        queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?email=eq.${encodeURIComponent(identifier.toLowerCase())}&select=${selectFields}`;
      }
      return fetch(queryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
    };

    let response = await doRequest(getUsuarioSelectFields());

    // Si 400 por columna inexistente (ej. TSPV2 sin colegio_id), marcar y reintentar sin colegio_id
    if (!response.ok && response.status === 400) {
      let body = {};
      try { body = await response.json(); } catch (_) {}
      if (isErrorColegioIdInexistente(body)) {
        Logger.warn('[TSP-AUTH] La tabla usuarios no tiene colegio_id. Reintentando login sin ese campo.');
        markBDSinColegioId();
        response = await doRequest(getUsuarioSelectFields());
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      Logger.error(`Error ${response.status} al buscar usuario:`, errorText);
      if (response.status === 401 || response.status === 403) {
        Logger.error('Error de autenticación con la base de datos - Verifica RLS');
        return null;
      }
      if (response.status === 400) {
        Logger.error('Error 400 - Verifica que los campos existan en la tabla usuarios y RLS esté configurado');
        return null;
      }
      return null;
    }

    const users = await response.json();
    Logger.log('Usuarios encontrados:', users.length);

    if (users && users.length > 0) {
      const user = users[0];
      if (user.colegio_id === undefined) user.colegio_id = null;
      Logger.success('Usuario encontrado:', user.codigo_estudiante || user.email);
      return user;
    }

    Logger.warn('No se encontró usuario con:', identifier);
    return null;

  } catch (error) {
    Logger.error('Error al buscar usuario:', error);
    return null;
  }
}

/**
 * Busca un acudiente en la tabla acudientes
 * 
 * @param {string} identifier - Username (ACU001) o email
 * @param {boolean} isUsername - Si es username o email
 * @returns {Promise<Object|null>} Datos del acudiente o null si no existe
 */
async function findAcudiente(identifier, isUsername) {
  try {
    const fields = CONFIG.ACUDIENTE_FIELDS.join(',');
    let queryUrl;
    
    if (isUsername) {
      // Buscar por username (ACU001, ACU002, etc.)
      queryUrl = `${CONFIG.API_BASE}/${CONFIG.ACUDIENTES_TABLE}?username=eq.${encodeURIComponent(identifier.toUpperCase())}&select=${fields}`;
    } else {
      // Buscar por email
      queryUrl = `${CONFIG.API_BASE}/${CONFIG.ACUDIENTES_TABLE}?email=eq.${encodeURIComponent(identifier.toLowerCase())}&select=${fields}`;
    }
    
    Logger.log('🔍 Buscando acudiente:', identifier, isUsername ? '(username)' : '(email)');
    Logger.log('📡 URL:', queryUrl);
    Logger.log('📋 Campos solicitados:', fields);
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      Logger.error('❌ Error en respuesta:', response.status, response.statusText);
      Logger.error('Detalles:', errorText);
      if (response.status === 401 || response.status === 403) {
        Logger.error('Error de autenticación con la base de datos');
        return null;
      }
      return null;
    }
    
    const acudientes = await response.json();
    Logger.log('📥 Acudientes encontrados:', acudientes ? acudientes.length : 0);
    
    if (acudientes && acudientes.length > 0) {
      const acudiente = acudientes[0];
      Logger.log('✅ Acudiente encontrado:', acudiente.username || acudiente.email);
      Logger.log('🔐 Password hash presente:', !!acudiente.password_hash);
      if (acudiente.password_hash) {
        Logger.log('🔐 Hash (primeros 20 chars):', acudiente.password_hash.substring(0, 20) + '...');
        Logger.log('🔐 Longitud hash:', acudiente.password_hash.length);
      } else {
        Logger.warn('⚠️ NO se encontró password_hash en los datos recuperados');
        Logger.warn('Campos disponibles:', Object.keys(acudiente));
      }
      return acudiente;
    }
    
    Logger.warn('⚠️ No se encontró acudiente con:', identifier);
    return null;
    
  } catch (error) {
    Logger.error('❌ Error al buscar acudiente:', error);
    return null;
  }
}

/**
 * Verifica si un email pertenece a un acudiente
 * 
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} true si es acudiente
 */
async function checkIfAcudiente(email) {
  try {
    const queryUrl = `${CONFIG.API_BASE}/${CONFIG.ACUDIENTES_TABLE}?email=eq.${encodeURIComponent(email.toLowerCase())}&select=id`;
    
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) return false;
    
    const acudientes = await response.json();
    return acudientes && acudientes.length > 0;
    
  } catch (error) {
    Logger.error('Error al verificar acudiente:', error);
    return false;
  }
}

// ============================================
// AUTENTICACIÓN CON SUPABASE
// ============================================

/**
 * Autentica un usuario con username o email y contraseña
 * Usa la API REST de Supabase directamente (compatible con cualquier entorno)
 * 
 * Acepta tanto nombres de usuario simples (TSP001, TSP002) como emails completos
 * 
 * @param {string} usernameOrEmail - Username (ej: TSP001) o email del usuario
 * @param {string} password - Contraseña del usuario
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.autoRedirect - Redirigir automáticamente al dashboard (default: true)
 * @param {boolean} options.checkFirstTime - Verificar si debe cambiar contraseña (default: true)
 * @param {Function} options.passwordHasher - Función para hashear contraseña (opcional)
 * 
 * @returns {Promise<AuthResult>} Resultado de la autenticación
 * 
 * @example
 * // Login con username
 * const result = await login('TSP001', 'password123');
 * 
 * // Login con email
 * const result = await login('usuario@ejemplo.com', 'password123');
 */
export async function login(usernameOrEmail, password, options = {}) {
  const {
    autoRedirect = true,
    checkFirstTime = true,
    passwordHasher = null
  } = options;
  
  // Validar configuración
  if (!validateConfig()) {
    return errorResult('Error de configuración. Contacta al administrador.', 'CONFIG_ERROR');
  }
  
  // Validación de inputs
  if (!usernameOrEmail || !password) {
    return errorResult('Usuario y contraseña son requeridos', 'MISSING_CREDENTIALS');
  }
  
  const trimmedInput = usernameOrEmail.trim();
  
  // Detectar si es username (TSP001, TSP0046, ACU001) o email
  const isEmail = isValidEmail(trimmedInput);
  // Permitir TSP seguido de 3 o más dígitos (TSP001, TSP0046, etc.)
  const isStudentUsername = /^TSP\d{3,}$/i.test(trimmedInput);
  // Permitir ACU seguido de 3 o más dígitos (ACU001, ACU002, etc.)
  const isAcudienteUsername = /^ACU\d{3,}$/i.test(trimmedInput);
  // También permitir código de estudiante directo (EST0046, etc.)
  const isCodigoEstudiante = /^EST\d{4,}$/i.test(trimmedInput);
  const isUsername = isStudentUsername || isAcudienteUsername || isCodigoEstudiante;
  
  if (!isEmail && !isUsername) {
    return errorResult('Ingresa tu nombre de usuario (TSP001, TSP0046, ACU001) o tu email', 'INVALID_INPUT');
  }
  
  // Rate limiting para prevenir fuerza bruta
  const rateLimitKey = `login_${trimmedInput.toLowerCase()}`;
  if (!checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000)) {
    return errorResult('Demasiados intentos. Espera 15 minutos antes de intentar nuevamente.', 'RATE_LIMIT');
  }
  
  try {
    Logger.log('Intentando login para:', trimmedInput, isUsername ? '(username)' : '(email)');
    
    let userData = null;
    let isAcudiente = false;
    
    // Si es username de acudiente, buscar directamente en acudientes
    if (isAcudienteUsername) {
      userData = await findAcudiente(trimmedInput, true);
      isAcudiente = userData !== null;
    }
    // Si es username de estudiante o código de estudiante, buscar en usuarios
    else if (isStudentUsername || isCodigoEstudiante) {
      // Si es código de estudiante directo (EST0046), convertir a formato de búsqueda
      const searchInput = isCodigoEstudiante ? trimmedInput : trimmedInput;
      userData = await findUsuario(searchInput, true);
      isAcudiente = false;
    }
    // Si es email, buscar primero en usuarios, luego en acudientes
    else if (isEmail) {
      // Primero buscar en usuarios
      userData = await findUsuario(trimmedInput, false);
      
      // Si no se encuentra en usuarios, buscar en acudientes
      if (!userData) {
        userData = await findAcudiente(trimmedInput, false);
        isAcudiente = userData !== null;
      } else {
        isAcudiente = false;
      }
    }
    
    if (!userData) {
      Logger.warn('Usuario no encontrado:', trimmedInput);
      return errorResult('Usuario o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }
    
    // Verificar que el usuario esté activo
    if (userData.activo === false) {
      Logger.warn('Usuario inactivo:', trimmedInput);
      return errorResult('Tu cuenta está desactivada. Contacta al administrador.', 'USER_INACTIVE');
    }
    
    // Verificar contraseña
    const isPasswordValid = await verifyPassword(password, userData, passwordHasher);
    
    if (!isPasswordValid) {
      Logger.warn('Contraseña incorrecta para:', trimmedInput);
      return errorResult('Usuario o contraseña incorrectos', 'INVALID_CREDENTIALS');
    }
    
    // Limpiar rate limit en caso de éxito
    clearRateLimit(rateLimitKey);
    
    // Preparar datos de sesión
    let sessionData;
    
    if (isAcudiente) {
      // Sesión de acudiente
      sessionData = {
        id: userData.id,
        email: userData.email,
        username: userData.username || null,
        nombre: `${userData.nombre} ${userData.apellidos}`.trim(),
        role: 'acudiente',
        estudiante_id: userData.estudiante_id, // ID del hijo/a
        activo: userData.activo !== false,
        primera_vez: userData.primera_vez || false
      };
    } else {
      // Sesión de usuario normal (estudiante, docente, rector)
      sessionData = {
        id: userData.id,
        email: userData.email,
        username: userData.username || null,
        nombre: userData.nombre || userData.email,
        // Mapear 'usuario' a 'estudiante' para compatibilidad durante migración
        role: mapLegacyRole(userData[CONFIG.USER_ROLE_FIELD] || userData.tipo_usuario || 'estudiante'),
        tipo_usuario: userData.tipo_usuario,
        activo: userData.activo !== false,
        primera_vez: userData.primera_vez || false,
        // Campos adicionales importantes
        grado: userData.grado || null,
        codigo_estudiante: userData.codigo_estudiante || null,
        apellidos: userData.apellidos || null,
        // 🔒 CRÍTICO: colegio_id para aislamiento multi-tenant
        colegio_id: userData.colegio_id || null
      };
      
      // Guardar cualquier campo adicional que no esté ya en sessionData
      for (const [key, value] of Object.entries(userData)) {
        if (!(key in sessionData) && value !== undefined && key !== 'password_hash') {
          sessionData[key] = value;
        }
      }
    }
    
    // Guardar sesión
    const saved = setUser(sessionData);
    
    if (!saved) {
      return errorResult('Error al guardar la sesión', 'SESSION_ERROR');
    }
    
    Logger.success('Login exitoso:', sessionData.id);
    
    // Redirección automática
    if (autoRedirect) {
      await redirectToDashboard({ checkFirstTime });
    }
    
    return successResult(sessionData);
    
  } catch (error) {
    Logger.error('Error en login:', error);
    return errorResult(formatError(error), 'NETWORK_ERROR');
  }
}

/**
 * Verifica la contraseña del usuario
 * 
 * IMPORTANTE: Esta función debe adaptarse a tu sistema de contraseñas.
 * Opciones comunes:
 * 1. Hash SHA-256: Comparar hash del password con el almacenado (implementado)
 * 2. Supabase Auth: No necesitas verificar manualmente
 * 3. bcrypt: Usar una función de verificación en el servidor
 * 
 * @param {string} inputPassword - Contraseña ingresada
 * @param {Object} userData - Datos del usuario de la BD
 * @param {Function} hasher - Función de hash personalizada
 * @returns {Promise<boolean>}
 */
async function verifyPassword(inputPassword, userData, hasher = null) {
  // Buscar campo de contraseña (puede tener diferentes nombres)
  const storedPassword = userData.password || userData.password_hash || userData.contrasena;
  
  if (!storedPassword) {
    Logger.warn('No se encontró campo de contraseña. Considera usar Supabase Auth.');
    Logger.warn('Campos disponibles en userData:', Object.keys(userData));
    return false;
  }
  
  // Limpiar el hash almacenado (eliminar espacios al inicio/final)
  const storedPasswordClean = String(storedPassword).trim();
  
  Logger.log('🔐 Verificando contraseña:');
  Logger.log('  - Contraseña ingresada:', inputPassword ? '***' : 'vacía');
  Logger.log('  - Hash almacenado (primeros 20 chars):', storedPasswordClean.substring(0, 20) + '...');
  Logger.log('  - Longitud hash almacenado:', storedPasswordClean.length);
  
  // Si hay hasher personalizado, usarlo
  if (hasher && typeof hasher === 'function') {
    const hashedInput = await hasher(inputPassword);
    Logger.log('  - Hash generado (primeros 20 chars):', hashedInput.substring(0, 20) + '...');
    const match = hashedInput === storedPasswordClean;
    Logger.log('  - ¿Coinciden?:', match);
    return match;
  }
  
  // Hash SHA-256 por defecto
  const hashedInput = await hashPassword(inputPassword);
  Logger.log('  - Hash SHA-256 generado (primeros 20 chars):', hashedInput.substring(0, 20) + '...');
  Logger.log('  - Longitud hash generado:', hashedInput.length);
  
  // Comparar con contraseña almacenada (sin espacios)
  const match = hashedInput === storedPasswordClean;
  Logger.log('  - ¿Coinciden?:', match);
  
  if (match) {
    Logger.success('✅ Contraseña correcta');
    return true;
  }
  
  // Debug: mostrar diferencias si no coinciden
  if (!match && CONFIG.DEBUG_MODE) {
    Logger.warn('⚠️ Los hashes no coinciden. Comparando caracter por caracter...');
    for (let i = 0; i < Math.min(hashedInput.length, storedPasswordClean.length); i++) {
      if (hashedInput[i] !== storedPasswordClean[i]) {
        Logger.warn(`  Diferencia en posición ${i}: generado="${hashedInput[i]}" vs almacenado="${storedPasswordClean[i]}"`);
        break;
      }
    }
  }
  
  // Fallback: comparación directa (solo para desarrollo, NO usar en producción)
  if (inputPassword === storedPasswordClean) {
    Logger.warn('Contraseña almacenada en texto plano detectada. INSEGURO.');
    return true;
  }
  
  Logger.warn('❌ Contraseña incorrecta');
  return false;
}

/**
 * Registra un nuevo usuario en el sistema
 * 
 * @param {Object} userData - Datos del usuario a registrar
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña del usuario
 * @param {string} userData.nombre - Nombre del usuario
 * @param {string} userData.tipo_usuario - Tipo/rol del usuario
 * @param {Object} options - Opciones adicionales
 * @param {boolean} options.autoLogin - Iniciar sesión automáticamente después del registro (default: true)
 * 
 * @returns {Promise<AuthResult>} Resultado del registro
 * 
 * @example
 * const result = await register({
 *   email: 'nuevo@ejemplo.com',
 *   password: 'Password123',
 *   nombre: 'Juan Pérez',
 *   tipo_usuario: 'estudiante'
 * });
 */
export async function register(userData, options = {}) {
  const {
    autoLogin = true
  } = options;
  
  // Validar configuración
  if (!validateConfig()) {
    return errorResult('Error de configuración. Contacta al administrador.', 'CONFIG_ERROR');
  }
  
  // Validación de campos requeridos
  if (!userData.email || !userData.password || !userData.nombre || !userData.tipo_usuario) {
    return errorResult('Todos los campos son requeridos', 'MISSING_FIELDS');
  }
  
  // Validar formato de email
  if (!isValidEmail(userData.email)) {
    return errorResult('El formato del email no es válido', 'INVALID_EMAIL');
  }
  
  // Validar fortaleza de contraseña
  const passwordValidation = validatePasswordStrength(userData.password);
  if (!passwordValidation.valid) {
    return errorResult(passwordValidation.errors.join('. '), 'WEAK_PASSWORD');
  }
  
  // Validar rol
  if (!CONFIG.VALID_ROLES.includes(userData.tipo_usuario.toLowerCase())) {
    return errorResult(`Rol inválido. Roles válidos: ${CONFIG.VALID_ROLES.join(', ')}`, 'INVALID_ROLE');
  }
  
  const trimmedEmail = userData.email.trim().toLowerCase();
  
  try {
    Logger.log('Intentando registrar usuario:', trimmedEmail);
    
    // Hashear contraseña antes de guardar
    const passwordHash = await hashPassword(userData.password);
    
    // Preparar datos para insertar
    const newUser = {
      email: trimmedEmail,
      password_hash: passwordHash,
      nombre: userData.nombre.trim(),
      tipo_usuario: userData.tipo_usuario.toLowerCase(),
      activo: true,
      primera_vez: true // Primera vez = debe cambiar contraseña
    };
    
    // Insertar usuario en Supabase
    const insertUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}`;
    
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(newUser)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      Logger.error('Error al registrar usuario:', errorData);
      
      if (response.status === 409 || errorData.message?.includes('duplicate') || errorData.message?.includes('unique')) {
        return errorResult('Este email ya está registrado', 'EMAIL_EXISTS');
      }
      
      return errorResult(formatError(errorData), 'REGISTRATION_ERROR');
    }
    
    const createdUser = await response.json();
    const user = Array.isArray(createdUser) ? createdUser[0] : createdUser;
    
    Logger.success('Usuario registrado:', user.id);
    
    // Auto-login si está habilitado
    if (autoLogin) {
      return await login(trimmedEmail, userData.password, {
        autoRedirect: true,
        checkFirstTime: true
      });
    }
    
    return successResult({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.tipo_usuario
    });
    
  } catch (error) {
    Logger.error('Error en registro:', error);
    return errorResult(formatError(error), 'NETWORK_ERROR');
  }
}

/**
 * Solicita recuperación de contraseña
 * Envía un token de recuperación (implementación básica - ajustar según necesidades)
 * 
 * @param {string} email - Email del usuario
 * @returns {Promise<AuthResult>} Resultado de la solicitud
 * 
 * @example
 * const result = await requestPasswordReset('usuario@ejemplo.com');
 * if (result.success) {
 *   console.log('Se ha enviado un email con instrucciones');
 * }
 */
export async function requestPasswordReset(email) {
  if (!validateConfig()) {
    return errorResult('Error de configuración', 'CONFIG_ERROR');
  }
  
  if (!email || !isValidEmail(email)) {
    return errorResult('Email inválido', 'INVALID_EMAIL');
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  try {
    Logger.log('Solicitando recuperación de contraseña para:', trimmedEmail);
    
    // Verificar que el usuario existe (campos compatibles con BD sin colegio_id)
    let queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?email=eq.${encodeURIComponent(trimmedEmail)}&select=${getUsuarioSelectFields()}`;
    let response = await fetch(queryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
    if (!response.ok && response.status === 400) {
      let body = {};
      try { body = await response.json(); } catch (_) {}
      if (isErrorColegioIdInexistente(body)) {
        markBDSinColegioId();
        queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?email=eq.${encodeURIComponent(trimmedEmail)}&select=${getUsuarioSelectFields()}`;
        response = await fetch(queryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
      }
    }
    if (!response.ok) {
      return errorResult('Error al conectar con el servidor', 'SERVER_ERROR');
    }
    const users = await response.json();
    
    if (!users || users.length === 0) {
      // Por seguridad, no revelar si el email existe o no
      Logger.warn('Usuario no encontrado (no se revela al usuario)');
      return successResult({ message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña' });
    }
    
    // Generar token de recuperación (UUID simple)
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hora
    
    // Guardar token en localStorage temporalmente (en producción, usar backend)
    // NOTA: En producción, esto debería manejarse en el backend y enviarse por email
    localStorage.setItem(`reset_token_${trimmedEmail}`, JSON.stringify({
      token: resetToken,
      expiry: resetTokenExpiry
    }));
    
    Logger.success('Token de recuperación generado');
    
    // En producción, aquí deberías:
    // 1. Guardar el token en la base de datos
    // 2. Enviar email con el link de recuperación
    // 3. El link debería apuntar a una página con el token
    
    return successResult({
      message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña',
      token: resetToken // Solo para desarrollo - remover en producción
    });
    
  } catch (error) {
    Logger.error('Error en solicitud de recuperación:', error);
    return errorResult(formatError(error), 'NETWORK_ERROR');
  }
}

/**
 * Restablece la contraseña usando un token de recuperación
 * 
 * @param {string} email - Email del usuario
 * @param {string} token - Token de recuperación
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<AuthResult>} Resultado del restablecimiento
 * 
 * @example
 * const result = await resetPassword('usuario@ejemplo.com', 'token123', 'NewPassword123');
 */
export async function resetPassword(email, token, newPassword) {
  if (!validateConfig()) {
    return errorResult('Error de configuración', 'CONFIG_ERROR');
  }
  
  if (!email || !token || !newPassword) {
    return errorResult('Todos los campos son requeridos', 'MISSING_FIELDS');
  }
  
  if (!isValidEmail(email)) {
    return errorResult('Email inválido', 'INVALID_EMAIL');
  }
  
  // Validar fortaleza de contraseña
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    return errorResult(passwordValidation.errors.join('. '), 'WEAK_PASSWORD');
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  try {
    Logger.log('Restableciendo contraseña para:', trimmedEmail);
    
    // Verificar token (en producción, esto debería hacerse en el backend)
    const tokenKey = `reset_token_${trimmedEmail}`;
    const tokenData = localStorage.getItem(tokenKey);
    
    if (!tokenData) {
      return errorResult('Token inválido o expirado', 'INVALID_TOKEN');
    }
    
    const { token: storedToken, expiry } = JSON.parse(tokenData);
    
    if (token !== storedToken) {
      return errorResult('Token inválido', 'INVALID_TOKEN');
    }
    
    if (Date.now() > expiry) {
      localStorage.removeItem(tokenKey);
      return errorResult('Token expirado', 'EXPIRED_TOKEN');
    }
    
    // Hashear nueva contraseña
    const passwordHash = await hashPassword(newPassword);
    
    // Actualizar contraseña en Supabase
    const updateUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?email=eq.${encodeURIComponent(trimmedEmail)}`;
    
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        password_hash: passwordHash,
        primera_vez: false // Ya no es primera vez
      })
    });
    
    if (!response.ok) {
      return errorResult('Error al actualizar la contraseña', 'UPDATE_ERROR');
    }
    
    // Limpiar token usado
    localStorage.removeItem(tokenKey);
    
    Logger.success('Contraseña restablecida exitosamente');
    
    return successResult({
      message: 'Contraseña restablecida exitosamente. Puedes iniciar sesión ahora.'
    });
    
  } catch (error) {
    Logger.error('Error al restablecer contraseña:', error);
    return errorResult(formatError(error), 'NETWORK_ERROR');
  }
}

/**
 * Cambia la contraseña del usuario autenticado
 * 
 * @param {string} currentPassword - Contraseña actual
 * @param {string} newPassword - Nueva contraseña
 * @returns {Promise<AuthResult>} Resultado del cambio
 * 
 * @example
 * const result = await changePassword('oldPassword123', 'NewPassword123');
 */
export async function changePassword(currentPassword, newPassword) {
  const user = getUser();
  
  if (!user) {
    return errorResult('Debes estar autenticado para cambiar tu contraseña', 'NOT_AUTHENTICATED');
  }
  
  if (!currentPassword || !newPassword) {
    return errorResult('Ambas contraseñas son requeridas', 'MISSING_FIELDS');
  }
  
  // Si es la misma contraseña (confirmar y continuar), no validar fortaleza
  const mismaContrasena = currentPassword === newPassword;
  if (!mismaContrasena) {
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return errorResult(passwordValidation.errors.join('. '), 'WEAK_PASSWORD');
    }
  }
  
  try {
    Logger.log('Cambiando contraseña para usuario:', user.id, 'Rol:', user.role);
    
    // Determinar si es acudiente o usuario normal
    const isAcudiente = user.role === 'acudiente' || user.role === 'guardian';
    const table = isAcudiente ? CONFIG.ACUDIENTES_TABLE : CONFIG.USERS_TABLE;
    const fields = isAcudiente ? CONFIG.ACUDIENTE_FIELDS.join(',') : getUsuarioSelectFields();
    
    Logger.log('Buscando en tabla:', table);
    
    const queryUrl = `${CONFIG.API_BASE}/${table}?id=eq.${user.id}&select=${fields}`;
    
    let response = await fetch(queryUrl, {
      method: 'GET',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit'
    });
    if (!response.ok && response.status === 400 && !isAcudiente) {
      let body = {};
      try { body = await response.json(); } catch (_) {}
      if (isErrorColegioIdInexistente(body)) {
        markBDSinColegioId();
        const safeFields = getUsuarioSelectFields();
        const retryUrl = `${CONFIG.API_BASE}/${table}?id=eq.${user.id}&select=${safeFields}`;
        response = await fetch(retryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
      }
    }
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sin detalles');
      Logger.error('Error al buscar usuario:', errorText);
      return errorResult('Error al verificar contraseña actual', 'VERIFY_ERROR');
    }
    const users = await response.json();
    if (!users || users.length === 0) {
      Logger.error('Usuario no encontrado en tabla:', table);
      return errorResult('Usuario no encontrado', 'USER_NOT_FOUND');
    }
    const userData = users[0];
    Logger.log('Usuario encontrado, verificando contraseña...');
    
    const isCurrentPasswordValid = await verifyPassword(currentPassword, userData);
    
    if (!isCurrentPasswordValid) {
      Logger.warn('Contraseña actual incorrecta');
      return errorResult('La contraseña actual es incorrecta', 'INVALID_CURRENT_PASSWORD');
    }
    
    Logger.log('Contraseña actual correcta, actualizando...');
    
    const updateUrl = `${CONFIG.API_BASE}/${table}?id=eq.${user.id}`;
    const updateBody = mismaContrasena
      ? { primera_vez: false }
      : { password_hash: await hashPassword(newPassword), primera_vez: false };
    
    Logger.log('Actualizando en:', updateUrl);
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: CONFIG.HEADERS,
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(updateBody)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text().catch(() => 'Sin detalles');
      Logger.error('Error al actualizar contraseña:', errorText);
      return errorResult('Error al actualizar la contraseña', 'UPDATE_ERROR');
    }
    
    // Actualizar sesión
    updateUser({ primera_vez: false });
    
    Logger.success('Contraseña cambiada exitosamente');
    
    return successResult({
      message: 'Contraseña cambiada exitosamente'
    });
    
  } catch (error) {
    Logger.error('Error al cambiar contraseña:', error);
    return errorResult(formatError(error), 'NETWORK_ERROR');
  }
}

/**
 * Cierra la sesión del usuario
 * 
 * @param {Object} options
 * @param {boolean} options.redirect - Redirigir al login (default: true)
 * @param {boolean} options.revokeToken - Revocar token en Supabase (default: false)
 */
export async function logout(options = {}) {
  const {
    redirect = true,
    revokeToken = false
  } = options;
  
  try {
    // Revocar token si es necesario
    if (revokeToken) {
      const user = getUser();
      if (user?.access_token) {
        await revokeAccessToken(user.access_token);
      }
    }
    
    // Limpiar sesión
    clearSession();
    
    Logger.success('Logout completado');
    
    // Redirigir
    if (redirect) {
      const loginUrl = getLoginUrl();
      window.location.replace(loginUrl);
    }
    
  } catch (error) {
    Logger.error('Error en logout:', error);
    // Forzar limpieza y redirección de todas formas
    clearSession();
    if (redirect) {
      window.location.replace(getLoginUrl());
    }
  }
}

/**
 * Revoca un access token en Supabase
 * 
 * @param {string} accessToken 
 */
async function revokeAccessToken(accessToken) {
  try {
    const logoutUrl = `${CONFIG.SUPABASE_URL}/auth/v1/logout`;
    
    await fetch(logoutUrl, {
      method: 'POST',
      headers: {
        'apikey': CONFIG.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    Logger.log('Token revocado');
  } catch (error) {
    Logger.warn('Error al revocar token:', error);
  }
}

/**
 * Obtiene los datos del estudiante hijo de un acudiente
 * 
 * @param {string} estudianteId - ID del estudiante
 * @returns {Promise<Object|null>} Datos del estudiante o null
 * 
 * @example
 * const estudiante = await getEstudianteHijo(user.estudiante_id);
 */
export async function getEstudianteHijo(estudianteId) {
  if (!estudianteId) {
    Logger.warn('getEstudianteHijo: No se proporcionó estudiante_id');
    return null;
  }
  
  try {
    let queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?id=eq.${estudianteId}&select=${getUsuarioSelectFields()}`;
    let response = await fetch(queryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
    if (!response.ok && response.status === 400) {
      let body = {};
      try { body = await response.json(); } catch (_) {}
      if (isErrorColegioIdInexistente(body)) {
        markBDSinColegioId();
        queryUrl = `${CONFIG.API_BASE}/${CONFIG.USERS_TABLE}?id=eq.${estudianteId}&select=${getUsuarioSelectFields()}`;
        response = await fetch(queryUrl, { method: 'GET', headers: CONFIG.HEADERS, mode: 'cors', credentials: 'omit' });
      }
    }
    if (!response.ok) {
      Logger.error('Error al obtener estudiante hijo');
      return null;
    }
    const estudiantes = await response.json();
    return estudiantes && estudiantes.length > 0 ? estudiantes[0] : null;
    
  } catch (error) {
    Logger.error('Error al obtener estudiante hijo:', error);
    return null;
  }
}

// Sesión
export { 
  getUser, 
  setUser, 
  isAuthenticated, 
  hasRole, 
  getEffectiveRole,
  updateUser,
  extendSession,
  clearSession
};

// Redirección
export { 
  requireAuth, 
  requireRole, 
  redirectToDashboard, 
  getDashboardUrl, 
  getLoginUrl 
};

// Utilidades
export { buildUrl, Logger };

// ============================================
// EXPORTACIÓN POR DEFECTO
// ============================================

export default {
  // Autenticación
  login,
  register,
  logout,
  requestPasswordReset,
  resetPassword,
  changePassword,
  
  // Sesión
  getUser,
  setUser,
  isAuthenticated,
  hasRole,
  getEffectiveRole,
  updateUser,
  extendSession,
  clearSession,
  
  // Autorización
  requireAuth,
  requireRole,
  
  // Redirección
  redirectToDashboard,
  getDashboardUrl,
  getLoginUrl,
  
  // Acudientes
  getEstudianteHijo,
  
  // Utilidades
  buildUrl,
  Logger
};
