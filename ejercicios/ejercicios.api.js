// ============================================
// API - MÓDULO DE EJERCICIOS DIGITALES
// Thinking Skills Program v2
// ============================================

import { CONFIG } from '../config/supabase.config.js';

const API_URL = CONFIG.SUPABASE_URL;
const API_KEY = CONFIG.SUPABASE_ANON_KEY;

const TABLES = {
  CICLOS: 'ciclos_ejercicios',
  JUEGOS: 'juegos_ejercicios',
  SESIONES: 'sesiones_ejercicios',
  RESULTADOS: 'resultados_juegos',
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
// MÓDULO: CICLOS DE EJERCICIOS
// ============================================

export const CiclosEjerciciosAPI = {
  async listar(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.grado) {
      params.append('grado', `eq.${filtros.grado}`);
    }
    
    if (filtros.activo !== undefined) {
      params.append('activo', `eq.${filtros.activo}`);
    }
    
    params.append('select', '*');
    params.append('order', 'numero_ciclo.desc');
    
    return await apiRequest(`${TABLES.CICLOS}?${params.toString()}`);
  },

  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.CICLOS}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  async obtenerActivoPorGrado(grado) {
    const resultado = await apiRequest(
      `${TABLES.CICLOS}?grado=eq.${grado}&activo=eq.true&select=*&order=numero_ciclo.desc&limit=1`
    );
    return Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
  },

  async crear(datos) {
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
      descripcion: datos.descripcion || null,
      activo: false
    };
    
    return await apiRequest(TABLES.CICLOS, {
      method: 'POST',
      body: JSON.stringify(nuevoCiclo)
    });
  },

  async activarCiclo(id, grado) {
    // Desactivar todos los del grado
    await apiRequest(`${TABLES.CICLOS}?grado=eq.${grado}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false })
    });
    // Activar el seleccionado
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: true })
    });
  },

  async desactivar(id) {
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: false })
    });
  },

  async actualizar(id, datos) {
    const payload = {};
    if (datos.titulo !== undefined) payload.titulo = datos.titulo;
    if (datos.descripcion !== undefined) payload.descripcion = datos.descripcion;
    if (datos.grado !== undefined) payload.grado = datos.grado;
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async copiarAOtroGrado(idOrigen, gradoDestino) {
    const cicloOrigen = await this.obtener(idOrigen);
    if (!cicloOrigen) throw new Error('Ciclo no encontrado');
    const juegos = await JuegosAPI.listarPorCiclo(idOrigen);
    const nuevoCiclo = await this.crear({
      grado: gradoDestino,
      titulo: cicloOrigen.titulo,
      descripcion: cicloOrigen.descripcion || null
    });
    const nuevoId = Array.isArray(nuevoCiclo) ? nuevoCiclo[0]?.id : nuevoCiclo?.id;
    if (!nuevoId) throw new Error('Error creando ciclo copiado');
    for (const j of juegos || []) {
      await JuegosAPI.crear({
        ciclo_id: nuevoId,
        nombre: j.nombre,
        url_juego: j.url_juego,
        imagen_preview: j.imagen_preview || null,
        habilidad_estimulada: j.habilidad_estimulada,
        tipo_meta: j.tipo_meta,
        meta_objetivo: j.meta_objetivo,
        instrucciones: j.instrucciones || null,
        orden: j.orden ?? 1,
        activo: j.activo !== false
      });
    }
    return nuevoCiclo;
  },

  async eliminar(id) {
    return await apiRequest(`${TABLES.CICLOS}?id=eq.${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// MÓDULO: JUEGOS
// ============================================

export const JuegosAPI = {
  async listarPorCiclo(cicloId) {
    return await apiRequest(
      `${TABLES.JUEGOS}?ciclo_id=eq.${cicloId}&select=*&order=orden.asc`
    );
  },

  async obtener(id) {
    const resultado = await apiRequest(`${TABLES.JUEGOS}?id=eq.${id}&select=*`);
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  async crear(datos) {
    return await apiRequest(TABLES.JUEGOS, {
      method: 'POST',
      body: JSON.stringify(datos)
    });
  },

  async actualizar(id, datos) {
    return await apiRequest(`${TABLES.JUEGOS}?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(datos)
    });
  },

  async eliminar(id) {
    return await apiRequest(`${TABLES.JUEGOS}?id=eq.${id}`, {
      method: 'DELETE'
    });
  }
};

// ============================================
// MÓDULO: SESIONES DE EJERCICIOS
// ============================================

export const SesionesEjerciciosAPI = {
  async iniciar(cicloId, estudianteId) {
    const sesionExistente = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&select=id,estado`
    );
    
    if (sesionExistente && sesionExistente.length > 0) {
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

  async obtenerSesion(cicloId, estudianteId) {
    const resultado = await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}&select=*`
    );
    return Array.isArray(resultado) && resultado.length > 0 ? resultado[0] : null;
  },

  async finalizar(sesionId) {
    return await apiRequest(`${TABLES.SESIONES}?id=eq.${sesionId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        estado: 'finalizada',
        fecha_fin_sesion: new Date().toISOString()
      })
    });
  },

  async permitirRepetir(cicloId, estudianteId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&estudiante_id=eq.${estudianteId}`,
      { method: 'DELETE' }
    );
  },

  async listarPorCiclo(cicloId) {
    return await apiRequest(
      `${TABLES.SESIONES}?ciclo_id=eq.${cicloId}&select=*,usuarios:estudiante_id(id,nombre,apellidos,codigo_estudiante,grado)&order=fecha_fin_sesion.desc.nullslast`
    );
  }
};

// ============================================
// MÓDULO: RESULTADOS DE JUEGOS
// ============================================

export const ResultadosAPI = {
  async registrar(datos) {
    // Verificar si ya existe un resultado para este juego
    const existente = await apiRequest(
      `${TABLES.RESULTADOS}?sesion_id=eq.${datos.sesion_id}&juego_id=eq.${datos.juego_id}&select=id`
    );
    
    if (existente && existente.length > 0) {
      // Actualizar existente
      return await apiRequest(`${TABLES.RESULTADOS}?id=eq.${existente[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          resultado_obtenido: datos.resultado_obtenido,
          meta_alcanzada: datos.meta_alcanzada,
          porcentaje_logro: datos.porcentaje_logro,
          fecha_registro: new Date().toISOString()
        })
      });
    }
    
    // Crear nuevo
    return await apiRequest(TABLES.RESULTADOS, {
      method: 'POST',
      body: JSON.stringify({
        ...datos,
        fecha_registro: new Date().toISOString()
      })
    });
  },

  async obtenerPorSesion(sesionId) {
    return await apiRequest(
      `${TABLES.RESULTADOS}?sesion_id=eq.${sesionId}&select=*,juegos_ejercicios:juego_id(nombre,habilidad_estimulada,tipo_meta,meta_objetivo)`
    );
  },

  async obtenerPorEstudiante(estudianteId, cicloId) {
    return await apiRequest(
      `${TABLES.RESULTADOS}?estudiante_id=eq.${estudianteId}&select=*,juegos_ejercicios:juego_id(*),sesiones_ejercicios:sesion_id(ciclo_id)&sesiones_ejercicios.ciclo_id=eq.${cicloId}`
    );
  },

  async verificarPorDocente(resultadoId, docenteId) {
    return await apiRequest(`${TABLES.RESULTADOS}?id=eq.${resultadoId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        verificado_por_docente: true,
        docente_verificador_id: docenteId,
        fecha_verificacion: new Date().toISOString()
      })
    });
  }
};

// ============================================
// HABILIDADES DISPONIBLES
// ============================================

export const HABILIDADES = [
  { value: 'atencion', label: 'Atención' },
  { value: 'memoria', label: 'Memoria' },
  { value: 'logica', label: 'Lógica' },
  { value: 'velocidad_procesamiento', label: 'Velocidad de Procesamiento' },
  { value: 'percepcion_visual', label: 'Percepción Visual' },
  { value: 'coordinacion', label: 'Coordinación' },
  { value: 'resolucion_problemas', label: 'Resolución de Problemas' },
  { value: 'planificacion', label: 'Planificación' },
  { value: 'creatividad', label: 'Creatividad' },
  { value: 'calculo_mental', label: 'Cálculo Mental' }
];

export const TIPOS_META = [
  { value: 'puntos', label: 'Puntos' },
  { value: 'niveles', label: 'Niveles' },
  { value: 'tiempo', label: 'Tiempo (segundos)' },
  { value: 'porcentaje', label: 'Porcentaje' }
];

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
