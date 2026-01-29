// ============================================
// API - MÓDULO DE INFORMES PARA GUARDIANES
// Thinking Skills Program v2.0
// ============================================

import { CONFIG } from '../config/supabase.config.js';

const API_URL = CONFIG.SUPABASE_URL;
const API_KEY = CONFIG.SUPABASE_ANON_KEY;

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
// MÓDULO: ACCESO DE GUARDIANES
// ============================================

export const AccesoGuardianAPI = {
  /**
   * Obtener estudiantes asociados a un guardián
   * 
   * IMPORTANTE: El sistema usa la tabla `acudientes` que ya existe.
   * Un acudiente puede tener múltiples hijos (múltiples registros con mismo email).
   * 
   * @param {string} guardianId - Puede ser:
   *   - El `id` de la tabla `acudientes` (si el usuario está autenticado como acudiente)
   *   - El `email` del acudiente (para buscar todos sus hijos)
   */
  async obtenerEstudiantes(guardianId) {
    // Intentar primero por ID (si es UUID)
    let acudientes = await apiRequest(
      `acudientes?id=eq.${guardianId}&activo=eq.true&select=*,estudiante:estudiante_id(id,nombre,apellidos,grado,codigo_estudiante,email,activo)`
    );
    
    // Si no encuentra por ID, intentar por email (un acudiente puede tener múltiples hijos)
    if (!acudientes || acudientes.length === 0) {
      acudientes = await apiRequest(
        `acudientes?email=eq.${guardianId}&activo=eq.true&select=*,estudiante:estudiante_id(id,nombre,apellidos,grado,codigo_estudiante,email,activo)`
      );
    }
    
    // Si aún no encuentra, intentar por username
    if (!acudientes || acudientes.length === 0) {
      acudientes = await apiRequest(
        `acudientes?username=eq.${guardianId.toUpperCase()}&activo=eq.true&select=*,estudiante:estudiante_id(id,nombre,apellidos,grado,codigo_estudiante,email,activo)`
      );
    }
    
    return acudientes?.map(a => a.estudiante).filter(Boolean) || [];
  },

  /**
   * Obtener estudiantes por email del acudiente
   * (Un acudiente puede tener múltiples hijos)
   */
  async obtenerEstudiantesPorEmail(email) {
    const acudientes = await apiRequest(
      `acudientes?email=eq.${email.toLowerCase()}&activo=eq.true&select=*,estudiante:estudiante_id(id,nombre,apellidos,grado,codigo_estudiante,email,activo)`
    );
    return acudientes?.map(a => a.estudiante).filter(Boolean) || [];
  },

  /**
   * Verificar si un guardián tiene acceso a un estudiante
   */
  async verificarAcceso(guardianId, estudianteId) {
    // Buscar por ID del acudiente
    let resultado = await apiRequest(
      `acudientes?id=eq.${guardianId}&estudiante_id=eq.${estudianteId}&activo=eq.true&select=id`
    );
    
    // Si no encuentra, buscar por email
    if (!resultado || resultado.length === 0) {
      resultado = await apiRequest(
        `acudientes?email=eq.${guardianId}&estudiante_id=eq.${estudianteId}&activo=eq.true&select=id`
      );
    }
    
    return resultado && resultado.length > 0;
  }
};

// ============================================
// MÓDULO: BENCHMARKS
// ============================================

export const BenchmarksAPI = {
  /**
   * Obtener benchmarks para un grado
   */
  async obtenerPorGrado(grado) {
    const resultado = await apiRequest(
      `benchmarks_grado?grado=eq.${grado}&select=*`
    );
    return resultado && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Obtener todos los benchmarks
   */
  async listar() {
    return await apiRequest('benchmarks_grado?select=*&order=grado.asc');
  }
};

// ============================================
// MÓDULO: HABILIDADES COGNITIVAS
// ============================================

export const HabilidadesAPI = {
  /**
   * Obtener todas las habilidades
   */
  async listar() {
    return await apiRequest('habilidades_cognitivas?activo=eq.true&select=*&order=orden.asc');
  },

  /**
   * Obtener habilidad por código
   */
  async obtenerPorCodigo(codigo) {
    const resultado = await apiRequest(
      `habilidades_cognitivas?codigo=eq.${codigo}&select=*`
    );
    return resultado && resultado.length > 0 ? resultado[0] : null;
  }
};

// ============================================
// MÓDULO: RESUMEN DE CICLOS
// ============================================

export const ResumenCicloAPI = {
  /**
   * Obtener resumen de todos los ciclos de un estudiante
   */
  async obtenerHistorial(estudianteId) {
    return await apiRequest(
      `resumen_ciclo_estudiante?estudiante_id=eq.${estudianteId}&select=*&order=ciclo_numero.desc`
    );
  },

  /**
   * Obtener resumen de un ciclo específico
   */
  async obtenerCiclo(estudianteId, numeroCiclo) {
    const resultado = await apiRequest(
      `resumen_ciclo_estudiante?estudiante_id=eq.${estudianteId}&ciclo_numero=eq.${numeroCiclo}&select=*`
    );
    return resultado && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Obtener alertas activas de un estudiante
   */
  async obtenerAlertas(estudianteId) {
    const ciclos = await this.obtenerHistorial(estudianteId);
    const alertas = [];
    
    ciclos?.slice(0, 5).forEach(ciclo => {
      if (ciclo.alertas && Array.isArray(ciclo.alertas)) {
        ciclo.alertas.forEach(alerta => {
          alertas.push({
            ...alerta,
            ciclo: ciclo.ciclo_numero,
            fecha: ciclo.updated_at
          });
        });
      }
    });
    
    return alertas;
  }
};

// ============================================
// MÓDULO: DATOS DETALLADOS DE LECTURA
// ============================================

export const LecturaDetalleAPI = {
  /**
   * Obtener sesión de lectura con todos los detalles
   */
  async obtenerSesionCompleta(sesionId) {
    const resultado = await apiRequest(
      `sesiones_lectura?id=eq.${sesionId}&select=*,ciclos_lectura(id,titulo,autor,anio,resumen,conteo_palabras,lexile,contenido)`
    );
    return resultado && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Obtener historial de lectura de un estudiante
   */
  async obtenerHistorial(estudianteId) {
    return await apiRequest(
      `sesiones_lectura?estudiante_id=eq.${estudianteId}&estado=eq.finalizada&select=*,ciclos_lectura(id,numero_ciclo,titulo,autor,conteo_palabras,lexile)&order=fecha_fin_sesion.desc`
    );
  },

  /**
   * Obtener ranking del estudiante en su grado para un ciclo
   */
  async obtenerRanking(estudianteId, cicloId) {
    // Obtener todas las sesiones del ciclo
    const sesiones = await apiRequest(
      `sesiones_lectura?ciclo_id=eq.${cicloId}&estado=eq.finalizada&select=estudiante_id,velocidad_efectiva,porcentaje_comprension,velocidad_simple&order=velocidad_efectiva.desc`
    );
    
    if (!sesiones || sesiones.length === 0) return null;
    
    const posicion = sesiones.findIndex(s => s.estudiante_id === estudianteId) + 1;
    const total = sesiones.length;
    const percentil = ((total - posicion + 1) / total) * 100;
    
    // Calcular promedios
    const promedioVE = sesiones.reduce((sum, s) => sum + (s.velocidad_efectiva || 0), 0) / total;
    const promedioComprension = sesiones.reduce((sum, s) => sum + (s.porcentaje_comprension || 0), 0) / total;
    
    return {
      posicion,
      total,
      percentil: Math.round(percentil),
      promedioGradoVE: Math.round(promedioVE),
      promedioGradoComprension: Math.round(promedioComprension)
    };
  }
};

// ============================================
// MÓDULO: DATOS DETALLADOS DE CREATIVIDAD
// ============================================

export const CreatividadDetalleAPI = {
  /**
   * Obtener sesión de creatividad con detalles
   */
  async obtenerSesionCompleta(sesionId) {
    const resultado = await apiRequest(
      `sesiones_creatividad?id=eq.${sesionId}&select=*,ciclos_creatividad(id,titulo,instrucciones,archivo_url,archivo_tipo)`
    );
    return resultado && resultado.length > 0 ? resultado[0] : null;
  },

  /**
   * Obtener historial de creatividad de un estudiante
   */
  async obtenerHistorial(estudianteId) {
    return await apiRequest(
      `sesiones_creatividad?estudiante_id=eq.${estudianteId}&or=(estado.eq.calificada,estado.eq.finalizada)&select=*,ciclos_creatividad(id,numero_ciclo,titulo)&order=fecha_fin_sesion.desc.nullslast`
    );
  }
};

// ============================================
// MÓDULO: DATOS DETALLADOS DE EJERCICIOS
// ============================================

export const EjerciciosDetalleAPI = {
  /**
   * Obtener resultados de ejercicios por ciclo
   */
  async obtenerResultadosPorCiclo(estudianteId, numeroCiclo) {
    return await apiRequest(
      `resultados_juegos?estudiante_id=eq.${estudianteId}&select=*,juegos_ejercicios(id,nombre,url_juego,habilidad_estimulada,meta_objetivo,tipo_meta,ciclos_ejercicios(numero_ciclo))&order=fecha_registro.desc`
    );
  },

  /**
   * Obtener historial completo de ejercicios
   */
  async obtenerHistorial(estudianteId) {
    return await apiRequest(
      `resultados_juegos?estudiante_id=eq.${estudianteId}&select=*,juegos_ejercicios(id,nombre,url_juego,habilidad_estimulada,meta_objetivo,tipo_meta,ciclos_ejercicios(numero_ciclo,titulo,grado))&order=fecha_registro.desc`
    );
  },

  /**
   * Obtener desempeño por habilidad (agregado)
   */
  async obtenerDesempenoPorHabilidad(estudianteId) {
    const resultados = await this.obtenerHistorial(estudianteId);
    
    const habilidadesMap = {};
    
    resultados?.forEach(r => {
      const habilidad = r.juegos_ejercicios?.habilidad_estimulada;
      if (!habilidad) return;
      
      if (!habilidadesMap[habilidad]) {
        habilidadesMap[habilidad] = {
          codigo: habilidad,
          intentos: 0,
          metasAlcanzadas: 0,
          sumaRendimiento: 0
        };
      }
      
      const meta = r.juegos_ejercicios?.meta_objetivo || 1;
      const rendimiento = Math.min((r.resultado_obtenido / meta) * 100, 100);
      
      habilidadesMap[habilidad].intentos++;
      habilidadesMap[habilidad].sumaRendimiento += rendimiento;
      if (r.meta_alcanzada) habilidadesMap[habilidad].metasAlcanzadas++;
    });
    
    return Object.values(habilidadesMap).map(h => ({
      ...h,
      promedioRendimiento: Math.round(h.sumaRendimiento / h.intentos),
      porcentajeMetasAlcanzadas: Math.round((h.metasAlcanzadas / h.intentos) * 100)
    }));
  }
};

// ============================================
// MÓDULO: COMPARATIVOS
// ============================================

export const ComparativosAPI = {
  /**
   * Obtener comparativo del estudiante vs su grado
   */
  async obtenerComparativoGrado(estudianteId, grado) {
    // Obtener datos del estudiante
    const historialEstudiante = await LecturaDetalleAPI.obtenerHistorial(estudianteId);
    
    // Obtener promedios del grado
    const todasSesiones = await apiRequest(
      `sesiones_lectura?estado=eq.finalizada&select=velocidad_efectiva,porcentaje_comprension,usuarios:estudiante_id(grado)`
    );
    
    const sesionesGrado = todasSesiones?.filter(s => s.usuarios?.grado === grado) || [];
    
    if (sesionesGrado.length === 0) {
      return { sinDatos: true };
    }
    
    // Calcular promedios del grado
    const promedioVE = sesionesGrado.reduce((sum, s) => sum + (s.velocidad_efectiva || 0), 0) / sesionesGrado.length;
    const promedioComprension = sesionesGrado.reduce((sum, s) => sum + (s.porcentaje_comprension || 0), 0) / sesionesGrado.length;
    
    // Calcular promedios del estudiante
    const promedioEstudianteVE = historialEstudiante?.length > 0 
      ? historialEstudiante.reduce((sum, s) => sum + (s.velocidad_efectiva || 0), 0) / historialEstudiante.length 
      : 0;
    const promedioEstudianteComprension = historialEstudiante?.length > 0 
      ? historialEstudiante.reduce((sum, s) => sum + (s.porcentaje_comprension || 0), 0) / historialEstudiante.length 
      : 0;
    
    return {
      estudiante: {
        velocidadEfectiva: Math.round(promedioEstudianteVE),
        comprension: Math.round(promedioEstudianteComprension),
        ciclosCompletados: historialEstudiante?.length || 0
      },
      grado: {
        velocidadEfectiva: Math.round(promedioVE),
        comprension: Math.round(promedioComprension),
        totalEstudiantes: sesionesGrado.length
      },
      diferencia: {
        velocidadEfectiva: Math.round(promedioEstudianteVE - promedioVE),
        comprension: Math.round(promedioEstudianteComprension - promedioComprension)
      }
    };
  },

  /**
   * Obtener posición histórica del estudiante
   */
  async obtenerPosicionHistorica(estudianteId, grado) {
    const todasSesiones = await apiRequest(
      `sesiones_lectura?estado=eq.finalizada&select=estudiante_id,velocidad_efectiva,usuarios:estudiante_id(grado)`
    );
    
    const sesionesGrado = todasSesiones?.filter(s => s.usuarios?.grado === grado) || [];
    
    // Agrupar por estudiante y calcular promedio
    const estudiantesMap = {};
    sesionesGrado.forEach(s => {
      if (!estudiantesMap[s.estudiante_id]) {
        estudiantesMap[s.estudiante_id] = { suma: 0, count: 0 };
      }
      estudiantesMap[s.estudiante_id].suma += s.velocidad_efectiva || 0;
      estudiantesMap[s.estudiante_id].count++;
    });
    
    const estudiantes = Object.entries(estudiantesMap).map(([id, data]) => ({
      id,
      promedio: data.suma / data.count
    })).sort((a, b) => b.promedio - a.promedio);
    
    const posicion = estudiantes.findIndex(e => e.id === estudianteId) + 1;
    
    return {
      posicion: posicion > 0 ? posicion : null,
      total: estudiantes.length,
      percentil: posicion > 0 ? Math.round(((estudiantes.length - posicion + 1) / estudiantes.length) * 100) : null
    };
  }
};

// ============================================
// MÓDULO: GRADOS
// ============================================

export const GRADOS = [
  { value: 'tercero', label: '3° Tercero', edad: '8-9 años' },
  { value: 'cuarto', label: '4° Cuarto', edad: '9-10 años' },
  { value: 'quinto', label: '5° Quinto', edad: '10-11 años' },
  { value: 'sexto', label: '6° Sexto', edad: '11-12 años' },
  { value: 'septimo', label: '7° Séptimo', edad: '12-13 años' },
  { value: 'octavo', label: '8° Octavo', edad: '13-14 años' },
  { value: 'noveno', label: '9° Noveno', edad: '14-15 años' },
  { value: 'decimo', label: '10° Décimo', edad: '15-16 años' },
  { value: 'undecimo', label: '11° Undécimo', edad: '16-17 años' }
];

// ============================================
// MÓDULO: DESCRIPCIONES PARA PADRES
// ============================================

export const DESCRIPCIONES_METRICAS = {
  velocidad_simple: {
    titulo: 'Velocidad de Lectura',
    descripcion: 'Cantidad de palabras que su hijo lee por minuto. Indica fluidez lectora.',
    unidad: 'PPM',
    interpretacion: {
      bajo: 'Su hijo podría beneficiarse de más práctica de lectura en voz alta.',
      medio: 'Su hijo lee a un ritmo adecuado para su edad.',
      alto: 'Excelente fluidez lectora. Su hijo lee con gran velocidad.'
    }
  },
  comprension: {
    titulo: 'Comprensión Lectora',
    descripcion: 'Porcentaje de preguntas respondidas correctamente sobre el texto leído. Mide cuánto entiende lo que lee.',
    unidad: '%',
    interpretacion: {
      bajo: 'Sugerimos leer junto a su hijo y discutir el contenido.',
      medio: 'Buena comprensión. Su hijo entiende la mayor parte de lo que lee.',
      alto: 'Excelente comprensión. Su hijo capta detalles y significados profundos.'
    }
  },
  velocidad_efectiva: {
    titulo: 'Velocidad Efectiva',
    descripcion: 'Combina velocidad y comprensión. Representa las palabras que realmente entiende por minuto.',
    unidad: 'VE',
    interpretacion: {
      bajo: 'Esta métrica mejora trabajando tanto velocidad como comprensión.',
      medio: 'Buen equilibrio entre velocidad y comprensión.',
      alto: 'Lectura eficiente: su hijo lee rápido Y entiende bien.'
    }
  },
  creatividad: {
    titulo: 'Creatividad',
    descripcion: 'Evaluación del docente sobre el trabajo creativo del estudiante.',
    unidad: '%',
    interpretacion: {
      bajo: 'Anime a su hijo a explorar ideas diferentes y originales.',
      medio: 'Buena expresión creativa.',
      alto: 'Excelente creatividad y originalidad en su trabajo.'
    }
  }
};

export { API_URL, API_KEY };
