// ============================================
// API - MÓDULO DE LECTURA CRÍTICA
// Thinking Skills Program v2
// ============================================

import { CONFIG } from '../config/supabase.config.js';

const API_URL = CONFIG.SUPABASE_URL;
const API_KEY = CONFIG.SUPABASE_ANON_KEY;

const TABLES = {
  CICLOS: 'ciclos_lectura',
  SESIONES: 'sesiones_lectura',
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
// MÓDULO: CICLOS DE LECTURA
// ============================================

export const CiclosAPI = {
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
    
    params.append('select', 'id,numero_ciclo,grado,titulo,autor,anio,resumen,conteo_palabras,lexile,activo,created_at');
    params.append('order', 'numero_ciclo.desc');
    
    return await apiRequest(`${TABLES.CICLOS}?${params.toString()}`);
  },

  /**
   * Obtener un ciclo por ID (incluye contenido completo)
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
   * Crear nuevo ciclo desde JSON
   */
  async crear(jsonContent, grado) {
    // Extraer metadata del JSON
    const reading = jsonContent.reading || {};
    
    // Obtener el siguiente número de ciclo para este grado
    const ciclosExistentes = await apiRequest(
      `${TABLES.CICLOS}?grado=eq.${grado}&select=numero_ciclo&order=numero_ciclo.desc&limit=1`
    );
    
    const ultimoNumero = ciclosExistentes && ciclosExistentes.length > 0 
      ? ciclosExistentes[0].numero_ciclo 
      : 0;
    
    const nuevoCiclo = {
      numero_ciclo: ultimoNumero + 1,
      grado: grado,
      titulo: reading.title || 'Sin título',
      contenido: jsonContent,
      autor: reading.author || null,
      anio: reading.year || null,
      resumen: reading.summary || null,
      conteo_palabras: reading.word_count_text || 0,
      lexile: reading.lexile || null,
      activo: false
    };
    
    return await apiRequest(TABLES.CICLOS, {
      method: 'POST',
      body: JSON.stringify(nuevoCiclo)
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
   * Desactivar todos los ciclos de un grado (para activar solo uno)
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
   * Actualizar ciclo (titulo, grado, contenido, etc.)
   */
  async actualizar(id, datos) {
    const payload = {};
    if (datos.titulo !== undefined) payload.titulo = datos.titulo;
    if (datos.grado !== undefined) payload.grado = datos.grado;
    if (datos.contenido !== undefined) payload.contenido = datos.contenido;
    if (datos.autor !== undefined) payload.autor = datos.autor;
    if (datos.anio !== undefined) payload.anio = datos.anio;
    if (datos.resumen !== undefined) payload.resumen = datos.resumen;
    if (datos.conteo_palabras !== undefined) payload.conteo_palabras = datos.conteo_palabras;
    if (datos.lexile !== undefined) payload.lexile = datos.lexile;
    if (Object.keys(payload).length === 0) return null;
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  /**
   * Copiar ciclo a otro grado (mismo contenido, nuevo grado)
   */
  async copiarAOtroGrado(idOrigen, gradoDestino) {
    const ciclo = await this.obtener(idOrigen);
    if (!ciclo) throw new Error('Ciclo no encontrado');
    return await this.crear(ciclo.contenido, gradoDestino);
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
// MÓDULO: SESIONES DE LECTURA
// ============================================

export const SesionesAPI = {
  /**
   * Iniciar una nueva sesión de lectura
   */
  async iniciar(cicloId, estudianteId) {
    // Verificar si ya existe una sesión para este estudiante y ciclo
    const sesionExistente = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&select=id,estado`
    );
    
    if (sesionExistente && sesionExistente.length > 0) {
      // Si existe y está finalizada, retornar error
      if (sesionExistente[0].estado === 'finalizada') {
        throw new Error('Ya completaste este ciclo de lectura');
      }
      // Si existe pero no está finalizada, retornarla
      return sesionExistente[0];
    }
    
    // Crear nueva sesión
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
   * Permitir que un estudiante repita un ciclo (eliminar su sesión anterior)
   */
  async permitirRepetir(cicloId, estudianteId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}`,
      { method: 'DELETE' }
    );
  },

  /**
   * Obtener todas las sesiones de un ciclo con datos del estudiante
   */
  async listarPorCiclo(cicloId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&select=*,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante,grado)&order=fecha_fin_sesion.desc.nullslast`
    );
  },

  /**
   * Obtener sesión por ID
   */
  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.SESIONES}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Registrar fin de lectura
   */
  async finalizarLectura(sesionId, tiempoSegundos) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        fecha_fin_lectura: new Date().toISOString(),
        tiempo_lectura_segundos: tiempoSegundos,
        estado: 'lectura_completada'
      })
    });
  },

  /**
   * Guardar respuestas de vocabulario
   */
  async guardarVocabulario(sesionId, respuestas, aciertos, total) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        respuestas_vocabulario: respuestas,
        aciertos_vocabulario: aciertos,
        total_vocabulario: total,
        estado: 'vocabulario_completado'
      })
    });
  },

  /**
   * Guardar respuestas de evaluación y finalizar sesión
   */
  async finalizarSesion(sesionId, respuestas, aciertos, total) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        respuestas_evaluacion: respuestas,
        aciertos_evaluacion: aciertos,
        total_evaluacion: total,
        fecha_fin_sesion: new Date().toISOString(),
        estado: 'finalizada'
      })
    });
  },

  /**
   * Obtener resultados de una sesión
   */
  async obtenerResultados(sesionId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?id=eq.${sesionId}&select=*,ciclos_lectura(titulo,grado,conteo_palabras)`
    );
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Verificar si el estudiante ya completó un ciclo
   */
  async verificarCompletado(cicloId, estudianteId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&estado=eq.finalizada&select=id`
    );
    return resultado && resultado.length > 0;
  }
};

// ============================================
// MÓDULO: RANKINGS
// ============================================

export const RankingsAPI = {
  /**
   * Obtener top 5 por velocidad efectiva para un ciclo
   */
  async topVelocidadEfectiva(cicloId, limite = 5) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estado=eq.finalizada&select=id,estudiante_id,velocidad_efectiva,usuarios:estudiante_id(nombre,apellidos,codigo_estudiante)&order=velocidad_efectiva.desc.nullslast&limit=${limite}`
    );
  },

  /**
   * Obtener top 5 por comprensión para un ciclo
   */
  async topComprension(cicloId, limite = 5) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estado=eq.finalizada&select=id,estudiante_id,porcentaje_comprension,usuarios:estudiante_id(nombre,apellidos,codigo_estudiante)&order=porcentaje_comprension.desc.nullslast&limit=${limite}`
    );
  },

  /**
   * Obtener top 5 por velocidad simple para un ciclo
   */
  async topVelocidadSimple(cicloId, limite = 5) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estado=eq.finalizada&select=id,estudiante_id,velocidad_simple,usuarios:estudiante_id(nombre,apellidos,codigo_estudiante)&order=velocidad_simple.desc.nullslast&limit=${limite}`
    );
  },

  /**
   * Obtener rankings completos por grado
   */
  async rankingsPorGrado(grado, limite = 5) {
    // Obtener ciclos activos del grado
    const ciclos = await CiclosAPI.listar({ grado: grado, activo: true });
    
    if (!ciclos || ciclos.length === 0) {
      return null;
    }
    
    const cicloActivo = ciclos[0];
    
    return {
      ciclo: cicloActivo,
      velocidadEfectiva: await this.topVelocidadEfectiva(cicloActivo.id, limite),
      comprension: await this.topComprension(cicloActivo.id, limite),
      velocidadSimple: await this.topVelocidadSimple(cicloActivo.id, limite)
    };
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
