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
  ACUDIENTES: 'acudientes',
  PARAMETROS_COBRO: 'parametros_cobro',
  COBROS_MENSUALES: 'cobros_mensuales',
  SALDOS_ESTUDIANTE: 'saldos_estudiante',
  CHECKPOINT_COBROS: 'checkpoint_cobros'
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
// MÓDULO: COBROS / MENSUALIDADES
// ============================================

export const CobrosAPI = {
  /** Tablas del módulo */
  TABLES: {
    PARAMETROS: 'parametros_cobro',
    COBROS: 'cobros_mensuales',
    SALDOS: 'saldos_estudiante',
    CHECKPOINT: 'checkpoint_cobros'
  },

  /**
   * Obtener parámetros de cobro (una sola fila)
   */
  async obtenerParametros() {
    const rows = await apiRequest(`${TABLES.PARAMETROS_COBRO}?limit=1`);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  },

  /**
   * Actualizar parámetros de cobro
   */
  async actualizarParametros(datos) {
    const actual = await this.obtenerParametros();
    const now = new Date().toISOString();
    const body = {
      ...datos,
      updated_at: now
    };
    if (actual) {
      return await apiRequest(`${TABLES.PARAMETROS_COBRO}?id=eq.${actual.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    }
    return await apiRequest(`${TABLES.PARAMETROS_COBRO}`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  /**
   * Cobros de un periodo (anio, mes) con datos de estudiante y acudiente
   */
  async getCobrosDelPeriodo(anio, mes) {
    const params = new URLSearchParams();
    params.append('anio', `eq.${anio}`);
    params.append('mes', `eq.${mes}`);
    params.append('select', 'id,estudiante_id,anio,mes,valor_base,valor_final,estado,enviado_at,created_at,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante,grado)');
    params.append('order', 'estudiante_id');
    let rows = await apiRequest(`${TABLES.COBROS_MENSUALES}?${params.toString()}`);
    if (!rows || rows.length === 0) return [];
    const estudianteIds = [...new Set(rows.map(r => r.estudiante_id).filter(Boolean))];
    const paramsAcu = new URLSearchParams();
    paramsAcu.append('estudiante_id', `in.(${estudianteIds.join(',')})`);
    paramsAcu.append('activo', 'eq.true');
    paramsAcu.append('select', 'estudiante_id,nombre,apellidos,celular,email,username');
    const acudientes = await apiRequest(`${TABLES.ACUDIENTES}?${paramsAcu.toString()}`);
    const acuPorEst = {};
    (acudientes || []).forEach(a => {
      if (!acuPorEst[a.estudiante_id]) acuPorEst[a.estudiante_id] = [];
      acuPorEst[a.estudiante_id].push(a);
    });
    return rows.map(c => {
      const acu = acuPorEst[c.estudiante_id];
      const acudiente = acu && acu[0];
      const nombreAcudiente = acudiente ? `${acudiente.nombre || ''} ${acudiente.apellidos || ''}`.trim() : 'N/A';
      return {
        ...c,
        acudiente: acudiente ? { nombre: nombreAcudiente, celular: acudiente.celular, email: acudiente.email, username: acudiente.username } : { nombre: 'N/A', celular: '', email: '', username: '' }
      };
    });
  },

  /**
   * Calcula valor_final para un estudiante: (mensualidad base + saldo) × (1 − % beca).
   */
  _calcularValorCobro(valorBase, saldoRow, becasActivo) {
    const saldo = saldoRow ? Number(saldoRow.saldo) || 0 : 0;
    const porcentajeBeca = becasActivo && saldoRow ? Number(saldoRow.porcentaje_beca) || 0 : 0;
    return Math.round((valorBase + saldo) * (1 - porcentajeBeca / 100));
  },

  /**
   * Generar o actualizar cobros del mes.
   * - Si el estudiante no tiene cobro: se crea con valor = (base + saldo) × (1 − beca).
   * - Si ya tiene cobro con valor 0: se actualiza con ese mismo cálculo.
   * opciones.valorBaseOverride: valor base desde el formulario (ej. 40000) si no se ha guardado en parámetros.
   */
  async generarCobrosDelMes(anio, mes, opciones = {}) {
    const parametros = await this.obtenerParametros();
    const valorBaseGuardado = parametros ? Number(parametros.valor_base_mensualidad) || 0 : 0;
    const valorBase = (opciones.valorBaseOverride != null && Number(opciones.valorBaseOverride) > 0)
      ? Number(opciones.valorBaseOverride)
      : valorBaseGuardado;
    const paramsEst = new URLSearchParams();
    paramsEst.append('codigo_estudiante', 'like.EST%');
    paramsEst.append('activo', 'eq.true');
    paramsEst.append('select', 'id');
    const estudiantes = await apiRequest(`${TABLES.USUARIOS}?${paramsEst.toString()}`);
    if (!estudiantes || estudiantes.length === 0) return { generados: 0, actualizados: 0, mensaje: 'No hay estudiantes activos' };
    const paramsExistentes = new URLSearchParams();
    paramsExistentes.append('anio', `eq.${anio}`);
    paramsExistentes.append('mes', `eq.${mes}`);
    paramsExistentes.append('select', 'id,estudiante_id,valor_base,valor_final');
    const existentes = await apiRequest(`${TABLES.COBROS_MENSUALES}?${paramsExistentes.toString()}`);
    const cobroPorEst = {};
    (existentes || []).forEach(c => { cobroPorEst[c.estudiante_id] = c; });
    const saldosMap = await this._getSaldosMap();
    const becasActivo = parametros && parametros.becas_activo;
    const aInsertar = [];
    let actualizados = 0;
    const now = new Date().toISOString();
    for (const est of estudiantes) {
      const saldoRow = saldosMap[est.id];
      const valorBaseNum = valorBase;
      const valorFinal = this._calcularValorCobro(valorBaseNum, saldoRow, becasActivo);
      const cobroExistente = cobroPorEst[est.id];
      if (cobroExistente) {
        const vf = Number(cobroExistente.valor_final);
        const vb = Number(cobroExistente.valor_base);
        const enCero = (vf === 0 || isNaN(vf)) && (vb === 0 || isNaN(vb));
        if (enCero) {
          await apiRequest(`${TABLES.COBROS_MENSUALES}?id=eq.${cobroExistente.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ valor_base: valorBaseNum, valor_final: valorFinal, updated_at: now })
          });
          actualizados++;
        }
        continue;
      }
      aInsertar.push({
        estudiante_id: est.id,
        anio: Number(anio),
        mes: Number(mes),
        valor_base: valorBaseNum,
        valor_final: valorFinal,
        estado: 'pendiente'
      });
    }
    if (aInsertar.length > 0) {
      await apiRequest(`${TABLES.COBROS_MENSUALES}`, {
        method: 'POST',
        body: JSON.stringify(aInsertar)
      });
    }
    const partes = [];
    if (aInsertar.length > 0) partes.push(`${aInsertar.length} creados`);
    if (actualizados > 0) partes.push(`${actualizados} actualizados de 0 al valor correcto`);
    const mensaje = partes.length > 0
      ? `Cobros ${mes}/${anio}: ${partes.join(', ')}.`
      : (actualizados === 0 && aInsertar.length === 0 ? 'Todos los estudiantes ya tienen cobro con valor asignado para este mes.' : '');
    return { generados: aInsertar.length, actualizados, mensaje: mensaje || `Listo.` };
  },

  /**
   * Recalcular y guardar en BD los valores de todos los cobros del mes (valor_base + saldo, con beca).
   * Útil cuando cambias parámetros o saldos y quieres que la tabla quede persistida.
   */
  async recalcularYGuardarCobrosDelMes(anio, mes, opciones = {}) {
    const parametros = await this.obtenerParametros();
    const valorBaseGuardado = parametros ? Number(parametros.valor_base_mensualidad) || 0 : 0;
    const valorBase = (opciones.valorBaseOverride != null && Number(opciones.valorBaseOverride) > 0)
      ? Number(opciones.valorBaseOverride)
      : valorBaseGuardado;
    const paramsCobros = new URLSearchParams();
    paramsCobros.append('anio', `eq.${anio}`);
    paramsCobros.append('mes', `eq.${mes}`);
    paramsCobros.append('select', 'id,estudiante_id,valor_base,valor_final');
    const cobros = await apiRequest(`${TABLES.COBROS_MENSUALES}?${paramsCobros.toString()}`);
    if (!cobros || cobros.length === 0) return { actualizados: 0, mensaje: 'No hay cobros para este mes.' };
    const saldosMap = await this._getSaldosMap();
    const becasActivo = parametros && parametros.becas_activo;
    const now = new Date().toISOString();
    let actualizados = 0;
    for (const c of cobros) {
      const saldoRow = saldosMap[c.estudiante_id];
      const valorFinal = this._calcularValorCobro(valorBase, saldoRow, becasActivo);
      await apiRequest(`${TABLES.COBROS_MENSUALES}?id=eq.${c.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ valor_base: valorBase, valor_final: valorFinal, updated_at: now })
      });
      actualizados++;
    }
    return { actualizados, mensaje: `Se guardaron los valores de ${actualizados} cobros para ${mes}/${anio}.` };
  },

  async _getSaldosMap() {
    const rows = await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?select=estudiante_id,saldo,porcentaje_beca`);
    const map = {};
    (rows || []).forEach(r => { map[r.estudiante_id] = r; });
    return map;
  },

  /**
   * Marcar cobro como enviado (WhatsApp)
   */
  async marcarEnviado(cobroId) {
    const now = new Date().toISOString();
    return await apiRequest(`${TABLES.COBROS_MENSUALES}?id=eq.${cobroId}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'enviado', enviado_at: now, updated_at: now })
    });
  },

  /**
   * Marcar cobro como al día (pagado)
   */
  async marcarAlDia(cobroId) {
    const now = new Date().toISOString();
    return await apiRequest(`${TABLES.COBROS_MENSUALES}?id=eq.${cobroId}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'al_dia', updated_at: now })
    });
  },

  /**
   * Listar saldos por estudiante (con nombre). Solo filas existentes.
   */
  async listarSaldos() {
    const params = new URLSearchParams();
    params.append('select', 'id,estudiante_id,saldo,porcentaje_beca,updated_at,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante)');
    params.append('order', 'estudiante_id');
    const rows = await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?${params.toString()}`);
    return rows || [];
  },

  /**
   * Listar todos los estudiantes activos (EST%) con su saldo y % beca (0 si no tienen fila)
   */
  async listarEstudiantesConSaldos() {
    const [estudiantes, saldosRows] = await Promise.all([
      apiRequest(`${TABLES.USUARIOS}?codigo_estudiante=like.EST%&activo=eq.true&select=id,nombre,apellidos,codigo_estudiante&order=codigo_estudiante`),
      apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?select=estudiante_id,saldo,porcentaje_beca`)
    ]);
    const saldosMap = {};
    (saldosRows || []).forEach(r => { saldosMap[r.estudiante_id] = r; });
    return (estudiantes || []).map(est => {
      const s = saldosMap[est.id];
      return {
        estudiante_id: est.id,
        nombre: `${est.nombre || ''} ${est.apellidos || ''}`.trim(),
        codigo_estudiante: est.codigo_estudiante,
        saldo: s ? Number(s.saldo) : 0,
        porcentaje_beca: s ? Number(s.porcentaje_beca) : 0
      };
    });
  },

  /**
   * Obtener o crear saldo para un estudiante; actualizar saldo y/o porcentaje_beca
   */
  async actualizarSaldo(estudianteId, datos) {
    const params = new URLSearchParams();
    params.append('estudiante_id', `eq.${estudianteId}`);
    params.append('select', 'id');
    const existente = await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?${params.toString()}`);
    const now = new Date().toISOString();
    const saldo = datos.saldo !== undefined ? Number(datos.saldo) : 0;
    const porcentajeBeca = datos.porcentaje_beca !== undefined ? Number(datos.porcentaje_beca) : 0;
    if (existente && existente.length > 0) {
      const body = { updated_at: now };
      if (datos.saldo !== undefined) body.saldo = saldo;
      if (datos.porcentaje_beca !== undefined) body.porcentaje_beca = porcentajeBeca;
      return await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?id=eq.${existente[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify(body)
      });
    }
    return await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}`, {
      method: 'POST',
      body: JSON.stringify({
        estudiante_id: estudianteId,
        saldo,
        porcentaje_beca: porcentajeBeca,
        updated_at: now
      })
    });
  },

  /**
   * Checkpoint: crear punto de recuperación
   */
  async crearCheckpoint(descripcion) {
    const [cobros, saldos] = await Promise.all([
      apiRequest(`${TABLES.COBROS_MENSUALES}?select=*`),
      apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?select=*`)
    ]);
    return await apiRequest(`${TABLES.CHECKPOINT_COBROS}`, {
      method: 'POST',
      body: JSON.stringify({
        descripcion: descripcion || 'Checkpoint manual',
        snapshot_cobros: cobros || [],
        snapshot_saldos: saldos || []
      })
    });
  },

  /**
   * Checkpoint: obtener el último
   */
  async obtenerUltimoCheckpoint() {
    const params = new URLSearchParams();
    params.append('order', 'created_at.desc');
    params.append('limit', '1');
    params.append('select', '*');
    const rows = await apiRequest(`${TABLES.CHECKPOINT_COBROS}?${params.toString()}`);
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  },

  /**
   * Checkpoint: revertir al último (restaura cobros y saldos desde el snapshot)
   */
  async revertirAlUltimoCheckpoint() {
    const cp = await this.obtenerUltimoCheckpoint();
    if (!cp) throw new Error('No hay checkpoint para revertir');
    const cobros = cp.snapshot_cobros || [];
    const saldos = cp.snapshot_saldos || [];
    const actuales = await apiRequest(`${TABLES.COBROS_MENSUALES}?select=id,estudiante_id,anio,mes`);
    const actualMap = {};
    (actuales || []).forEach(c => { actualMap[`${c.estudiante_id}-${c.anio}-${c.mes}`] = c; });
    for (const row of cobros) {
      const key = `${row.estudiante_id}-${row.anio}-${row.mes}`;
      const actual = actualMap[key];
      const payload = {
        valor_base: row.valor_base,
        valor_final: row.valor_final,
        estado: row.estado,
        enviado_at: row.enviado_at || null,
        updated_at: new Date().toISOString()
      };
      if (actual) {
        await apiRequest(`${TABLES.COBROS_MENSUALES}?id=eq.${actual.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiRequest(`${TABLES.COBROS_MENSUALES}`, {
          method: 'POST',
          body: JSON.stringify({
            estudiante_id: row.estudiante_id,
            anio: row.anio,
            mes: row.mes,
            valor_base: row.valor_base,
            valor_final: row.valor_final,
            estado: row.estado,
            enviado_at: row.enviado_at || null
          })
        });
      }
    }
    for (const row of saldos) {
      const exist = await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?estudiante_id=eq.${row.estudiante_id}&select=id`);
      if (exist && exist.length > 0) {
        await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}?id=eq.${exist[0].id}`, {
          method: 'PATCH',
          body: JSON.stringify({ saldo: row.saldo, porcentaje_beca: row.porcentaje_beca, updated_at: new Date().toISOString() })
        });
      } else {
        await apiRequest(`${TABLES.SALDOS_ESTUDIANTE}`, {
          method: 'POST',
          body: JSON.stringify({
            estudiante_id: row.estudiante_id,
            saldo: row.saldo,
            porcentaje_beca: row.porcentaje_beca
          })
        });
      }
    }
    return { ok: true, mensaje: 'Checkpoint restaurado' };
  },

  /**
   * Reemplazar placeholders en mensaje WhatsApp
   */
  reemplazarPlaceholders(plantilla, datos) {
    if (!plantilla || typeof plantilla !== 'string') return '';
    return plantilla.replace(/\{\{(\w+)\}\}/g, (_, key) => (datos[key] != null && datos[key] !== '' ? String(datos[key]) : 'N/A'));
  },

  /**
   * Construir URL WhatsApp (wa.me)
   */
  urlWhatsApp(numero, mensaje) {
    const num = String(numero || '').replace(/\D/g, '');
    const prefijo = num.length <= 10 ? '57' : '';
    const full = prefijo + num;
    if (!full) return null;
    return `https://wa.me/${full}?text=${encodeURIComponent(mensaje)}`;
  }
};

// ============================================
// EXPORTACIONES
// ============================================

export default {
  EstudiantesAPI,
  ColegiosAPI,
  DocentesAPI,
  AcudientesAPI,
  CobrosAPI
};
