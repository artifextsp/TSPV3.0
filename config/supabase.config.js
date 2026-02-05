// ============================================
// CONFIGURACIÓN DE SUPABASE
// Thinking Skills Program v2 - Sistema de Autenticación
// ============================================

/**
 * ⚠️ CONFIGURACIÓN DE THINKING SKILLS PROGRAM
 * 
 * Este archivo contiene la configuración necesaria para conectar
 * la plataforma Thinking Skills Program v2 con Supabase.
 * 
 * Credenciales configuradas para el proyecto TSP.
 */

// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================

const CONFIG = {
  // ═══════════════════════════════════════════
  // 🔴 CREDENCIALES DE SUPABASE - TSP
  // ═══════════════════════════════════════════
  
  /**
   * URL del proyecto Supabase de Thinking Skills Program
   */
  SUPABASE_URL: 'https://rxqiimwqlisnurgmtmtw.supabase.co',
  
  /**
   * Anon Key (clave pública) de Supabase
   * Esta clave es segura para exponer en el frontend
   * 
   * ⚠️ IMPORTANTE: Asegúrate de tener RLS (Row Level Security) 
   * configurado en todas tus tablas
   */
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWlpbXdxbGlzbnVyZ210bXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjcyNzcsImV4cCI6MjA3NzAwMzI3N30.meJx3YvbvwQJHvfLs52DZ9LppSJIVbBvyAVPqJfi9wg',
  
  // ═══════════════════════════════════════════
  // 🟡 CONFIGURACIÓN DE SESIÓN - TSP
  // ═══════════════════════════════════════════
  
  /**
   * Clave para almacenar la sesión en localStorage
   * Nombre único para Thinking Skills Program
   */
  STORAGE_KEY: 'tsp_user_session',
  
  /**
   * Duración de la sesión en horas
   * Después de este tiempo, el usuario deberá volver a autenticarse
   */
  SESSION_DURATION_HOURS: 24,
  
  /**
   * Lista de roles válidos en Thinking Skills Program
   * 
   * Roles del sistema:
   * - estudiante: Realizan las prácticas
   * - docente: Dirigen las prácticas, visualizan resultados en tiempo real
   * - rector: Visualizan resultados y estadísticas
   * - acudiente: Visualizan resultados de prácticas de su hijo/a
   * 
   * NOTA: El sistema también acepta roles legacy ('usuario', 'admin', etc.)
   * y los mapea automáticamente a los roles válidos durante la migración.
   */
  VALID_ROLES: [
    'estudiante',  // Realizan las prácticas
    'docente',     // Dirigen las prácticas, visualizan resultados en tiempo real
    'rector',      // Visualizan resultados y estadísticas
    'acudiente',   // Visualizan resultados de prácticas de su hijo/a
    'admin'        // Administradores del sistema (gestión completa)
  ],
  
  /**
   * Nombre de la tabla de usuarios en Supabase
   * Ya existe con datos migrados desde estudiantes
   */
  USERS_TABLE: 'usuarios',
  
  /**
   * Nombre de la tabla de acudientes en Supabase
   * Tabla separada para acudientes (padres/madres)
   */
  ACUDIENTES_TABLE: 'acudientes',
  
  /**
   * Campo que identifica el tipo/rol del usuario en tu tabla
   * Ajusta según el nombre del campo en tu tabla migrada
   */
  USER_ROLE_FIELD: 'tipo_usuario',
  
  /**
   * Campos a extraer del usuario después del login
   * Incluye campos mínimos de autenticación + campos adicionales del sistema anterior
   * Ajusta según los campos disponibles en tu tabla usuarios
   * 
   * ⚠️ IMPORTANTE: password_hash DEBE estar incluido para que funcione la autenticación
   */
  USER_FIELDS: [
    'id',
    'email',
    // 'username',       // ⚠️ NO EXISTE EN LA TABLA - Comentado
    'password_hash',  // ⚠️ OBLIGATORIO para verificación de contraseña
    'nombre',
    'apellidos',      // Campo adicional del sistema anterior
    'tipo_usuario',
    'codigo_estudiante',  // Campo adicional del sistema anterior
    'activo',
    'primera_vez',
    'grado',          // Campo adicional del sistema anterior
    'created_at',
    'updated_at'
    // Añade aquí más campos adicionales de tu sistema anterior que necesites mantener
  ],
  
  /**
   * Campos a extraer del acudiente después del login
   * Campos de la tabla acudientes
   */
  ACUDIENTE_FIELDS: [
    'id',
    'email',
    'username',       // Nombre de usuario simple (ACU001, ACU002, etc.)
    'password_hash',  // ⚠️ OBLIGATORIO para verificación de contraseña
    'nombre',
    'apellidos',
    'celular',
    'estudiante_id',  // ID del hijo/a (estudiante)
    'activo',
    'primera_vez',
    'created_at',
    'updated_at'
  ],
  
  // ═══════════════════════════════════════════
  // 🟢 CONFIGURACIÓN AVANZADA
  // ═══════════════════════════════════════════
  
  /**
   * Habilitar logs de depuración en consola
   * Desactivar en producción para mejor rendimiento
   */
  DEBUG_MODE: true,
  
  /**
   * Prefijo para los logs en consola
   */
  LOG_PREFIX: '[TSP-AUTH]',
  
  /**
   * Página de login por defecto
   */
  DEFAULT_LOGIN_PAGE: 'index.html',
  
  /**
   * Headers adicionales para las peticiones a Supabase
   */
  get HEADERS() {
    return {
      'apikey': this.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${this.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },
  
  /**
   * URL base de la API REST de Supabase
   */
  get API_BASE() {
    return `${this.SUPABASE_URL}/rest/v1`;
  },

  /**
   * Proxy CORS (opcional). Si está definido, las peticiones a la API REST se hacen
   * a través de esta URL para evitar CORS en GitHub Pages / producción.
   * Despliega el proxy en Vercel (carpeta api/) y pon aquí la URL, por ejemplo:
   * API_PROXY_URL: 'https://tspv3-xxx.vercel.app/api/supabase-proxy'
   * Ver PROXY_CORS_README.md para pasos completos.
   */
  API_PROXY_URL: null
};

// ============================================
// VALIDACIÓN DE CONFIGURACIÓN
// ============================================

/**
 * Valida que la configuración esté correctamente establecida
 * Lanza error si faltan valores obligatorios
 */
function validateConfig() {
  const errors = [];
  
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.includes('TU-PROYECTO')) {
    errors.push('SUPABASE_URL no está configurada');
  }
  
  if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY.includes('TU-KEY-AQUI')) {
    errors.push('SUPABASE_ANON_KEY no está configurada');
  }
  
  if (!CONFIG.STORAGE_KEY) {
    errors.push('STORAGE_KEY no está definida');
  }
  
  if (errors.length > 0) {
    console.error('❌ Error de configuración de Supabase:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('📝 Edita el archivo config/supabase.config.js con tus valores');
    return false;
  }
  
  return true;
}

// ============================================
// EXPORTACIONES
// ============================================

// Validar al cargar (solo muestra advertencia, no bloquea)
if (typeof window !== 'undefined') {
  validateConfig();
}

export { CONFIG, validateConfig };
export default CONFIG;
