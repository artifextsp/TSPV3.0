// ============================================
// MÓDULO ADMINISTRATIVO - CRUD OPERATIONS
// Thinking Skills Program v2 - Dashboard Administrativo
// ============================================

/**
 * Este módulo contiene todas las funciones CRUD para el dashboard administrativo:
 * - Gestión de Estudiantes
 * - Gestión de Colegios
 * - Gestión de Docentes
 * - Operaciones especiales (resetear contraseñas, asignar estudiantes a colegios)
 */

import { CONFIG } from '../config/supabase.config.js';
import { hashPassword } from '../auth/auth.utils.js';

// ============================================
// CONFIGURACIÓN DE TABLAS
// ============================================

const TABLES = {
  USUARIOS: 'usuarios',
  COLEGIOS: 'colegios',
  ESTUDIANTES_COLEGIOS: 'estudiantes_colegios',
  DOCENTES_COLEGIOS: 'docentes_colegios',
  ACUDIENTES: 'acudientes'
};

// ============================================
// UTILIDADES
// ============================================

/**
 * Realiza una petición a Supabase REST API
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${CONFIG.API_BASE}/${endpoint}`;
  const defaultOptions = {
    method: options.method || 'GET',
    headers: CONFIG.HEADERS,
    ...options
  };
  
  // Si hay body, asegurarse de que sea JSON string
  if (defaultOptions.body && typeof defaultOptions.body !== 'string') {
    defaultOptions.body = JSON.stringify(defaultOptions.body);
  }
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    // Si la respuesta está vacía, retornar null
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return Array.isArray(data) ? data : (data || null);
    }
    
    return null;
  } catch (error) {
    console.error('Error en apiRequest:', error);
    throw error;
  }
}

/**
 * Genera código de estudiante automático (EST0001, EST0002, etc.)
 */
async function generarCodigoEstudiante() {
  try {
    // Construir URL correctamente codificada
    const params = new URLSearchParams();
    params.append('codigo_estudiante', 'like.EST%');
    params.append('select', 'codigo_estudiante');
    params.append('order', 'codigo_estudiante.desc');
    params.append('limit', '1');
    
    const estudiantes = await apiRequest(
      `${TABLES.USUARIOS}?${params.toString()}`
    );
    
    if (!estudiantes || estudiantes.length === 0) {
      return 'EST0001';
    }
    
    const ultimoCodigo = estudiantes[0].codigo_estudiante;
    const match = ultimoCodigo.match(/\d+/);
    
    if (match) {
      const numero = parseInt(match[0]) + 1;
      return 'EST' + String(numero).padStart(4, '0');
    }
    
    return 'EST0001';
  } catch (error) {
    console.error('Error generando código de estudiante:', error);
    // Si falla, retornar un código por defecto basado en timestamp
    const timestamp = Date.now();
    const numero = (timestamp % 10000) + 1;
    return 'EST' + String(numero).padStart(4, '0');
  }
}

/**
 * Genera username de estudiante automático (TSP001, TSP002, etc.)
 */
async function generarUsernameEstudiante() {
  try {
    // Construir URL correctamente codificada
    const params = new URLSearchParams();
    params.append('codigo_estudiante', 'like.EST%');
    params.append('select', 'codigo_estudiante');
    params.append('order', 'codigo_estudiante.desc');
    params.append('limit', '1');
    
    const estudiantes = await apiRequest(
      `${TABLES.USUARIOS}?${params.toString()}`
    );
    
    if (!estudiantes || estudiantes.length === 0) {
      return 'TSP001';
    }
    
    const ultimoCodigo = estudiantes[0].codigo_estudiante;
    const match = ultimoCodigo.match(/\d+/);
    
    if (match) {
      const numero = parseInt(match[0]);
      return 'TSP' + String(numero).padStart(3, '0');
    }
    
    return 'TSP001';
  } catch (error) {
    console.error('Error generando username de estudiante:', error);
    return 'TSP001';
  }
}

// ============================================
// MÓDULO: ESTUDIANTES
// ============================================

export const EstudiantesAPI = {
  /**
   * Obtener todos los estudiantes
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    params.append('codigo_estudiante', 'like.EST%');
    params.append('activo', 'eq.true');
    
    if (filtros.grado) {
      params.append('grado', `eq.${filtros.grado}`);
    }
    
    if (filtros.buscar) {
      params.append('or', `(nombre.ilike.%${filtros.buscar}%,apellidos.ilike.%${filtros.buscar}%,codigo_estudiante.ilike.%${filtros.buscar}%)`);
    }
    
    params.append('select', 'id,email,nombre,apellidos,codigo_estudiante,grado,activo,created_at');
    params.append('order', 'codigo_estudiante');
    
    return await apiRequest(`${TABLES.USUARIOS}?${params.toString()}`);
  },
  
  /**
   * Obtener un estudiante por ID
   */
  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.USUARIOS}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },
  
  /**
   * Crear nuevo estudiante
   */
  async crear(datos) {
    // Verificar si el email ya existe antes de crear
    try {
      const params = new URLSearchParams();
      params.append('email', `eq.${datos.email}`);
      params.append('select', 'id,nombre,apellidos,codigo_estudiante');
      
      const emailExistente = await apiRequest(
        `${TABLES.USUARIOS}?${params.toString()}`
      );
      
      if (emailExistente && emailExistente.length > 0) {
        const usuarioExistente = emailExistente[0];
        const nombreCompleto = `${usuarioExistente.nombre} ${usuarioExistente.apellidos || ''}`.trim();
        const codigo = usuarioExistente.codigo_estudiante || 'N/A';
        throw new Error(`El email "${datos.email}" ya está registrado para el usuario: ${nombreCompleto} (${codigo}). Por favor, usa un email diferente o edita el usuario existente.`);
      }
    } catch (error) {
      // Si el error es sobre email duplicado, relanzarlo
      if (error.message && error.message.includes('ya está registrado')) {
        throw error;
      }
      // Si es otro error (como CORS o red), continuar con la creación
      // y dejar que el servidor valide el constraint
      console.warn('No se pudo verificar email duplicado, continuando:', error);
    }
    
    // Generar código y username si no se proporcionan
    if (!datos.codigo_estudiante) {
      datos.codigo_estudiante = await generarCodigoEstudiante();
    }
    
    // Hash de contraseña por defecto (123456)
    if (!datos.password_hash) {
      datos.password_hash = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'; // Hash de "123456"
    }
    
    // Valores por defecto
    // Usar 'usuario' como valor por defecto (el constraint lo permite)
    // El sistema mapea automáticamente 'usuario' → 'estudiante' en el frontend
    datos.tipo_usuario = 'usuario';  // Cambiado de 'estudiante' a 'usuario' para cumplir con el constraint
    datos.activo = datos.activo !== undefined ? datos.activo : true;
    datos.primera_vez = datos.primera_vez !== undefined ? datos.primera_vez : true;
    
    try {
      return await apiRequest(`${TABLES.USUARIOS}`, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
    } catch (error) {
      // Manejar error de email duplicado con mensaje más claro
      if (error.message) {
        if (error.message.includes('23505') && error.message.includes('usuarios_email_key')) {
          // Intentar obtener información del usuario existente
          try {
            const params = new URLSearchParams();
            params.append('email', `eq.${datos.email}`);
            params.append('select', 'nombre,apellidos,codigo_estudiante');
            const existente = await apiRequest(`${TABLES.USUARIOS}?${params.toString()}`);
            if (existente && existente.length > 0) {
              const u = existente[0];
              const nombreCompleto = `${u.nombre} ${u.apellidos || ''}`.trim();
              const codigo = u.codigo_estudiante || 'N/A';
              throw new Error(`El email "${datos.email}" ya está registrado para: ${nombreCompleto} (${codigo}). Usa un email diferente o edita el usuario existente.`);
            }
          } catch (innerError) {
            // Si ya tiene un mensaje personalizado, usarlo
            if (innerError.message && innerError.message.includes('ya está registrado')) {
              throw innerError;
            }
          }
          throw new Error(`El email "${datos.email}" ya está registrado en el sistema. Por favor, usa un email diferente.`);
        }
      }
      throw error;
    }
  },
  
  /**
   * Actualizar estudiante
   */
  async actualizar(id, datos) {
    datos.updated_at = new Date().toISOString();
    
    return await apiRequest(`${TABLES.USUARIOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },
  
  /**
   * Eliminar estudiante (soft delete)
   */
  async eliminar(id) {
    return await this.actualizar(id, { activo: false });
  },
  
  /**
   * Resetear contraseña de estudiante
   */
  async resetearPassword(id, nuevaPassword = '123456') {
    const passwordHash = await hashPassword(nuevaPassword);
    
    return await this.actualizar(id, {
      password_hash: passwordHash,
      primera_vez: true
    });
  }
};

// ============================================
// MÓDULO: COLEGIOS
// ============================================

export const ColegiosAPI = {
  /**
   * Obtener todos los colegios
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    params.append('activo', 'eq.true');
    
    if (filtros.buscar) {
      params.append('or', `(nombre.ilike.%${filtros.buscar}%,codigo.ilike.%${filtros.buscar}%,nombre_rector.ilike.%${filtros.buscar}%)`);
    }
    
    params.append('select', '*');
    params.append('order', 'codigo');
    
    return await apiRequest(`${TABLES.COLEGIOS}?${params.toString()}`);
  },
  
  /**
   * Obtener un colegio por ID
   */
  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.COLEGIOS}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },
  
  /**
   * Crear nuevo colegio
   */
  async crear(datos) {
    // El código se genera automáticamente en la base de datos
    datos.activo = datos.activo !== undefined ? datos.activo : true;
    
    return await apiRequest(`${TABLES.COLEGIOS}`, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  },
  
  /**
   * Actualizar colegio
   */
  async actualizar(id, datos) {
    datos.updated_at = new Date().toISOString();
    
    return await apiRequest(`${TABLES.COLEGIOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },
  
  /**
   * Eliminar colegio (soft delete)
   */
  async eliminar(id) {
    return await this.actualizar(id, { activo: false });
  },
  
  /**
   * Obtener estudiantes asignados a un colegio
   */
  async obtenerEstudiantes(colegioId) {
    const params = new URLSearchParams();
    params.append('colegio_id', `eq.${colegioId}`);
    params.append('select', `*,usuarios:estudiante_id(*)`);
    
    return await apiRequest(`${TABLES.ESTUDIANTES_COLEGIOS}?${params.toString()}`);
  },
  
  /**
   * Asignar estudiante a colegio
   */
  async asignarEstudiante(colegioId, estudianteId) {
    // Verificar si ya existe una asignación para este estudiante
    const existente = await apiRequest(
      `${TABLES.ESTUDIANTES_COLEGIOS}?estudiante_id=eq.${estudianteId}&select=id`
    );
    
    if (existente && existente.length > 0) {
      // Actualizar asignación existente
      return await apiRequest(
        `${TABLES.ESTUDIANTES_COLEGIOS}?estudiante_id=eq.${estudianteId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ colegio_id: colegioId })
        }
      );
    } else {
      // Crear nueva asignación
      return await apiRequest(`${TABLES.ESTUDIANTES_COLEGIOS}`, {
        method: 'POST',
        body: JSON.stringify({
          colegio_id: colegioId,
          estudiante_id: estudianteId
        })
      });
    }
  },
  
  /**
   * Remover estudiante de colegio
   */
  async removerEstudiante(estudianteId) {
    return await apiRequest(
      `${TABLES.ESTUDIANTES_COLEGIOS}?estudiante_id=eq.${estudianteId}`,
      {
        method: 'DELETE'
      }
    );
  }
};

// ============================================
// MÓDULO: DOCENTES
// ============================================

export const DocentesAPI = {
  /**
   * Obtener todos los docentes
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    params.append('tipo_usuario', 'eq.docente');
    params.append('activo', 'eq.true');
    
    if (filtros.buscar) {
      params.append('or', `(nombre.ilike.%${filtros.buscar}%,apellidos.ilike.%${filtros.buscar}%,email.ilike.%${filtros.buscar}%)`);
    }
    
    // Primero obtener los docentes básicos
    params.append('select', 'id,email,nombre,apellidos,celular,tipo_usuario,activo,created_at');
    params.append('order', 'nombre');
    
    try {
      const docentes = await apiRequest(`${TABLES.USUARIOS}?${params.toString()}`);
      
      // Intentar obtener información del colegio si la tabla existe
      if (docentes && docentes.length > 0) {
        try {
          const docenteIds = docentes.map(d => d.id).join(',');
          const asociaciones = await apiRequest(
            `${TABLES.DOCENTES_COLEGIOS}?docente_id=in.(${docenteIds})&select=docente_id,colegio_id,colegios(id,codigo,nombre)`
          );
          
          // Crear un mapa de docente_id -> colegio
          const colegioMap = {};
          if (asociaciones && Array.isArray(asociaciones)) {
            asociaciones.forEach(asc => {
              if (asc.colegios) {
                colegioMap[asc.docente_id] = {
                  colegio_id: asc.colegio_id,
                  colegios: asc.colegios
                };
              }
            });
          }
          
          // Agregar información del colegio a cada docente
          return docentes.map(doc => ({
            ...doc,
            docentes_colegios: colegioMap[doc.id] ? [colegioMap[doc.id]] : []
          }));
        } catch (error) {
          // Si falla la consulta de colegios (tabla no existe), retornar docentes sin colegio
          // Solo mostrar warning una vez, no en cada llamada
          if (!window._docentes_colegios_warning_shown) {
            console.warn('[DocentesAPI] La tabla docentes_colegios no existe. Los docentes se mostrarán sin información de colegio. Ejecuta crear_tabla_docentes_colegios.sql para habilitar esta funcionalidad.');
            window._docentes_colegios_warning_shown = true;
          }
          return docentes.map(doc => ({
            ...doc,
            docentes_colegios: []
          }));
        }
      }
      
      return docentes || [];
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Obtener un docente por ID
   */
  async obtener(id) {
    const params = new URLSearchParams();
    params.append('id', `eq.${id}`);
    params.append('tipo_usuario', 'eq.docente');
    params.append('select', '*');
    
    const resultado = await apiRequest(`${TABLES.USUARIOS}?${params.toString()}`);
    const docente = Array.isArray(resultado) ? resultado[0] : resultado;
    
    if (!docente) {
      return null;
    }
    
    // Intentar obtener información del colegio si la tabla existe
    try {
      const asociacion = await apiRequest(
        `${TABLES.DOCENTES_COLEGIOS}?docente_id=eq.${id}&select=colegio_id,colegios(id,codigo,nombre)`
      );
      
      if (asociacion && asociacion.length > 0 && asociacion[0].colegios) {
        docente.docentes_colegios = [{
          colegio_id: asociacion[0].colegio_id,
          colegios: asociacion[0].colegios
        }];
      } else {
        docente.docentes_colegios = [];
      }
    } catch (error) {
      // Si falla la consulta de colegios (tabla no existe), retornar docente sin colegio
      // No mostrar error, solo asignar array vacío
      docente.docentes_colegios = [];
    }
    
    return docente;
  },
  
  /**
   * Crear nuevo docente
   */
  async crear(datos) {
    // Hash de contraseña por defecto (temporal123)
    if (!datos.password_hash) {
      datos.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // Hash de "temporal123"
    }
    
    // Valores por defecto - IMPORTANTE: tipo_usuario debe ser 'docente'
    datos.tipo_usuario = 'docente';
    datos.activo = datos.activo !== undefined ? datos.activo : true;
    datos.primera_vez = datos.primera_vez !== undefined ? datos.primera_vez : true;
    
    // Limpiar campos vacíos (convertir strings vacíos a null)
    if (datos.celular === '' || datos.celular === undefined) {
      datos.celular = null;
    }
    
    // Guardar colegio_id si viene en los datos (se asociará después)
    const colegioId = datos.colegio_id;
    delete datos.colegio_id; // Remover del objeto antes de crear el usuario
    
    // Log para debugging (remover en producción si es necesario)
    console.log('[DocentesAPI.crear] Datos a enviar:', {
      ...datos,
      password_hash: '[HIDDEN]'
    });
    
    try {
      // Crear el docente
      const docente = await apiRequest(`${TABLES.USUARIOS}`, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
      
      // Si se proporcionó colegio_id, intentar asociar el docente al colegio
      if (colegioId && docente && docente[0]?.id) {
        try {
          await this.asociarAColegio(docente[0].id, colegioId);
        } catch (errorAsociar) {
          // Si falla la asociación (tabla no existe), continuar pero mostrar advertencia solo una vez
          if (!window._docentes_colegios_warning_shown) {
            console.warn('[DocentesAPI] La tabla docentes_colegios no existe. El docente se creó exitosamente pero no se pudo asociar al colegio. Ejecuta crear_tabla_docentes_colegios.sql para habilitar esta funcionalidad.');
            window._docentes_colegios_warning_shown = true;
          }
          // No lanzar el error, el docente ya se creó exitosamente
        }
      }
      
      return docente;
    } catch (error) {
      console.error('[DocentesAPI.crear] Error:', error);
      throw error;
    }
  },
  
  /**
   * Actualizar docente
   */
  async actualizar(id, datos) {
    datos.updated_at = new Date().toISOString();
    
    // Si viene colegio_id, actualizar la asociación
    if (datos.colegio_id !== undefined) {
      const colegioId = datos.colegio_id;
      delete datos.colegio_id;
      
      // Actualizar datos del docente
      await apiRequest(`${TABLES.USUARIOS}?id=eq.${id}&tipo_usuario=eq.docente`, {
        method: 'PATCH',
        body: JSON.stringify(datos)
      });
      
      // Actualizar asociación con colegio (si la tabla existe)
      if (colegioId) {
        try {
          await this.asociarAColegio(id, colegioId);
        } catch (errorAsociar) {
          // Si falla la asociación (tabla no existe), continuar pero mostrar advertencia solo una vez
          if (!window._docentes_colegios_warning_shown) {
            console.warn('[DocentesAPI] La tabla docentes_colegios no existe. El docente se actualizó exitosamente pero no se pudo asociar al colegio. Ejecuta crear_tabla_docentes_colegios.sql para habilitar esta funcionalidad.');
            window._docentes_colegios_warning_shown = true;
          }
          // No lanzar el error, el docente ya se actualizó exitosamente
        }
      } else {
        try {
          await this.desasociarDeColegio(id);
        } catch (errorDesasociar) {
          // Si falla la desasociación (tabla no existe), continuar silenciosamente
          // No mostrar error ya que puede ser que la tabla simplemente no exista
        }
      }
      
      return { success: true };
    }
    
    return await apiRequest(`${TABLES.USUARIOS}?id=eq.${id}&tipo_usuario=eq.docente`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },
  
  /**
   * Eliminar docente (soft delete)
   */
  async eliminar(id) {
    return await this.actualizar(id, { activo: false });
  },
  
  /**
   * Resetear contraseña de docente
   */
  async resetearPassword(id, nuevaPassword = 'temporal123') {
    const passwordHash = await hashPassword(nuevaPassword);
    
    return await this.actualizar(id, {
      password_hash: passwordHash,
      primera_vez: true
    });
  },
  
  /**
   * Asociar docente a un colegio
   */
  async asociarAColegio(docenteId, colegioId) {
    // Verificar si la tabla existe antes de intentar usarla
    try {
      // Verificar si ya existe una asociación
      const existente = await apiRequest(
        `${TABLES.DOCENTES_COLEGIOS}?docente_id=eq.${docenteId}&select=id`
      );
      
      if (existente && existente.length > 0) {
        // Actualizar asociación existente
        return await apiRequest(
          `${TABLES.DOCENTES_COLEGIOS}?docente_id=eq.${docenteId}`,
          {
            method: 'PATCH',
            body: JSON.stringify({ colegio_id: colegioId })
          }
        );
      } else {
        // Crear nueva asociación
        return await apiRequest(`${TABLES.DOCENTES_COLEGIOS}`, {
          method: 'POST',
          body: JSON.stringify({
            docente_id: docenteId,
            colegio_id: colegioId
          })
        });
      }
    } catch (error) {
      // Si el error es 404, la tabla no existe
      if (error.message && (error.message.includes('404') || error.message.includes('PGRST205'))) {
        throw new Error('La tabla docentes_colegios no existe. Por favor ejecuta el script crear_tabla_docentes_colegios.sql en Supabase SQL Editor.');
      }
      throw error;
    }
  },
  
  /**
   * Desasociar docente de colegio
   */
  async desasociarDeColegio(docenteId) {
    return await apiRequest(
      `${TABLES.DOCENTES_COLEGIOS}?docente_id=eq.${docenteId}`,
      {
        method: 'DELETE'
      }
    );
  },
  
  /**
   * Obtener estudiantes del colegio del docente
   * Útil para que el docente vea sus estudiantes
   */
  async obtenerEstudiantesDelColegio(docenteId) {
    // Primero obtener el colegio del docente
    const asociacion = await apiRequest(
      `${TABLES.DOCENTES_COLEGIOS}?docente_id=eq.${docenteId}&select=colegio_id`
    );
    
    if (!asociacion || asociacion.length === 0) {
      return [];
    }
    
    const colegioId = asociacion[0].colegio_id;
    
    // Obtener estudiantes del colegio usando la relación
    const params = new URLSearchParams();
    params.append('colegio_id', `eq.${colegioId}`);
    params.append('select', 'usuarios:estudiante_id(id,codigo_estudiante,nombre,apellidos,email,grado,activo)');
    
    const estudiantesRelacion = await apiRequest(
      `${TABLES.ESTUDIANTES_COLEGIOS}?${params.toString()}`
    );
    
    // Extraer los estudiantes de la relación
    return estudiantesRelacion
      .map(rel => rel.usuarios)
      .filter(Boolean);
  },
  
  /**
   * Resetear contraseña de un estudiante (solo para docentes)
   */
  async resetearPasswordEstudiante(estudianteId, nuevaPassword = '123456') {
    const passwordHash = await hashPassword(nuevaPassword);
    
    return await apiRequest(`${TABLES.USUARIOS}?id=eq.${estudianteId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        password_hash: passwordHash,
        primera_vez: true
      })
    });
  }
};

// ============================================
// MÓDULO: ACUDIENTES
// ============================================

export const AcudientesAPI = {
  /**
   * Obtener todos los acudientes
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    params.append('activo', 'eq.true');
    
    if (filtros.buscar) {
      params.append('or', `(nombre.ilike.%${filtros.buscar}%,apellidos.ilike.%${filtros.buscar}%,email.ilike.%${filtros.buscar}%)`);
    }
    
    params.append('select', '*,usuarios:estudiante_id(id,codigo_estudiante,nombre,apellidos,grado)');
    params.append('order', 'nombre');
    
    return await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
  },
  
  /**
   * Obtener un acudiente por ID
   */
  async obtener(id) {
    const params = new URLSearchParams();
    params.append('id', `eq.${id}`);
    params.append('select', '*,usuarios:estudiante_id(id,codigo_estudiante,nombre,apellidos,grado)');
    
    const resultado = await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },
  
  /**
   * Genera username de acudiente automático (ACU001, ACU002, etc.)
   */
  async generarUsername() {
    try {
      const params = new URLSearchParams();
      params.append('select', 'username');
      params.append('order', 'username.desc');
      params.append('limit', '1');
      
      const acudientes = await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
      
      if (!acudientes || acudientes.length === 0) {
        return 'ACU001';
      }
      
      const ultimoUsername = acudientes[0].username;
      if (ultimoUsername && ultimoUsername.match(/^ACU\d+$/i)) {
        const match = ultimoUsername.match(/\d+/);
        if (match) {
          const numero = parseInt(match[0]) + 1;
          return 'ACU' + String(numero).padStart(3, '0');
        }
      }
      
      return 'ACU001';
    } catch (error) {
      console.error('Error generando username de acudiente:', error);
      return 'ACU001';
    }
  },
  
  /**
   * Crear nuevo acudiente
   */
  async crear(datos) {
    // Verificar si el email ya existe para este estudiante
    try {
      const params = new URLSearchParams();
      params.append('email', `eq.${datos.email}`);
      params.append('estudiante_id', `eq.${datos.estudiante_id}`);
      params.append('select', 'id,nombre,apellidos');
      
      const existente = await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
      
      if (existente && existente.length > 0) {
        const acu = existente[0];
        throw new Error(`Ya existe un acudiente con el email "${datos.email}" para este estudiante: ${acu.nombre} ${acu.apellidos || ''}`.trim());
      }
    } catch (error) {
      if (error.message && error.message.includes('Ya existe')) {
        throw error;
      }
      console.warn('No se pudo verificar acudiente duplicado, continuando:', error);
    }
    
    // Generar username si no se proporciona
    if (!datos.username) {
      datos.username = await this.generarUsername();
    }
    
    // Hash de contraseña por defecto (temporal123)
    if (!datos.password_hash) {
      datos.password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3'; // Hash de "temporal123"
    }
    
    // Valores por defecto
    datos.activo = datos.activo !== undefined ? datos.activo : true;
    datos.primera_vez = datos.primera_vez !== undefined ? datos.primera_vez : true;
    
    try {
      return await apiRequest(`${TABLES.ACUDIENTES}`, {
        method: 'POST',
        body: JSON.stringify(datos)
      });
    } catch (error) {
      // Manejar error de constraint
      if (error.message && error.message.includes('23505')) {
        if (error.message.includes('usuarios_email_key') || error.message.includes('email')) {
          throw new Error(`El email "${datos.email}" ya está registrado. Por favor, usa un email diferente.`);
        }
        if (error.message.includes('username')) {
          // Regenerar username si hay conflicto
          datos.username = await this.generarUsername();
          return await apiRequest(`${TABLES.ACUDIENTES}`, {
            method: 'POST',
            body: JSON.stringify(datos)
          });
        }
      }
      throw error;
    }
  },
  
  /**
   * Actualizar acudiente
   */
  async actualizar(id, datos) {
    datos.updated_at = new Date().toISOString();
    
    return await apiRequest(`${TABLES.ACUDIENTES}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },
  
  /**
   * Eliminar acudiente (soft delete)
   */
  async eliminar(id) {
    return await this.actualizar(id, { activo: false });
  },
  
  /**
   * Resetear contraseña de acudiente
   */
  async resetearPassword(id, nuevaPassword = 'temporal123') {
    const passwordHash = await hashPassword(nuevaPassword);
    
    return await this.actualizar(id, {
      password_hash: passwordHash,
      primera_vez: true
    });
  },
  
  /**
   * Obtener acudientes de un estudiante específico
   */
  async obtenerPorEstudiante(estudianteId) {
    const params = new URLSearchParams();
    params.append('estudiante_id', `eq.${estudianteId}`);
    params.append('activo', 'eq.true');
    params.append('select', '*');
    params.append('order', 'nombre');
    
    return await apiRequest(`${TABLES.ACUDIENTES}?${params.toString()}`);
  }
};

// ============================================
// EXPORTACIONES
// ============================================

export default {
  EstudiantesAPI,
  ColegiosAPI,
  DocentesAPI,
  AcudientesAPI
};
