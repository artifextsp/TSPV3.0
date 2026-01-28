// ============================================
// API - MÓDULO DE CREATIVIDAD
// Thinking Skills Program v2
// ============================================

import { CONFIG } from '../config/supabase.config.js';

const API_URL = CONFIG.SUPABASE_URL;
const API_KEY = CONFIG.SUPABASE_ANON_KEY;

const TABLES = {
  CICLOS: 'ciclos_creatividad',
  SESIONES: 'sesiones_creatividad',
  USUARIOS: 'usuarios'
};

// ============================================
// FUNCIÓN AUXILIAR: API Request
// ============================================

async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const response = await fetch(`${API_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Error en apiRequest:', errorData);
    throw new Error(`Error ${response.status}: ${errorData}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ============================================
// MÓDULO: CICLOS DE CREATIVIDAD
// ============================================

export const CiclosCreatividadAPI = {
  /**
   * Obtener todos los ciclos ordenados por número descendente
   */
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.grado) {
      params.append('grado', `eq.${filtros.grado}`);
    }
    
    if (filtros.activo !== undefined) {
      params.append('activo', `eq.${filtros.activo}`);
    }
    
    params.append('select', 'id,numero_ciclo,grado,titulo,instrucciones,mostrar_instrucciones,archivo_url,archivo_tipo,archivo_nombre,activo,created_at');
    params.append('order', 'numero_ciclo.desc');
    
    return await apiRequest(`${TABLES.CICLOS}?${params.toString()}`);
  },

  /**
   * Obtener un ciclo por ID
   */
  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.CICLOS}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Obtener ciclo activo para un grado específico
   */
  async obtenerActivoPorGrado(grado) {
    const resultado = await apiRequest(
      `${TABLES.CICLOS}?grado=eq.${grado}&activo=eq.true&select=*&order=numero_ciclo.desc&limit=1`
    );
    return Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Crear nuevo ciclo
   */
  async crear(datos) {
    // Obtener el siguiente número de ciclo para este grado
    const ciclosExistentes = await apiRequest(
      `${TABLES.CICLOS}?grado=eq.${datos.grado}&select=numero_ciclo&order=numero_ciclo.desc&limit=1`
    );
    
    const ultimoNumero = ciclosExistentes && ciclosExistentes.length > 0 
      ? ciclosExistentes[0].numero_ciclo 
      : 0;
    
    const nuevoCiclo = {
      numero_ciclo: ultimoNumero + 1,
      grado: datos.grado,
      titulo: datos.titulo,
      instrucciones: datos.instrucciones || null,
      mostrar_instrucciones: datos.mostrar_instrucciones !== false,
      archivo_url: datos.archivo_url || null,
      archivo_tipo: datos.archivo_tipo || null,
      archivo_nombre: datos.archivo_nombre || null,
      activo: false
    };
    
    return await apiRequest(TABLES.CICLOS, {
      method: 'POST',
      body: JSON.stringify(nuevoCiclo)
    });
  },

  /**
   * Actualizar ciclo
   */
  async actualizar(id, datos) {
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },

  /**
   * Activar/Desactivar ciclo
   */
  async toggleActivo(id, activo) {
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: activo })
    });
  },

  /**
   * Desactivar todos los ciclos de un grado
   */
  async desactivarTodosPorGrado(grado) {
    return await apiRequest(`${TABLES.CICLOS}?grado=eq.${grado}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false })
    });
  },

  /**
   * Activar un ciclo específico (desactiva los demás del mismo grado)
   */
  async activarCiclo(id, grado) {
    await this.desactivarTodosPorGrado(grado);
    return await this.toggleActivo(id, true);
  },

  /**
   * Copiar ciclo a otro grado (mismo título, instrucciones y archivo)
   */
  async copiarAOtroGrado(idOrigen, gradoDestino) {
    const ciclo = await this.obtener(idOrigen);
    if (!ciclo) throw new Error('Ciclo no encontrado');
    return await this.crear({
      grado: gradoDestino,
      titulo: ciclo.titulo,
      instrucciones: ciclo.instrucciones || null,
      mostrar_instrucciones: ciclo.mostrar_instrucciones !== false,
      archivo_url: ciclo.archivo_url || null,
      archivo_tipo: ciclo.archivo_tipo || null,
      archivo_nombre: ciclo.archivo_nombre || null
    });
  },

  /**
   * Eliminar ciclo
   */
  async eliminar(id) {
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// MÓDULO: SESIONES DE CREATIVIDAD
// ============================================

export const SesionesCreatividadAPI = {
  /**
   * Iniciar una nueva sesión
   */
  async iniciar(cicloId, estudianteId) {
    // Verificar si ya existe una sesión
    const sesionExistente = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&select=id,estado`
    );
    
    if (sesionExistente && sesionExistente.length > 0) {
      if (sesionExistente[0].estado === 'finalizada') {
        throw new Error('Ya completaste este ciclo de creatividad');
      }
      return sesionExistente[0];
    }
    
    const nuevaSesion = {
      ciclo_id: cicloId,
      estudiante_id: estudianteId,
      estado: 'en_progreso'
    };
    
    const resultado = await apiRequest(TABLES.SESIONES, {
      method: 'POST',
      body: JSON.stringify(nuevaSesion)
    });
    
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Permitir repetir un ciclo
   */
  async permitirRepetir(cicloId, estudianteId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}`,
      { method: 'DELETE' }
    );
  },

  /**
   * Obtener todas las sesiones de un ciclo
   */
  async listarPorCiclo(cicloId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&select=*,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante,grado)&order=fecha_fin_sesion.desc.nullslast`
    );
  },

  /**
   * Registrar visualización
   */
  async registrarVisualizacion(sesionId, tiempoSegundos) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fecha_visualizacion: new Date().toISOString(),
        tiempo_visualizacion_segundos: tiempoSegundos,
        estado: 'visualizado'
      })
    });
  },

  /**
   * Finalizar sesión
   */
  async finalizarSesion(sesionId, tiempoTotal) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fecha_fin_sesion: new Date().toISOString(),
        tiempo_visualizacion_segundos: tiempoTotal,
        estado: 'finalizada'
      })
    });
  },

  /**
   * Verificar si ya completó un ciclo
   */
  async verificarCompletado(cicloId, estudianteId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&estado=eq.finalizada&select=id`
    );
    return resultado && resultado.length > 0;
  },

  /**
   * Obtener sesión existente
   */
  async obtenerSesion(cicloId, estudianteId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&select=*`
    );
    return Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Solicitar revisión al docente
   */
  async solicitarRevision(sesionId) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        solicitar_revision: true,
        fecha_solicitud_revision: new Date().toISOString(),
        estado: 'pendiente_revision'
      })
    });
  },

  /**
   * Obtener sesiones pendientes de revisión (todas o por grado)
   */
  async obtenerPendientesRevision(grado = null) {
    let query = `${TABLES.SESIONES}?estado=eq.pendiente_revision&select=*,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante,grado),ciclos_creatividad:ciclo_id(titulo,grado)&order=fecha_solicitud_revision.asc.nullslast`;
    return await apiRequest(query);
  },
  
  /**
   * Obtener todas las sesiones pendientes (sin filtro de grado)
   */
  async obtenerTodasPendientes() {
    return await apiRequest(
      `${TABLES.SESIONES}?estado=eq.pendiente_revision&select=id,estudiante_id,usuarios:estudiante_id(nombre,apellidos,grado)`
    );
  },

  /**
   * Calificar sesión (docente)
   */
  async calificarSesion(sesionId, docenteId, calificacion, comentario = null) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        calificacion_docente: calificacion,
        docente_calificador_id: docenteId,
        fecha_calificacion: new Date().toISOString(),
        comentario_docente: comentario,
        estado: 'calificada'
      })
    });
  },

  /**
   * Obtener calificación de una sesión
   */
  async obtenerCalificacion(sesionId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?id=eq.${sesionId}&select=calificacion_docente,comentario_docente,fecha_calificacion,estado`
    );
    return Array.isArray(resultado) ? resultado[0] : resultado;
  }
};

// ============================================
// GRADOS DISPONIBLES
// ============================================

export const GRADOS = [
  { value: 'tercero', label: '3° Tercero' },
  { value: 'cuarto', label: '4° Cuarto' },
  { value: 'quinto', label: '5° Quinto' },
  { value: 'sexto', label: '6° Sexto' },
  { value: 'septimo', label: '7° Séptimo' },
  { value: 'octavo', label: '8° Octavo' },
  { value: 'noveno', label: '9° Noveno' },
  { value: 'decimo', label: '10° Décimo' },
  { value: 'undecimo', label: '11° Undécimo' }
];

export { API_URL, API_KEY };
