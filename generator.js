// generator.js - Backend del Generador de Plataformas STEAM
// Configuración de Supabase
const SUPABASE_URL = 'https://rxqiimwqlisnurgmtmtw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cWlpbXdxbGlzbnVyZ210bXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjcyNzcsImV4cCI6MjA3NzAwMzI3N30.meJx3YvbvwQJHvfLs52DZ9LppSJIVbBvyAVPqJfi9wg';

// Estado global
let state = {
    grade: null,
    ciclo: 1,
    readingType: 'continua',
    jsonData: null,
    imageData: null,
    desafioImageData: null,
    jsonFileName: null,
    imageFileName: null,
    desafioFileName: null,
    apps: [
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' },
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' },
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' }
    ]
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    testSupabaseConnection();
});

// Event Listeners
function initializeEventListeners() {
    // Selección de grado
    document.querySelectorAll('.grade-btn').forEach(btn => {
        btn.addEventListener('click', () => selectGrade(btn));
    });

    // Tipo de lectura
    document.querySelectorAll('input[name="readingType"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.readingType = e.target.value;
            updateInterfaceForReadingType();
        });
    });

    // Ciclo
    document.getElementById('cicloNumber').addEventListener('input', (e) => {
        state.ciclo = parseInt(e.target.value) || 1;
    });

    // File uploads
    document.getElementById('jsonFile').addEventListener('change', handleJsonUpload);
    document.getElementById('imageFile').addEventListener('change', handleImageUpload);
    document.getElementById('desafioFile').addEventListener('change', handleDesafioUpload);

    // Click en áreas de upload
    document.getElementById('jsonUpload').addEventListener('click', () => {
        document.getElementById('jsonFile').click();
    });
    document.getElementById('imageUpload').addEventListener('click', () => {
        document.getElementById('imageFile').click();
    });
    document.getElementById('desafioUpload').addEventListener('click', () => {
        document.getElementById('desafioFile').click();
    });

    // Botones de acción
    document.getElementById('clearBtn').addEventListener('click', clearAllFields);
    document.getElementById('previewBtn').addEventListener('click', previewPlatform);
    document.getElementById('generateBtn').addEventListener('click', generatePlatform);

    // Inputs de aplicaciones
    for (let i = 1; i <= 3; i++) {
        ['Habilidad', 'Meta', 'Nombre', 'Url'].forEach(field => {
            const element = document.getElementById(`app${i}${field}`);
            if (element) {
                element.addEventListener('input', (e) => {
                    updateAppData(i - 1, field.toLowerCase(), e.target.value);
                });
            }
        });
        // Selector de tipo de meta
        const tipoMetaSelect = document.getElementById(`app${i}TipoMeta`);
        if (tipoMetaSelect) {
            tipoMetaSelect.addEventListener('change', (e) => {
                updateAppData(i - 1, 'tipoMeta', e.target.value);
            });
        }
    }
}

// Selección de grado
function selectGrade(btn) {
    document.querySelectorAll('.grade-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.grade = btn.dataset.grade;
    validateForm();
}

// Actualizar interfaz según tipo de lectura
function updateInterfaceForReadingType() {
    const alert = document.querySelector('.alert-info strong').nextSibling;
    if (state.readingType === 'discontinua') {
        alert.textContent = ' Para lecturas discontinuas, solo se requiere la imagen (se mostrará centrada). El JSON debe contener título, autor, año, lexile y preguntas.';
    } else {
        alert.textContent = ' Para lecturas continuas, carga el JSON con el texto completo. La imagen se mostrará en la esquina superior derecha.';
    }
}

// Manejar carga de JSON
function handleJsonUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            state.jsonData = JSON.parse(event.target.result);
            state.jsonFileName = file.name; // Guardar nombre del archivo
            document.getElementById('jsonUpload').classList.add('has-file');
            document.querySelector('#jsonUpload .file-upload-text strong').textContent = `✅ ${file.name}`;
            validateForm();
        } catch (error) {
            alert('Error al leer el archivo JSON. Verifica que sea un JSON válido.');
            console.error(error);
            // Limpiar el input si hay error
            e.target.value = '';
            state.jsonFileName = null;
        }
    };
    reader.readAsText(file);
}

// Manejar carga de imagen de lectura
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.imageData = event.target.result;
        state.imageFileName = file.name; // Guardar nombre del archivo
        document.getElementById('imageUpload').classList.add('has-file');
        document.querySelector('#imageUpload .file-upload-text strong').textContent = `✅ ${file.name}`;
        validateForm();
    };
    reader.onerror = () => {
        alert('Error al leer la imagen.');
        e.target.value = '';
        state.imageFileName = null;
    };
    reader.readAsDataURL(file);
}

// Manejar carga de imagen de desafío
function handleDesafioUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.desafioImageData = event.target.result;
        state.desafioFileName = file.name; // Guardar nombre del archivo
        document.getElementById('desafioUpload').classList.add('has-file');
        document.querySelector('#desafioUpload .file-upload-text strong').textContent = `✅ ${file.name}`;
        validateForm();
    };
    reader.onerror = () => {
        alert('Error al leer la imagen.');
        e.target.value = '';
        state.desafioFileName = null;
    };
    reader.readAsDataURL(file);
}

// Actualizar datos de aplicaciones
function updateAppData(index, field, value) {
    state.apps[index][field] = value;
    validateForm();
}

// Validar formulario
function validateForm() {
    const isValid = 
        state.grade !== null &&
        state.jsonData !== null &&
        state.imageData !== null &&
        state.desafioImageData !== null &&
        state.apps.every(app => app.habilidad && app.meta && app.nombre && app.url);

    document.getElementById('previewBtn').disabled = !isValid;
    document.getElementById('generateBtn').disabled = !isValid;
}

// Test conexión Supabase
async function testSupabaseConnection() {
    const statusDiv = document.getElementById('connectionStatus');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (response.ok) {
            statusDiv.className = 'connection-status success';
            statusDiv.innerHTML = '✅ Conexión exitosa con Supabase';
        } else {
            throw new Error('Error de conexión');
        }
    } catch (error) {
        statusDiv.className = 'connection-status error';
        statusDiv.innerHTML = '❌ Error de conexión: ' + error.message;
    }
}

// Vista previa
function previewPlatform() {
    const html = generatePlatformHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

// Generar plataforma
function generatePlatform() {
    const html = generatePlatformHTML();
    const filename = `grado_${state.grade}.html`;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    // Restaurar indicadores visuales de archivos cargados
    // Los datos se mantienen en el state, solo restauramos la UI
    restoreFileIndicators();
    
    alert(`✅ Plataforma generada exitosamente: ${filename}\n\nLos datos se han mantenido para que puedas generar otra plataforma fácilmente. Usa el botón "Limpiar" si deseas borrar todo.`);
}

// Restaurar indicadores visuales de archivos cargados
function restoreFileIndicators() {
    // Restaurar indicador de JSON
    if (state.jsonData) {
        document.getElementById('jsonUpload').classList.add('has-file');
        const fileName = state.jsonFileName || 'JSON cargado';
        document.querySelector('#jsonUpload .file-upload-text strong').textContent = `✅ ${fileName}`;
    }
    
    // Restaurar indicador de imagen de lectura
    if (state.imageData) {
        document.getElementById('imageUpload').classList.add('has-file');
        const fileName = state.imageFileName || 'Imagen cargada';
        document.querySelector('#imageUpload .file-upload-text strong').textContent = `✅ ${fileName}`;
    }
    
    // Restaurar indicador de imagen de desafío
    if (state.desafioImageData) {
        document.getElementById('desafioUpload').classList.add('has-file');
        const fileName = state.desafioFileName || 'Imagen de desafío cargada';
        document.querySelector('#desafioUpload .file-upload-text strong').textContent = `✅ ${fileName}`;
    }
    
    // Validar formulario para habilitar botones
    validateForm();
}

// Aleatorizar opciones de preguntas
function shuffleOptions(questions) {
    return questions.map(q => {
        if (!q.options || q.options.length === 0) return q;
       
        // Crear array de opciones con sus índices originales
        const optionsWithIndex = q.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
       
        // Aleatorizar
        for (let i = optionsWithIndex.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [optionsWithIndex[i], optionsWithIndex[j]] = [optionsWithIndex[j], optionsWithIndex[i]];
        }
       
        // Encontrar nuevo índice de la respuesta correcta
        const newAnswerIndex = optionsWithIndex.findIndex(opt => opt.originalIndex === q.answer);
       
        return {
            ...q,
            options: optionsWithIndex.map(opt => opt.text),
            answer: newAnswerIndex
        };
    });
}

// Generar HTML de la plataforma
function generatePlatformHTML() {
    const reading = state.jsonData.reading;
    const questions = shuffleOptions(state.jsonData.questions || []);
    const vocabQuestions = shuffleOptions(state.jsonData.vocabulary_questions || []);
    const keywords = reading.keywords || [];
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reading.title} - Grado ${state.grade}</title>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            line-height: 1.8;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .student-name {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.5em;
            font-weight: 600;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        .reading-header {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .title {
            font-size: 2.5em;
            color: #333;
            margin-bottom: 10px;
        }

        .author {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 20px;
        }

        .metadata {
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .metadata-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .metadata-label {
            color: #FF6B35;
            font-weight: 600;
        }

        .metadata-value {
            color: #333;
        }

        .timer {
            font-size: 2em;
            font-weight: 600;
            color: #FF6B35;
            text-align: center;
            padding: 20px;
            background: #fff5f2;
            border-radius: 10px;
            margin: 20px 0;
        }

        .summary-box, .text-box {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            font-size: 1.1em;
        }

        .text-box {
            display: grid;
            ${state.readingType === 'continua' ? 'grid-template-columns: 1fr 300px;' : 'grid-template-columns: 1fr;'}
            gap: 30px;
        }

        .text-content {
            line-height: 1.8;
            font-family: 'Times New Roman', Times, serif;
            font-size: 1.1em;
        }
        
        .text-content p {
            margin-bottom: 1em;
            text-align: justify;
        }
        
        .text-content p:last-child {
            margin-bottom: 0;
        }

        .reading-image {
            ${state.readingType === 'continua' ? 'width: 100%; border-radius: 10px;' : 'max-width: 800px; margin: 0 auto; border-radius: 10px;'}
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .reading-image-discontinua {
            text-align: center;
            padding: 20px;
        }

        .keyword {
            background: #00C896;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: help;
            position: relative;
            transition: all 0.3s;
        }

        .keyword:hover {
            background: #000;
        }

        .keyword-tooltip {
            display: none;
            position: absolute;
            background: #000;
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            font-size: 0.9em;
        }

        .keyword:hover .keyword-tooltip {
            display: block;
        }

        .keyword.disabled:hover .keyword-tooltip {
            display: none;
        }

        .feedback-box {
            margin-top: 15px;
            padding: 15px;
            background: #e3f2fd;
            border-left: 4px solid #2196F3;
            border-radius: 5px;
            display: none;
        }

        .feedback-box.visible {
            display: block;
        }

        .feedback-label {
            font-weight: 600;
            color: #1565C0;
            margin-bottom: 5px;
        }

        .feedback-text {
            color: #333;
            line-height: 1.6;
        }

        .btn {
            padding: 15px 40px;
            border: none;
            border-radius: 10px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-block;
            text-align: center;
        }

        .btn-primary {
            background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(255, 107, 53, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none !important;
        }

        .questions-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .questions-title {
            font-size: 1.8em;
            color: #FF6B35;
            margin-bottom: 20px;
            text-align: center;
        }

        .question {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border-left: 5px solid #FF6B35;
        }

        .question-stem {
            font-weight: 600;
            margin-bottom: 15px;
            font-size: 1.1em;
            color: #333;
        }

        .option {
            padding: 12px 20px;
            margin: 8px 0;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .option:hover {
            border-color: #FF6B35;
            background: #fff5f2;
        }

        .option.selected {
            border-color: #FF6B35;
            background: #fff5f2;
        }

        .option.correct {
            border-color: #28a745;
            background: #d4edda;
        }

        .option.incorrect {
            border-color: #dc3545;
            background: #f8d7da;
        }

        .results-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .result-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 3px solid #e0e0e0;
        }

        .result-label {
            font-weight: 600;
            color: #666;
            margin-bottom: 10px;
        }

        .result-value {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .result-percentage {
            font-size: 1.2em;
            font-weight: 600;
            padding: 8px;
            border-radius: 5px;
        }

        .percentage-red { background: #f8d7da; color: #721c24; }
        .percentage-orange { background: #fff3cd; color: #856404; }
        .percentage-green { background: #d4edda; color: #155724; }
        .percentage-blue { background: #d1ecf1; color: #0c5460; }

        .grade-label {
            font-size: 1.5em;
            font-weight: 700;
            color: #FF6B35;
            margin-top: 10px;
        }

        .desafio-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .desafio-image-container {
            text-align: center;
            position: relative;
            margin: 20px 0;
        }

        .desafio-image {
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }

        .zoom-controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }

        .zoom-btn {
            padding: 10px 20px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .zoom-btn:hover {
            background: #764ba2;
            transform: scale(1.05);
        }

        .grade-buttons {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 20px 0;
        }

        .grade-percentage-btn {
            padding: 15px;
            background: white;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .grade-percentage-btn:hover {
            border-color: #FF6B35;
            background: #fff5f2;
        }

        .app-section {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }

        .app-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .app-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border: 3px solid #e0e0e0;
            text-align: center;
        }

        .app-habilidad {
            font-size: 1.3em;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
        }

        .app-meta {
            color: #666;
            margin-bottom: 15px;
        }

        .app-nombre {
            font-weight: 600;
            color: #FF6B35;
            margin-bottom: 15px;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: white;
            padding: 30px;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .modal-title {
            font-size: 1.5em;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }

        .modal-message {
            font-size: 1.1em;
            color: #666;
            margin-bottom: 20px;
            text-align: center;
        }

        .modal-warning {
            background: #fff3cd;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
        }

        .modal-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            margin-bottom: 20px;
        }

        .modal-buttons {
            display: flex;
            gap: 15px;
        }

        .summary-modal-content {
            max-width: 900px;
            max-height: 80vh;
            overflow-y: auto;
        }

        .summary-section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #FF6B35;
        }

        .summary-section-title {
            font-size: 1.5em;
            color: #FF6B35;
            margin-bottom: 15px;
            font-weight: 700;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .summary-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }

        .summary-item-label {
            font-weight: 600;
            color: #666;
            font-size: 0.9em;
            margin-bottom: 8px;
        }

        .summary-item-value {
            font-size: 1.8em;
            font-weight: 700;
            color: #FF6B35;
        }

        .btn-cancel {
            background: #6c757d;
            color: white;
            flex: 1;
        }

        .btn-accept {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            flex: 1;
        }

        .font-size-control {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 10px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
        }

        .font-size-btn {
            padding: 8px 15px;
            margin: 0 5px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
        }

        .hidden {
            display: none !important;
        }

        @media (max-width: 768px) {
            .text-box {
                grid-template-columns: 1fr;
            }

            .grade-buttons {
                grid-template-columns: repeat(2, 1fr);
            }

            .results-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="font-size-control">
        <button class="font-size-btn" onclick="changeFontSize(-2)">A-</button>
        <button class="font-size-btn" onclick="changeFontSize(2)">A+</button>
    </div>

    <div class="container">
        <div class="student-name" id="studentName">Cargando estudiante...</div>

        <!-- SECCIÓN DE LECTURA CRÍTICA -->
        <div id="readingSection">
            <div class="reading-header">
                <div class="title">${reading.title}</div>
                <div class="author">Por ${reading.author}</div>
                <div class="metadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Palabras:</span>
                        <span class="metadata-value">${reading.word_count_text}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Lexile:</span>
                        <span class="metadata-value">${reading.lexile}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Año:</span>
                        <span class="metadata-value">${reading.year}</span>
                    </div>
                </div>
            </div>

            <div class="timer" id="timer">00:00</div>

            ${state.readingType === 'continua' ? `
            <div class="summary-box" id="summaryBox">
                <h3 style="color: #FF6B35; margin-bottom: 15px;">Resumen</h3>
                <p>${reading.summary}</p>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn btn-primary" onclick="startReading()">Iniciar Lectura</button>
                </div>
            </div>
            ` : ''}

            <div class="text-box hidden" id="textBox">
                ${state.readingType === 'continua' ? `
                <div class="text-content" id="textContent">
                    ${highlightKeywords(reading.text_excerpt, reading.keywords)}
                </div>
                <div>
                    <img src="${state.imageData}" alt="${reading.title}" class="reading-image">
                </div>
                ` : `
                <div class="reading-image-discontinua">
                    <img src="${state.imageData}" alt="${reading.title}" class="reading-image" style="max-width: 100%;">
                </div>
                `}
            </div>

            ${state.readingType === 'continua' ? `
            <div style="text-align: center; margin-top: 20px;" class="hidden" id="finishReadingBtn">
                <button class="btn btn-primary" onclick="finishReading()">Terminé de Leer</button>
            </div>
            ` : `
            <div style="text-align: center; margin-top: 20px;" id="startDiscontinuaBtn">
                <button class="btn btn-primary" onclick="startDiscontinuousReading()">Ver Imagen e Iniciar</button>
            </div>
            `}
        </div>

        <!-- PREGUNTAS DE VOCABULARIO -->
        <div class="questions-section hidden" id="vocabSection">
            <h2 class="questions-title">Cuestionario de Vocabulario</h2>
            ${vocabQuestions.map((q, index) => `
                <div class="question">
                    <div class="question-stem">V${index + 1}. ${q.stem}</div>
                    ${q.options.map((opt, i) => `
                        <div class="option" data-question="vocab-${index}" data-answer="${i}" onclick="selectAnswer('vocab-${index}', ${i}, ${q.answer})">
                            ${opt}
                        </div>
                    `).join('')}
                </div>
            `).join('')}
            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-primary" onclick="submitVocabularyAnswers()">Registrar Respuestas</button>
            </div>
        </div>

        <!-- PREGUNTAS DE EVALUACIÓN -->
        <div class="questions-section hidden" id="evalSection">
            <h2 class="questions-title">Evaluación de Lectura Crítica</h2>
            ${questions.map((q, index) => `
                <div class="question" id="evalQuestion${index}">
                    <div class="question-stem">P${index + 1}. ${q.stem}</div>
                    ${q.options && q.options.length > 0 ? q.options.map((opt, i) => `
                        <div class="option" data-question="eval-${index}" data-answer="${i}" onclick="selectAnswer('eval-${index}', ${i}, ${q.answer})">
                            ${opt}
                        </div>
                    `).join('') : ''}
                    ${q.justification ? `
                        <div class="feedback-box" id="feedback-eval-${index}">
                            <div class="feedback-label">💡 Explicación:</div>
                            <div class="feedback-text">${q.justification}</div>
                        </div>
                    ` : ''}
                </div>
            `).join('')}
            <div style="text-align: center; margin-top: 30px;">
                <button class="btn btn-primary" id="submitReadingBtn" onclick="submitReadingResults()">Registrar Evaluación</button>
            </div>
        </div>

        <!-- RESULTADOS DE LECTURA -->
        <div class="results-section hidden" id="resultsSection">
            <h2 class="questions-title">Resultados de Lectura Crítica</h2>
            <div class="results-grid" id="resultsGrid"></div>
            <div style="text-align: center; margin-top: 30px; display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button class="btn btn-primary" onclick="startDesafio()">Continuar al Desafío Mental</button>
                <button class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff;" onclick="verRanking()">🏆 Ver Ranking</button>
            </div>
        </div>

        <!-- SECCIÓN DE DESAFÍO MENTAL -->
        <div class="desafio-section hidden" id="desafioSection">
            <h2 class="questions-title">Desafío Mental</h2>
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomImage('out')">Zoom Out</button>
                <button class="zoom-btn" onclick="zoomImage('reset')">Reset</button>
                <button class="zoom-btn" onclick="zoomImage('in')">Zoom In</button>
            </div>
            <div class="desafio-image-container">
                <img src="${state.desafioImageData}" alt="Desafío Mental" class="desafio-image" id="desafioImage">
            </div>
            <h3 style="text-align: center; color: #FF6B35; margin: 20px 0;">Autocalificación (Autorizada por Monitor)</h3>
            <div class="grade-buttons">
                ${[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => `
                    <button class="grade-percentage-btn" onclick="gradeDesafio(${p})">${p}%</button>
                `).join('')}
            </div>
            <div id="desafioResult" class="result-card hidden" style="margin-top: 20px;"></div>
            <div style="text-align: center; margin-top: 30px;" class="hidden" id="continueToAppsBtn">
                <button class="btn btn-primary" onclick="startApplications()">Continuar a Aplicaciones</button>
            </div>
        </div>

        <!-- SECCIÓN DE APLICACIONES -->
        <div class="app-section hidden" id="appSection">
            <h2 class="questions-title">Brain Training - Aplicaciones</h2>
            <div class="app-cards">
                ${state.apps.map((app, index) => `
                    <div class="app-card">
                        <div class="app-habilidad">Habilidad: ${app.habilidad}</div>
                        <div class="app-meta">Meta: ${app.meta} ${app.tipoMeta || 'puntos'}</div>
                        <div class="app-nombre">${app.nombre}</div>
                        <button class="btn btn-primary" onclick="openApp('${app.url}', ${index})">
                            Jugar
                        </button>
                        <div id="appResult${index}" class="result-card hidden" style="margin-top: 15px;"></div>
                    </div>
                `).join('')}
            </div>
            <div style="text-align: center; margin-top: 30px;" class="hidden" id="closeSessionBtn">
                <button class="btn btn-primary" onclick="closeSession()">Cerrar Sesión</button>
            </div>
        </div>
    </div>

    <!-- MODALES -->
    <div class="modal" id="desafioModal">
        <div class="modal-content">
            <div class="modal-title">Calificación del Desafío</div>
            <div class="modal-message">La calificación para la solución que has planteado a este desafío es de <strong id="desafioPercentage"></strong></div>
            <div class="modal-warning">El monitor de sala debe autorizar esta calificación</div>
            <div class="modal-buttons">
                <button class="btn btn-cancel" onclick="closeModal('desafioModal')">Cancelar</button>
                <button class="btn btn-accept" onclick="confirmDesafio()">Aceptar</button>
            </div>
        </div>
    </div>

    <div class="modal" id="appModal">
        <div class="modal-content">
            <div class="modal-title">Registrar Resultado</div>
            <div class="modal-message">Ingresa el resultado obtenido en <strong id="appModalName"></strong></div>
            <input type="number" class="modal-input" id="appScoreInput" placeholder="Resultado obtenido">
            <div class="modal-warning">El monitor debe autorizar el registro de este resultado</div>
            <div class="modal-buttons">
                <button class="btn btn-cancel" onclick="closeModal('appModal')">Cancelar</button>
                <button class="btn btn-accept" onclick="confirmAppScore()">Aceptar</button>
            </div>
        </div>
    </div>

    <div class="modal" id="finalSummaryModal">
        <div class="modal-content summary-modal-content">
            <div class="modal-title">📊 Resumen de la Sesión</div>
            <div class="summary-section">
                <div class="summary-section-title">📖 Lectura Crítica</div>
                <div class="summary-grid" id="summaryReading"></div>
            </div>
            <div class="summary-section">
                <div class="summary-section-title">🧩 Desafío Mental</div>
                <div class="summary-grid" id="summaryDesafio"></div>
            </div>
            <div class="summary-section">
                <div class="summary-section-title">🎮 Aplicaciones Brain Training</div>
                <div class="summary-grid" id="summaryApps"></div>
            </div>
            <div class="modal-buttons">
                <button class="btn btn-accept" onclick="confirmCloseSession()">Cerrar Sesión</button>
                <button class="btn btn-cancel" onclick="closeModal('finalSummaryModal')">Volver</button>
            </div>
        </div>
    </div>

    <script>
        // Configuración
        const SUPABASE_URL = '${SUPABASE_URL}';
        const SUPABASE_KEY = '${SUPABASE_ANON_KEY}';
        // Usar window.supabaseClient para evitar conflictos de redeclaración
        if (!window.supabaseClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
        const supabase = window.supabaseClient;
        const CICLO_ACTUAL = ${state.ciclo};

        // Estado
        let state = {
            studentCode: null,
            studentName: null,
            grade: ${state.grade},
            ciclo: ${state.ciclo},
            timerInterval: null,
            startTime: null,
            timeElapsed: 0,
            fontSize: 18,
            vocabAnswers: {},
            evalAnswers: {},
            vocabCorrect: 0,
            evalCorrect: 0,
            zoomLevel: 1,
            currentDesafioGrade: null,
            currentAppIndex: null,
            completedApps: 0,
            readingType: '${state.readingType}',
            readingRegistered: false,
            sessionCheckInterval: null,
            readingStarted: false
        };

        // Datos embebidos
        const readingData = ${JSON.stringify(reading)};
        const vocabQuestions = ${JSON.stringify(vocabQuestions)};
        const evalQuestions = ${JSON.stringify(questions)};
        const apps = ${JSON.stringify(state.apps)};

        // Inicialización
        window.addEventListener('DOMContentLoaded', async () => {
            await loadStudent();
            checkActivityStatus();
            setupBeforeUnloadHandler();
        });

        // Cargar estudiante con verificación de sesión
        async function loadStudent() {
            const urlParams = new URLSearchParams(window.location.search);
            state.studentCode = urlParams.get('student');
            
            if (!state.studentCode) {
                alert('Acceso no autorizado. Debes ingresar desde el login.');
                window.location.href = '../index.html';
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('estudiantes')
                    .select('nombre, apellidos, grado')
                    .eq('codigo_estudiante', state.studentCode)
                    .single();

                if (error) throw error;
                
                if (data.grado !== state.grade) {
                    // Redirigir directamente sin alert que puede causar bucles
                    window.location.replace('grado_' + data.grado + '.html?student=' + state.studentCode);
                    return;
                }
                
                state.studentName = data.nombre + ' ' + data.apellidos;
                document.getElementById('studentName').textContent = '👤 ' + state.studentName;
                
                await verificarSesionActiva();
                
            } catch (error) {
                console.error('Error cargando estudiante:', error);
                alert('Error al cargar información del estudiante');
                window.location.href = '../index.html';
            }
        }

        // Verificar que la sesión activa sea válida
        // Con reintentos para manejar posibles condiciones de carrera
        async function verificarSesionActiva() {
            let intentos = 0;
            const maxIntentos = 6; // Aumentado a 6 intentos
            const delay = 2000; // Aumentado a 2 segundos entre intentos para dar más tiempo
            let sesionEncontrada = false;
            
            while (intentos < maxIntentos && !sesionEncontrada) {
                try {
                    // Intentar buscar sesión con ciclo específico primero
                    let { data, error } = await supabase
                        .from('sesiones_activas')
                        .select('*')
                        .eq('codigo_estudiante', state.studentCode)
                        .eq('grado', state.grade)
                        .eq('ciclo', CICLO_ACTUAL)
                        .eq('sesion_activa', true)
                        .maybeSingle();

                    if (error) {
                        console.error('Error en query de sesión (intento ' + (intentos + 1) + '):', error);
                        throw error;
                    }
                    
                    if (data) {
                        // Sesión encontrada, continuar normalmente
                        sesionEncontrada = true;
                        break;
                    }
                    
                    // Si no se encontró con ciclo específico, intentar buscar cualquier sesión activa
                    // para verificar si hay un problema de ciclo
                    const { data: sesionesCualesquiera, error: error2 } = await supabase
                        .from('sesiones_activas')
                        .select('*')
                        .eq('codigo_estudiante', state.studentCode)
                        .eq('grado', state.grade)
                        .eq('sesion_activa', true);
                    
                    if (error2) {
                        console.error('Error buscando sesiones (intento ' + (intentos + 1) + '):', error2);
                    } else if (sesionesCualesquiera && sesionesCualesquiera.length > 0) {
                        // Hay una sesión activa pero con ciclo diferente
                        console.warn('Sesión encontrada con ciclo diferente. Ciclo esperado:', CICLO_ACTUAL, 'Ciclo encontrado:', sesionesCualesquiera[0].ciclo);
                        // Intentar actualizar la sesión al ciclo correcto
                        const { error: updateError } = await supabase
                            .from('sesiones_activas')
                            .update({ ciclo: CICLO_ACTUAL, sesion_activa: true })
                            .eq('codigo_estudiante', state.studentCode)
                            .eq('grado', state.grade)
                            .eq('sesion_activa', true);
                        
                        if (!updateError) {
                            sesionEncontrada = true;
                            break;
                        }
                    }
                    
                    // Si no se encontró y aún hay intentos, esperar y reintentar
                    if (intentos < maxIntentos - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        intentos++;
                        continue;
                    }
                    
                } catch (error) {
                    console.error('Error verificando sesión (intento ' + (intentos + 1) + '):', error);
                    if (intentos < maxIntentos - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                        intentos++;
                        continue;
                    }
                }
            }
            
            // Si no se encontró después de todos los intentos
            if (!sesionEncontrada) {
                console.error('No se pudo verificar sesión después de', maxIntentos, 'intentos');
                alert('Sesión no válida. Por favor ingresa desde el login.');
                window.location.href = '../index.html';
                return;
            }
            
            // Si llegamos aquí, la sesión fue verificada exitosamente
            // Iniciar verificación periódica de sesión
            let consecutiveErrors = 0;
            const maxConsecutiveErrors = 3; // Permitir hasta 3 errores consecutivos antes de redirigir
            
            state.sessionCheckInterval = setInterval(async () => {
                // Si ya se registró la lectura, detener verificación inmediatamente
                if (state.readingRegistered) {
                    clearInterval(state.sessionCheckInterval);
                    state.sessionCheckInterval = null;
                    return;
                }
                
                // Si la lectura ha comenzado, no redirigir tan rápido (dar más tiempo)
                if (state.readingStarted && !state.readingRegistered) {
                    // Reducir la frecuencia de verificación durante la lectura activa
                    // Esto se maneja aumentando el intervalo, pero por ahora solo verificamos
                }
                
                try {
                    const { data: sesion, error } = await supabase
                        .from('sesiones_activas')
                        .select('sesion_activa')
                        .eq('codigo_estudiante', state.studentCode)
                        .eq('grado', state.grade)
                        .eq('ciclo', CICLO_ACTUAL)
                        .maybeSingle();
                    
                    // Si hay error, incrementar contador de errores consecutivos
                    if (error) {
                        console.error('Error en verificación periódica de sesión:', error);
                        consecutiveErrors++;
                        
                        // Solo redirigir si hay múltiples errores consecutivos
                        if (consecutiveErrors >= maxConsecutiveErrors && !state.readingRegistered) {
                            clearInterval(state.sessionCheckInterval);
                            state.sessionCheckInterval = null;
                            alert('Error al verificar sesión. Redirigiendo...');
                            window.location.href = '../index.html';
                        }
                        return; // No continuar si hay error
                    }
                    
                    // Si no hay error, resetear contador de errores
                    consecutiveErrors = 0;
                    
                    // Si no se encuentra sesión o está inactiva, y aún no se registró la lectura, redirigir
                    if (!sesion || !sesion.sesion_activa) {
                        // Verificar nuevamente si se registró (por si acaso cambió durante la verificación)
                        if (!state.readingRegistered) {
                            // Si la lectura ha comenzado, dar más tiempo antes de redirigir
                            if (state.readingStarted) {
                                console.warn('Sesión no encontrada o inactiva durante lectura. Reintentando...');
                                // Intentar recrear la sesión
                                try {
                                    const { error: createError } = await supabase
                                        .from('sesiones_activas')
                                        .upsert({
                                            codigo_estudiante: state.studentCode,
                                            grado: state.grade,
                                            ciclo: CICLO_ACTUAL,
                                            sesion_activa: true
                                        }, {
                                            onConflict: 'codigo_estudiante,grado,ciclo'
                                        });
                                    
                                    if (createError) {
                                        console.error('Error recreando sesión:', createError);
                                    } else {
                                        console.log('Sesión recreada exitosamente');
                                        return; // Continuar sin redirigir
                                    }
                                } catch (e) {
                                    console.error('Error al intentar recrear sesión:', e);
                                }
                            }
                            
                            clearInterval(state.sessionCheckInterval);
                            state.sessionCheckInterval = null;
                            alert('Tu sesión ha sido cerrada. Redirigiendo...');
                            window.location.href = '../index.html';
                        }
                    }
                } catch (error) {
                    console.error('Error en verificación periódica de sesión:', error);
                    consecutiveErrors++;
                    
                    // Solo redirigir si hay múltiples errores consecutivos
                    if (consecutiveErrors >= maxConsecutiveErrors && !state.readingRegistered && !state.readingStarted) {
                        clearInterval(state.sessionCheckInterval);
                        state.sessionCheckInterval = null;
                        alert('Error al verificar sesión. Redirigiendo...');
                        window.location.href = '../index.html';
                    }
                }
            }, 10000);
        }

        // Verificar estado de actividad con bloqueo total si ya se completó
        // IMPORTANTE: Verifica por título de lectura para permitir nuevas plataformas con diferentes títulos
        async function checkActivityStatus() {
            // Si ya se registró la lectura en esta sesión, no verificar (evitar interferencias)
            if (state.readingRegistered) {
                return;
            }
            
            try {
                // Buscar TODOS los registros de lectura con este título (puede haber múltiples intentos)
                const { data: lecturas, error } = await supabase
                    .from('steam_lectura')
                    .select('*')
                    .eq('codigo_estudiante', state.studentCode)
                    .eq('grado', state.grade)
                    .eq('ciclo', CICLO_ACTUAL)
                    .eq('titulo_lectura', readingData.title)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Si hay registros, verificar si TODOS están deshabilitados (habilitado = false o null)
                // Si hay AL MENOS UNO con habilitado = true, permitir la actividad
                if (lecturas && lecturas.length > 0) {
                    // Verificar si TODOS los registros están deshabilitados
                    const todosDeshabilitados = lecturas.every(l => l.habilitado === false || l.habilitado === null);
                    
                    // Si todos están deshabilitados, bloquear
                    // Si hay al menos uno habilitado, permitir (puede repetir)
                    if (todosDeshabilitados && !state.readingRegistered) {
                        bloquearActividad();
                        alert('Esta actividad ya fue completada previamente. Contacta al monitor si necesitas repetirla.');
                    }
                    // Si hay al menos uno habilitado, no bloquear (permite repetir)
                }
            } catch (error) {
                console.error('Error verificando estado:', error);
            }
        }

        // Bloquear toda la actividad visualmente
        function bloquearActividad() {
            const botones = document.querySelectorAll('button');
            botones.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
            
            const opciones = document.querySelectorAll('.option');
            opciones.forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '0.5';
            });
            
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#27ae60;color:white;padding:15px;text-align:center;font-size:1.2em;font-weight:bold;z-index:10000;box-shadow:0 4px 6px rgba(0,0,0,0.3)';
            banner.textContent = 'ACTIVIDAD COMPLETADA - SOLO LECTURA';
            document.body.prepend(banner);
        }

        // Configurar handler para cierre de ventana
        function setupBeforeUnloadHandler() {
            window.addEventListener('beforeunload', async (e) => {
                if (!state.readingRegistered) {
                    try {
                        await supabase
                            .from('sesiones_activas')
                            .update({ sesion_activa: false })
                            .eq('codigo_estudiante', state.studentCode)
                            .eq('grado', state.grade)
                            .eq('ciclo', CICLO_ACTUAL);
                    } catch (error) {
                        console.error('Error al cerrar sesión:', error);
                    }
                }
            });
        }

        // Iniciar lectura
        function startReading() {
            // Marcar que la lectura ha comenzado (para prevenir que se muestre el summary de nuevo)
            state.readingStarted = true;
            
            // Asegurar que el summary esté oculto y no se muestre de nuevo
            const summaryBox = document.getElementById('summaryBox');
            if (summaryBox) {
                summaryBox.classList.add('hidden');
                summaryBox.style.display = 'none'; // Forzar ocultamiento
                // Prevenir que se muestre de nuevo estableciendo un flag
                summaryBox.dataset.started = 'true';
            }
            
            // Mostrar sección de texto
            const textBox = document.getElementById('textBox');
            if (textBox) {
                textBox.classList.remove('hidden');
            }
            
            // Mostrar botón de terminar lectura
            const finishBtn = document.getElementById('finishReadingBtn');
            if (finishBtn) {
                finishBtn.classList.remove('hidden');
            }
            
            startTimer();
        }
        
        // Función para asegurar que el summary permanezca oculto
        function ensureSummaryHidden() {
            if (state.readingStarted || state.readingRegistered) {
                const summaryBox = document.getElementById('summaryBox');
                if (summaryBox && !summaryBox.classList.contains('hidden')) {
                    summaryBox.classList.add('hidden');
                    summaryBox.style.display = 'none';
                }
            }
        }
        
        // Verificar periódicamente que el summary no se muestre (solo si la lectura ha comenzado)
        setInterval(ensureSummaryHidden, 1000);

        // Iniciar lectura discontinua
        function startDiscontinuousReading() {
            document.getElementById('startDiscontinuaBtn').classList.add('hidden');
            document.getElementById('textBox').classList.remove('hidden');
            startTimer();
            
            // Esperar 5 segundos y mostrar preguntas de vocabulario
            setTimeout(() => {
                finishReading();
            }, 5000);
        }

        // Terminar lectura
        function finishReading() {
            stopTimer();
            document.getElementById('textBox').classList.add('hidden');
            document.getElementById('finishReadingBtn')?.classList.add('hidden');
            document.getElementById('vocabSection').classList.remove('hidden');
        }

        // Timer
        function startTimer() {
            state.startTime = Date.now();
            state.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('timer').textContent = 
                    \`\${String(minutes).padStart(2, '0')}:\${String(seconds).padStart(2, '0')}\`;
            }, 1000);
        }

        function stopTimer() {
            if (state.timerInterval) {
                clearInterval(state.timerInterval);
                state.timeElapsed = Math.floor((Date.now() - state.startTime) / 1000);
            }
        }

        // Seleccionar respuesta
        function selectAnswer(questionId, answerIndex, correctAnswer) {
            const options = document.querySelectorAll(\`[data-question="\${questionId}"]\`);
            options.forEach(opt => opt.classList.remove('selected'));
            event.target.classList.add('selected');

            if (questionId.startsWith('vocab')) {
                state.vocabAnswers[questionId] = answerIndex;
            } else {
                state.evalAnswers[questionId] = answerIndex;
            }
        }

        // Registrar respuestas de vocabulario
        function submitVocabularyAnswers() {
            const totalVocab = vocabQuestions.length;
            const answeredVocab = Object.keys(state.vocabAnswers).length;
            if (answeredVocab < totalVocab) {
                alert('Debes responder todas las ' + totalVocab + ' preguntas de vocabulario.');
                return;
            }
           
            vocabQuestions.forEach((q, index) => {
                const userAnswer = state.vocabAnswers['vocab-' + index];
                if (userAnswer === q.answer) {
                    state.vocabCorrect++;
                }
               
                const options = document.querySelectorAll('[data-question="vocab-' + index + '"]');
                options.forEach((opt, i) => {
                    if (i === q.answer) {
                        opt.classList.add('correct');
                    } else if (i === userAnswer) {
                        opt.classList.add('incorrect');
                    }
                });
            });
           
            // Ocultar vocabulario con botón
            document.getElementById('vocabSection').classList.add('hidden');
            // Mostrar texto
            document.getElementById('textBox').classList.remove('hidden');
            // Mostrar evaluación
            document.getElementById('evalSection').classList.remove('hidden');
        }
        
        // ===== FUNCIONES MEJORADAS DE GUARDADO =====
        
        // Función para guardar con reintentos automáticos
        async function guardarConReintentos(tabla, datos, maxReintentos = 3) {
            let ultimoError = null;
            
            for (let intento = 1; intento <= maxReintentos; intento++) {
                try {
                    console.log(\`Intento \${intento}/\${maxReintentos} de guardar en \${tabla}\`);
                    
                    const { data, error } = await supabase
                        .from(tabla)
                        .insert(datos)
                        .select();
                    
                    if (error) {
                        ultimoError = error;
                        console.error(\`Error en intento \${intento}:\`, error);
                        
                        // Si es el último intento, lanzar error
                        if (intento === maxReintentos) {
                            throw error;
                        }
                        
                        // Esperar antes de reintentar (backoff exponencial)
                        await new Promise(r => setTimeout(r, 1000 * intento));
                        continue;
                    }
                    
                    // Éxito
                    console.log(\`✅ Guardado exitoso en \${tabla} en intento \${intento}\`);
                    return { exito: true, data };
                    
                } catch (error) {
                    ultimoError = error;
                    
                    if (intento === maxReintentos) {
                        return { exito: false, error: error.message || 'Error desconocido', codigo: error.code };
                    }
                    
                    // Esperar antes de reintentar
                    await new Promise(r => setTimeout(r, 1000 * intento));
                }
            }
            
            return { exito: false, error: ultimoError?.message || 'Error después de todos los reintentos' };
        }
        
        // Función para guardar en localStorage como respaldo
        function guardarEnRespaldo(tipo, datos) {
            try {
                const clave = \`respaldo_\${tipo}_\${state.studentCode}_\${Date.now()}\`;
                const respaldo = {
                    tipo: tipo,
                    datos: datos,
                    estudiante: state.studentCode,
                    grado: state.grade,
                    ciclo: state.ciclo,
                    timestamp: new Date().toISOString(),
                    intentos: 0
                };
                
                localStorage.setItem(clave, JSON.stringify(respaldo));
                
                // Mantener solo los últimos 10 respaldos
                const respaldos = Object.keys(localStorage)
                    .filter(k => k.startsWith(\`respaldo_\${tipo}_\`))
                    .sort()
                    .reverse()
                    .slice(10);
                
                Object.keys(localStorage)
                    .filter(k => k.startsWith(\`respaldo_\${tipo}_\`) && !respaldos.includes(k))
                    .forEach(k => localStorage.removeItem(k));
                
                console.log('✅ Datos guardados en respaldo local:', clave);
                return true;
            } catch (e) {
                console.error('Error guardando en respaldo:', e);
                return false;
            }
        }
        
        // Función para mostrar mensajes de éxito
        function mostrarMensajeExito(titulo, mensaje) {
            const modal = document.createElement('div');
            modal.id = 'successModal';
            modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            \`;
            
            modal.innerHTML = \`
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 500px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 4px solid #27ae60;
                ">
                    <h2 style="
                        color: #27ae60;
                        font-size: 24px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">\${titulo}</h2>
                    <div style="
                        background: #d4edda;
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 4px solid #28a745;
                        margin-bottom: 20px;
                        white-space: pre-line;
                        line-height: 1.6;
                        font-size: 14px;
                        color: #155724;
                    ">\${mensaje}</div>
                    <div style="text-align: center;">
                        <button onclick="document.getElementById('successModal').remove()" style="
                            background: #27ae60;
                            color: white;
                            padding: 12px 30px;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Continuar</button>
                    </div>
                </div>
            \`;
            
            document.body.appendChild(modal);
            
            // Cerrar automáticamente después de 5 segundos
            setTimeout(() => {
                const m = document.getElementById('successModal');
                if (m) m.remove();
            }, 5000);
        }
        
        // Función para mostrar errores críticos de forma visible
        function mostrarErrorCritico(titulo, mensaje) {
            // Crear modal de error visible
            const modal = document.createElement('div');
            modal.id = 'errorModal';
            modal.style.cssText = \`
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            \`;
            
            modal.innerHTML = \`
                <div style="
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 600px;
                    width: 100%;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    border: 4px solid #e74c3c;
                ">
                    <h2 style="
                        color: #e74c3c;
                        font-size: 24px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">\${titulo}</h2>
                    <div style="
                        background: #fff3cd;
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 4px solid #ffc107;
                        margin-bottom: 20px;
                        white-space: pre-line;
                        line-height: 1.6;
                        font-size: 14px;
                        color: #856404;
                    ">\${mensaje}</div>
                    <div style="text-align: center;">
                        <button onclick="document.getElementById('errorModal').remove()" style="
                            background: #e74c3c;
                            color: white;
                            padding: 12px 30px;
                            border: none;
                            border-radius: 8px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                        ">Entendido</button>
                    </div>
                </div>
            \`;
            
            document.body.appendChild(modal);
            
            // También mostrar alert tradicional (pero el modal es más visible)
            alert(\`\${titulo}\\n\\n\${mensaje}\`);
        }
        
        // ===== FIN FUNCIONES MEJORADAS =====
            
        // Enviar resultados de lectura
        async function submitReadingResults() {
            if (state.readingRegistered) {
                alert('Los resultados ya fueron registrados.');
                return;
            }
            const submitBtn = document.getElementById('submitReadingBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';
            // Validar respuestas completas
            const totalEval = evalQuestions.length;
            const answeredEval = Object.keys(state.evalAnswers).length;
            if (answeredEval < totalEval) {
                alert('Debes responder todas las ' + totalEval + ' preguntas de evaluacion antes de registrar.');
                return;
            }
            
            // Calcular resultados evaluación (feedback se mostrará después de registrar)
            evalQuestions.forEach((q, index) => {
                const userAnswer = state.evalAnswers[\`eval-\${index}\`];
                if (userAnswer === q.answer) {
                    state.evalCorrect++;
                }
                
                // Marcar opciones correctas e incorrectas
                const options = document.querySelectorAll(\`[data-question="eval-\${index}"]\`);
                options.forEach((opt, i) => {
                    if (i === q.answer) {
                        opt.classList.add('correct');
                    } else if (i === userAnswer) {
                        opt.classList.add('incorrect');
                    }
                });
            });

            // Calcular métricas
            const wordCount = readingData.word_count_text;
            const timeMinutes = state.timeElapsed / 60;
            const velocidadSimple = Math.round(wordCount / timeMinutes);
            const comprensionPercentage = Math.round((state.evalCorrect / evalQuestions.length) * 100);
            const velocidadEfectiva = Math.round(velocidadSimple * (comprensionPercentage / 100));
            const vocabPercentage = Math.round((state.vocabCorrect / vocabQuestions.length) * 100);

            // Mostrar resultados
            showResults(vocabPercentage, wordCount, timeMinutes, velocidadSimple, comprensionPercentage, velocidadEfectiva);

            // Validar datos antes de guardar
            const datosLectura = {
                codigo_estudiante: state.studentCode,
                grado: state.grade,
                ciclo: state.ciclo,
                titulo_lectura: readingData.title,
                autor: readingData.author,
                word_count: wordCount,
                tiempo_minutos: timeMinutes.toFixed(2),
                velocidad_simple: velocidadSimple,
                comprension: comprensionPercentage,
                velocidad_efectiva: velocidadEfectiva,
                preguntas_correctas: state.evalCorrect,
                preguntas_totales: evalQuestions.length,
                preguntas_vocabulario_correctas: state.vocabCorrect,
                preguntas_vocabulario_totales: vocabQuestions.length,
                tipo_lectura: state.readingType,
                habilitado: false
            };
            
            // Validar campos requeridos
            const camposRequeridos = ['codigo_estudiante', 'grado', 'ciclo', 'titulo_lectura'];
            const faltantes = camposRequeridos.filter(campo => !datosLectura[campo]);
            if (faltantes.length > 0) {
                mostrarErrorCritico('Error de validación', \`Faltan campos requeridos: \${faltantes.join(', ')}. Por favor contacta al monitor.\`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrar Evaluación';
                return;
            }
            
            console.log('Intentando guardar lectura:', {
                codigo: datosLectura.codigo_estudiante,
                grado: datosLectura.grado,
                ciclo: datosLectura.ciclo,
                titulo: datosLectura.titulo_lectura
            });
            
            // Guardar en Supabase con reintentos
            try {
                const resultado = await guardarConReintentos('steam_lectura', datosLectura, 3);
                
                if (!resultado.exito) {
                    // Si falla, guardar en localStorage como respaldo
                    guardarEnRespaldo('lectura', datosLectura);
                    throw new Error(resultado.error || 'Error desconocido al guardar');
                }
                
                // IMPORTANTE: Primero marcar como registrado y detener verificaciones
                // para evitar que checkActivityStatus o sessionCheckInterval interfieran
                state.readingRegistered = true;
                
                // Detener la verificación periódica de sesión ANTES de marcar sesión como inactiva
                if (state.sessionCheckInterval) {
                    clearInterval(state.sessionCheckInterval);
                    state.sessionCheckInterval = null;
                }
                
                // Ahora marcar sesión como inactiva (pero ya no hay verificación activa que cause problemas)
                await supabase
                    .from('sesiones_activas')
                    .update({ sesion_activa: false })
                    .eq('codigo_estudiante', state.studentCode)
                    .eq('grado', state.grade)
                    .eq('ciclo', CICLO_ACTUAL);

                submitBtn.textContent = '✅ Resultados Registrados';
                submitBtn.style.background = '#27ae60';
                
                // Mostrar mensaje de éxito visible
                mostrarMensajeExito('✅ Resultados Guardados Exitosamente', 
                    \`Tus resultados de lectura han sido guardados correctamente.\\n\\n\` +
                    \`Velocidad Simple: \${velocidadSimple} p/m\\n\` +
                    \`Comprensión: \${comprensionPercentage}%\\n\` +
                    \`Velocidad Efectiva: \${velocidadEfectiva} p/m\`
                );
               
                // Asegurar que el summary esté oculto y las secciones correctas estén visibles
                document.getElementById('summaryBox')?.classList.add('hidden');
                document.getElementById('vocabSection').classList.add('hidden');
                // Mantener texto visible
                document.getElementById('textBox').classList.remove('hidden');
                // Mantener evaluación visible con correcciones
                document.getElementById('evalSection').classList.remove('hidden');
                // IMPORTANTE: Mostrar feedback para todas las preguntas después de registrar
                evalQuestions.forEach((q, index) => {
                    const feedbackBox = document.getElementById(\`feedback-eval-\${index}\`);
                    if (feedbackBox && q.justification) {
                        feedbackBox.classList.add('visible');
                        feedbackBox.style.display = 'block';
                        feedbackBox.style.visibility = 'visible';
                        feedbackBox.style.opacity = '1';
                    }
                });
                // Mostrar resultados
                document.getElementById('resultsSection').classList.remove('hidden');
                // Hacer scroll a la sección de evaluación primero para mostrar el feedback
                document.getElementById('evalSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Después de un breve delay, hacer scroll a los resultados
                setTimeout(() => {
                    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 500);
            } catch (error) {
                console.error('Error guardando resultados:', error);
                
                // Mostrar error detallado y visible
                const mensajeError = error.message || 'Error desconocido';
                const codigoError = error.code || 'N/A';
                
                mostrarErrorCritico(
                    '❌ Error al Guardar Resultados',
                    \`No se pudieron guardar los resultados en la base de datos.\\n\\n\` +
                    \`Error: \${mensajeError}\\n\` +
                    \`Código: \${codigoError}\\n\\n\` +
                    \`⚠️ IMPORTANTE: Los datos se han guardado localmente como respaldo.\\n\` +
                    \`Por favor contacta al monitor inmediatamente y proporciona:\\n\` +
                    \`- Tu código: \${state.studentCode}\\n\` +
                    \`- Grado: \${state.grade}\\n\` +
                    \`- Ciclo: \${state.ciclo}\\n\\n\` +
                    \`NO CIERRES ESTA PÁGINA hasta que el monitor confirme que los datos fueron recuperados.\`
                );
                
                submitBtn.disabled = false;
                submitBtn.textContent = '⚠️ Error - Reintentar';
                submitBtn.style.background = '#e74c3c';
                
                // Intentar guardar en respaldo automáticamente
                guardarEnRespaldo('lectura', datosLectura);
            }
        }

        // Mostrar resultados
        function showResults(vocabPct, wordCount, time, velSimple, comprension, velEfectiva) {
            const gradeLabel = getGradeLabel(velEfectiva);
            const vocabColor = getPercentageColor(vocabPct);
            const comprColor = getPercentageColor(comprension);

            document.getElementById('resultsGrid').innerHTML = \`
                <div class="result-card">
                    <div class="result-label">Vocabulario</div>
                    <div class="result-value">\${state.vocabCorrect}/\${vocabQuestions.length}</div>
                    <div class="result-percentage \${vocabColor}">\${vocabPct}%</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Palabras</div>
                    <div class="result-value">\${wordCount}</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Tiempo</div>
                    <div class="result-value">\${time.toFixed(2)} min</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Velocidad Simple</div>
                    <div class="result-value">\${velSimple} p/m</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Comprensión</div>
                    <div class="result-value">\${state.evalCorrect}/\${evalQuestions.length}</div>
                    <div class="result-percentage \${comprColor}">\${comprension}%</div>
                </div>
                <div class="result-card" style="border: 5px solid #FF6B35;">
                    <div class="result-label">🏆 Velocidad Efectiva</div>
                    <div class="result-value" style="color: #FF6B35;">\${velEfectiva}</div>
                    <div class="grade-label">\${gradeLabel}</div>
                </div>
            \`;
        }

        function getPercentageColor(pct) {
            if (pct === 100) return 'percentage-blue';
            if (pct >= 75) return 'percentage-green';
            if (pct >= 51) return 'percentage-orange';
            return 'percentage-red';
        }

        function getGradeLabel(vel) {
            if (vel >= 300) return 'Profesional';
            if (vel >= 280) return 'Grado 11°';
            if (vel >= 260) return 'Grado 10°';
            if (vel >= 240) return 'Grado 9°';
            if (vel >= 220) return 'Grado 8°';
            if (vel >= 200) return 'Grado 7°';
            if (vel >= 180) return 'Grado 6°';
            if (vel >= 160) return 'Grado 5°';
            if (vel >= 140) return 'Grado 4°';
            if (vel >= 126) return 'Grado 3°';
            if (vel >= 101) return 'Grado 2°';
            return 'Grado 1°';
        }

        // Desafío Mental
        function startDesafio() {
            document.getElementById('resultsSection').classList.add('hidden');
            document.getElementById('desafioSection').classList.remove('hidden');
        }

        function zoomImage(action) {
            const img = document.getElementById('desafioImage');
            if (action === 'in') state.zoomLevel += 0.2;
            else if (action === 'out') state.zoomLevel = Math.max(0.5, state.zoomLevel - 0.2);
            else state.zoomLevel = 1;
            img.style.transform = \`scale(\${state.zoomLevel})\`;
        }

        function gradeDesafio(percentage) {
            state.currentDesafioGrade = percentage;
            document.getElementById('desafioPercentage').textContent = \`\${percentage}%\`;
            document.getElementById('desafioModal').classList.add('active');
        }

        async function confirmDesafio() {
            closeModal('desafioModal');
            
            const pct = state.currentDesafioGrade;
            const color = getPercentageColor(pct);
            const message = getDesafioMessage(pct);

            const datosDesafio = {
                codigo_estudiante: state.studentCode,
                grado: state.grade,
                ciclo: state.ciclo,
                desafio: 'Desafío Mental Grado ' + state.grade,
                porcentaje: pct,
                habilitado: false
            };
            
            console.log('Intentando guardar desafío:', {
                codigo: datosDesafio.codigo_estudiante,
                grado: datosDesafio.grado,
                ciclo: datosDesafio.ciclo,
                porcentaje: datosDesafio.porcentaje
            });

            try {
                const resultado = await guardarConReintentos('steam_desafios', datosDesafio, 3);
                
                if (!resultado.exito) {
                    guardarEnRespaldo('desafio', datosDesafio);
                    throw new Error(resultado.error || 'Error desconocido al guardar');
                }

                document.getElementById('desafioResult').innerHTML = \`
                    <div class="result-label">Calificación Desafío</div>
                    <div class="result-percentage \${color}">\${pct}%</div>
                    <div style="margin-top: 10px; font-weight: 600; color: #333;">\${message}</div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 10px 20px;" onclick="verRanking()">🏆 Ver Ranking</button>
                    </div>
                \`;
                document.getElementById('desafioResult').classList.remove('hidden');
                document.getElementById('continueToAppsBtn').classList.remove('hidden');
            } catch (error) {
                console.error('Error guardando desafío:', error);
                
                mostrarErrorCritico(
                    '❌ Error al Guardar Desafío Mental',
                    \`No se pudo guardar el resultado del desafío mental.\\n\\n\` +
                    \`Error: \${error.message || 'Error desconocido'}\\n\\n\` +
                    \`⚠️ IMPORTANTE: Los datos se han guardado localmente como respaldo.\\n\` +
                    \`Por favor contacta al monitor y proporciona:\\n\` +
                    \`- Tu código: \${state.studentCode}\\n\` +
                    \`- Grado: \${state.grade}\\n\` +
                    \`- Ciclo: \${state.ciclo}\\n\` +
                    \`- Porcentaje: \${pct}%\\n\\n\` +
                    \`NO CIERRES ESTA PÁGINA hasta que el monitor confirme que los datos fueron recuperados.\`
                );
            }
        }

        function getDesafioMessage(pct) {
            if (pct >= 96) return 'Eres crack';
            if (pct >= 81) return 'Genial excelentes soluciones';
            if (pct >= 71) return 'Excelente nivel de creatividad';
            if (pct >= 51) return 'Vamos consolidando nuestra creatividad';
            return 'Vamos a mejorar ánimo';
        }

        // Aplicaciones
        function startApplications() {
            document.getElementById('desafioSection').classList.add('hidden');
            document.getElementById('appSection').classList.remove('hidden');
        }

        function openApp(url, index) {
            state.currentAppIndex = index;
            window.open(url, '_blank');
            
            setTimeout(() => {
                document.getElementById('appModalName').textContent = apps[index].nombre;
                document.getElementById('appScoreInput').value = '';
                document.getElementById('appModal').classList.add('active');
            }, 1000);
        }

        async function confirmAppScore() {
            const score = parseInt(document.getElementById('appScoreInput').value);
            if (isNaN(score) || score < 0) {
                alert('Por favor ingresa un resultado válido');
                return;
            }

            closeModal('appModal');
            
            const index = state.currentAppIndex;
            const app = apps[index];
            const percentage = Math.round((score / app.meta) * 100);
            const estado = getHabilidadEstado(percentage);
            const color = getPercentageColor(percentage);

            try {
                const { error } = await supabase
                    .from('aplicaciones')
                    .insert({
                        codigo_estudiante: state.studentCode,
                        grado: state.grade,
                        ciclo: state.ciclo,
                        aplicacion: app.nombre,
                        habilidad: app.habilidad,
                        resultado: score,
                        meta: app.meta,
                        efectividad: percentage,
                        habilitado: false
                    });

                if (error) throw error;

                document.getElementById(\`appResult\${index}\`).innerHTML = \`
                    <div class="result-label">\${app.habilidad}</div>
                    <div class="result-value">\${score}/\${app.meta}</div>
                    <div class="result-percentage \${color}">\${percentage}%</div>
                    <div style="margin-top: 10px; font-weight: 600; color: #333;">\${estado}</div>
                    <div style="text-align: center; margin-top: 15px;">
                        <button class="btn" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 8px 16px; font-size: 0.9em;" onclick="verRanking()">🏆 Ver Ranking</button>
                    </div>
                \`;
                document.getElementById(\`appResult\${index}\`).classList.remove('hidden');
                // Bloquear botón de esta aplicación
                const appButtons = document.querySelectorAll('.app-card button');
                if (appButtons[index]) {
                    appButtons[index].disabled = true;
                    appButtons[index].textContent = '✅ Registrado';
                    appButtons[index].style.opacity = '0.6';
                    appButtons[index].style.cursor = 'not-allowed';
                }
                state.completedApps++;
                if (state.completedApps === 3) {
                    document.getElementById('closeSessionBtn').classList.remove('hidden');
                }
            } catch (error) {
                console.error('Error guardando aplicación:', error);
                alert('Error al guardar el puntaje. Contacta al monitor.');
            }
        }

        function getHabilidadEstado(pct) {
            if (pct >= 91) return '💪 Fortaleza Cognitiva';
            if (pct >= 81) return '✅ Habilidad Consolidada';
            if (pct >= 51) return '📈 Proceso de Consolidación';
            return '🌱 Habilidad en Estado Inicial';
        }

        // Cerrar sesión - mostrar resumen
        function closeSession() {
            // Construir resumen de lectura
            const readingSummary = \`
                <div class="summary-item">
                    <div class="summary-item-label">Palabras</div>
                    <div class="summary-item-value">\${readingData.word_count_text || 'N/A'}</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Tiempo</div>
                    <div class="summary-item-value">\${(state.timeElapsed / 60).toFixed(1)} min</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Velocidad Simple</div>
                    <div class="summary-item-value">\${Math.round((readingData.word_count_text || 0) / (state.timeElapsed / 60))} p/m</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Vocabulario</div>
                    <div class="summary-item-value">\${Math.round((state.vocabCorrect / vocabQuestions.length) * 100)}%</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Comprensión</div>
                    <div class="summary-item-value">\${Math.round((state.evalCorrect / evalQuestions.length) * 100)}%</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Velocidad Efectiva</div>
                    <div class="summary-item-value">\${Math.round((readingData.word_count_text || 0) / (state.timeElapsed / 60) * (state.evalCorrect / evalQuestions.length))}</div>
                </div>
            \`;
            // Resumen de desafío
            const desafioSummary = state.currentDesafioGrade ? \`
                <div class="summary-item">
                    <div class="summary-item-label">Calificación</div>
                    <div class="summary-item-value">\${state.currentDesafioGrade}%</div>
                </div>
                <div class="summary-item">
                    <div class="summary-item-label">Estado</div>
                    <div class="summary-item-value" style="font-size: 1.2em;">\${getDesafioMessage(state.currentDesafioGrade)}</div>
                </div>
            \` : '<div class="summary-item"><div class="summary-item-label">No completado</div></div>';
            // Resumen de aplicaciones
            let appsSummary = '';
            apps.forEach((app, index) => {
                const resultDiv = document.getElementById(\`appResult\${index}\`);
                if (!resultDiv.classList.contains('hidden')) {
                    const scoreText = resultDiv.querySelector('.result-value')?.textContent || 'N/A';
                    const percentage = resultDiv.querySelector('.result-percentage')?.textContent || 'N/A';
                    appsSummary += \`
                        <div class="summary-item">
                            <div class="summary-item-label">\${app.habilidad}</div>
                            <div class="summary-item-value" style="font-size: 1.3em;">\${scoreText}</div>
                            <div style="margin-top: 5px; font-weight: 600; color: #666;">\${percentage}</div>
                        </div>
                    \`;
                }
            });
            if (!appsSummary) {
                appsSummary = '<div class="summary-item"><div class="summary-item-label">No completadas</div></div>';
            }
            // Insertar resúmenes
            document.getElementById('summaryReading').innerHTML = readingSummary;
            document.getElementById('summaryDesafio').innerHTML = desafioSummary;
            document.getElementById('summaryApps').innerHTML = appsSummary;
            // Mostrar modal
            document.getElementById('finalSummaryModal').classList.add('active');
        }

        // Confirmar cierre de sesión
        async function confirmCloseSession() {
            // Cerrar sesión activa
            try {
                await supabase
                    .from('sesiones_activas')
                    .update({ sesion_activa: false })
                    .eq('codigo_estudiante', state.studentCode)
                    .eq('grado', state.grade)
                    .eq('ciclo', CICLO_ACTUAL);
            } catch (error) {
                console.error('Error cerrando sesión:', error);
            }
           
            // Si estamos en vista previa (blob URL), cerrar ventana
            if (window.location.href.startsWith('blob:')) {
                alert('✅ Sesión completada. Cerrando vista previa...');
                window.close();
                return;
            }
           
            // Si estamos en producción, redirigir al index
            localStorage.removeItem('sessionActive');
            try {
                window.location.href = '../index.html';
            } catch (e) {
                try {
                    window.location.href = '/index.html';
                } catch (e2) {
                    alert('✅ Sesión completada.');
                    window.close();
                }
            }
        }

        // Modales
        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }

        // Ver ranking en tiempo real
        function verRanking() {
            // Abrir ranking en nueva pestaña con filtros del estudiante actual
            const rankingUrl = \`../ranking.html?grado=\${state.grade}&ciclo=\${state.ciclo}\`;
            window.open(rankingUrl, '_blank');
        }

        // Control de tamaño de fuente
        function changeFontSize(delta) {
            state.fontSize += delta;
            state.fontSize = Math.max(12, Math.min(30, state.fontSize));
            document.getElementById('textContent').style.fontSize = state.fontSize + 'px';
        }
    </script>
</body>
</html>`;
}

// Resaltar keywords y procesar saltos de línea
function highlightKeywords(text, keywords) {
    if (!text || !keywords || keywords.length === 0) {
        // Si no hay keywords, solo procesar párrafos
        return processParagraphs(text);
    }
   
    // Set para rastrear qué keywords ya fueron marcadas (case-insensitive)
    const markedKeywords = new Set();
    
    // Ordenar keywords por longitud (más largas primero) para evitar conflictos
    // Ejemplo: "medio ambiente" debe marcarse antes que "medio"
    const sortedKeywords = [...keywords]
        .map(kw => ({
            original: (kw.word || '').trim(),
            meaning: kw.meaning || '',
            normalized: normalizeText((kw.word || '').trim())
        }))
        .filter(kw => kw.original && kw.normalized) // Filtrar keywords vacías o inválidas
        .sort((a, b) => {
            // Ordenar por longitud descendente
            if (b.original.length !== a.original.length) {
                return b.original.length - a.original.length;
            }
            return 0;
        });
    
    // Procesar TODO el texto de una vez (antes de dividir en párrafos)
    // Esto asegura que marcamos solo la primera ocurrencia en todo el texto
    // Primero normalizar saltos de línea: convertir dobles saltos en marcador temporal
    const PARAGRAPH_MARKER = '\x00PARAGRAPH\x00'; // Usar carácter nulo como marcador (no aparece en texto normal)
    let processedText = text;
    
    // Reemplazar saltos de línea dobles con marcador temporal
    processedText = processedText.replace(/\n\n+/g, PARAGRAPH_MARKER);
    // Reemplazar saltos de línea simples con espacios
    processedText = processedText.replace(/\n/g, ' ');
    // Limpiar espacios múltiples (pero no tocar el marcador)
    processedText = processedText.replace(/[ \t]+/g, ' ').trim();
    
    // Función auxiliar para buscar keyword en el texto usando comparación normalizada
    // Versión mejorada que busca de forma más flexible
    function findKeywordInText(text, normalizedKeyword, keywordLength) {
        // Normalizar el texto completo para búsqueda rápida
        const normalizedText = normalizeText(text);
        const normalizedKeywordLower = normalizedKeyword.toLowerCase();
        
        // Buscar TODAS las ocurrencias posibles y luego validar
        let searchIndex = normalizedText.indexOf(normalizedKeywordLower);
        const candidates = [];
        
        // Primero, recopilar todas las ocurrencias candidatas
        while (searchIndex !== -1) {
            // Verificar que no esté dentro de un tag HTML
            if (!isInsideHTMLTag(text, searchIndex)) {
                candidates.push(searchIndex);
            }
            searchIndex = normalizedText.indexOf(normalizedKeywordLower, searchIndex + 1);
        }
        
        // Ahora validar cada candidato para encontrar el mejor match
        for (const candidateIndex of candidates) {
            // Intentar encontrar el match exacto alrededor de este índice
            const match = findExactMatch(text, candidateIndex, normalizedKeywordLower, keywordLength);
            if (match) {
                return match;
            }
        }
        
        // No se encontró ninguna ocurrencia válida
        return null;
    }
    
    // Función auxiliar para encontrar el match exacto en el texto original
    function findExactMatch(text, startIndex, normalizedKeyword, expectedLength) {
        // Buscar en un rango alrededor del índice encontrado
        const searchRange = 10; // Buscar hasta 10 caracteres de diferencia
        const normalizedText = normalizeText(text);
        
        for (let offset = -searchRange; offset <= searchRange; offset++) {
            const testIndex = startIndex + offset;
            if (testIndex < 0) continue;
            
            // Probar diferentes longitudes alrededor del índice esperado
            const minLen = Math.max(1, expectedLength - 3);
            const maxLen = expectedLength + 3;
            
            for (let len = minLen; len <= maxLen && testIndex + len <= text.length; len++) {
                const testSlice = text.substring(testIndex, testIndex + len);
                const testNormalized = normalizeText(testSlice).toLowerCase();
                
                if (testNormalized === normalizedKeyword) {
                    // Verificar límites de palabra
                    const charBefore = testIndex > 0 ? text[testIndex - 1] : ' ';
                    const charAfter = testIndex + len < text.length ? text[testIndex + len] : ' ';
                    
                    const wordCharRegex = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/;
                    const isWordChar = (char) => wordCharRegex.test(char);
                    const hasValidBoundaries = !isWordChar(charBefore) && !isWordChar(charAfter);
                    
                    if (hasValidBoundaries) {
                        return {
                            index: testIndex,
                            matchedWord: testSlice
                        };
                    }
                }
            }
        }
        
        return null;
    }
    
    // Función para buscar variaciones de keywords (formas verbales, diminutivos, etc.)
    function findKeywordVariations(text, originalKeyword, normalizedKeyword) {
        const normalizedText = normalizeText(text);
        const keywordLower = normalizedKeyword.toLowerCase();
        
        // Caso especial: frases compuestas como "trabajo en equipo"
        if (keywordLower.includes('trabajo') && keywordLower.includes('equipo')) {
            // Buscar la frase completa primero
            const fullPhrase = 'trabajo en equipo';
            const fullPhraseNormalized = normalizeText(fullPhrase).toLowerCase();
            let searchIndex = normalizedText.indexOf(fullPhraseNormalized);
            
            if (searchIndex !== -1) {
                const match = findExactMatch(text, searchIndex, fullPhraseNormalized, fullPhrase.length);
                if (match) {
                    return match;
                }
            }
            
            // Si no se encuentra la frase completa, buscar "trabajo" o "equipo" por separado
            // pero solo si la frase no aparece
            const trabajoMatch = findKeywordInText(text, normalizeText('trabajo'), 'trabajo'.length);
            if (trabajoMatch) {
                return trabajoMatch;
            }
        }
        
        // Generar posibles variaciones basadas en la raíz de la palabra
        const variations = generateKeywordVariations(originalKeyword, normalizedKeyword);
        
        // Buscar cada variación en el texto
        for (const variation of variations) {
            const variationNormalized = normalizeText(variation).toLowerCase();
            const searchIndex = normalizedText.indexOf(variationNormalized);
            
            if (searchIndex !== -1) {
                // Encontrar el match exacto
                const match = findExactMatch(text, searchIndex, variationNormalized, variation.length);
                if (match) {
                    return match;
                }
            }
        }
        
        return null;
    }
    
    // Generar variaciones comunes de palabras en español
    function generateKeywordVariations(originalKeyword, normalizedKeyword) {
        const variations = [];
        const keywordLower = originalKeyword.toLowerCase();
        
        // Agregar la palabra original
        variations.push(originalKeyword);
        
        // Si es un verbo, agregar formas comunes
        // Verbos terminados en -ar
        if (keywordLower.endsWith('ar') && keywordLower.length > 3) {
            const root = keywordLower.slice(0, -2);
            variations.push(root + 'ó');      // tercera persona singular pretérito
            variations.push(root + 'aron');    // tercera persona plural pretérito
            variations.push(root + 'aron');    // tercera persona plural pretérito
            variations.push(root + 'a');       // tercera persona singular presente
            variations.push(root + 'an');      // tercera persona plural presente
        }
        
        // Verbos terminados en -er
        if (keywordLower.endsWith('er') && keywordLower.length > 3) {
            const root = keywordLower.slice(0, -2);
            variations.push(root + 'ió');
            variations.push(root + 'ieron');
        }
        
        // Verbos terminados en -ir
        if (keywordLower.endsWith('ir') && keywordLower.length > 3) {
            const root = keywordLower.slice(0, -2);
            variations.push(root + 'ió');
            variations.push(root + 'ieron');
        }
        
        // Si es un sustantivo, agregar diminutivos comunes
        if (!keywordLower.endsWith('ar') && !keywordLower.endsWith('er') && !keywordLower.endsWith('ir')) {
            // Diminutivos comunes
            if (keywordLower.endsWith('ón')) {
                variations.push(keywordLower.slice(0, -2) + 'oncito');
                variations.push(keywordLower.slice(0, -2) + 'oncita');
            } else if (keywordLower.endsWith('o')) {
                variations.push(keywordLower.slice(0, -1) + 'ito');
            } else if (keywordLower.endsWith('a')) {
                variations.push(keywordLower.slice(0, -1) + 'ita');
            } else {
                variations.push(keywordLower + 'ito');
                variations.push(keywordLower + 'ita');
            }
        }
        
        // Para frases compuestas, buscar cada palabra por separado
        if (originalKeyword.includes(' ')) {
            const words = originalKeyword.split(' ');
            // Buscar la primera palabra de la frase
            if (words.length > 0) {
                variations.push(...generateKeywordVariations(words[0], normalizeText(words[0])));
            }
        }
        
        // Casos especiales conocidos
        if (keywordLower === 'cosechar') {
            variations.push('cosecharon', 'cosechó', 'cosecha', 'cosechan');
        }
        if (keywordLower === 'halar') {
            variations.push('haló', 'halaron', 'hala', 'halan');
        }
        if (keywordLower === 'ratón') {
            variations.push('ratoncito', 'ratoncita', 'ratones');
        }
        if (keywordLower.includes('trabajo') && keywordLower.includes('equipo')) {
            // Para "trabajo en equipo", buscar la frase completa y variaciones
            variations.push('trabajo en equipo', 'trabajo', 'equipo');
            // También buscar si aparece en el texto de otra forma
        }
        
        // Eliminar duplicados y mantener solo variaciones válidas
        return [...new Set(variations)].filter(v => v && v.length > 0);
    }
    
    // Marcar solo la primera ocurrencia de cada keyword en TODO el texto
    // IMPORTANTE: Procesar todas las keywords, no solo las que se encuentran
    let processedCount = 0;
    sortedKeywords.forEach((kw, index) => {
        const keywordWord = kw.original;
        const normalizedKeyword = kw.normalized;
        
        // Verificar si ya se marcó esta keyword (case-insensitive)
        const keywordKey = normalizedKeyword.toLowerCase();
        if (markedKeywords.has(keywordKey)) {
            console.warn(`Keyword duplicada ignorada: "${keywordWord}"`);
            return; // Ya se marcó esta keyword
        }
        
        // Buscar la primera ocurrencia válida de la keyword en el texto
        // Primero intentar con la palabra exacta
        let match = findKeywordInText(processedText, normalizedKeyword, keywordWord.length);
        
        // Si no se encuentra, intentar buscar variaciones (formas verbales, diminutivos, etc.)
        if (!match) {
            match = findKeywordVariations(processedText, keywordWord, normalizedKeyword);
        }
        
        if (!match) {
            // Keyword no encontrada en el texto
            console.warn(`Keyword no encontrada en el texto: "${keywordWord}" (significado: "${kw.meaning}")`);
            return;
        }
        
        // Reemplazar la primera ocurrencia con el HTML marcado
        const beforeMatch = processedText.substring(0, match.index);
        const afterMatch = processedText.substring(match.index + match.matchedWord.length);
        
        processedText = beforeMatch + 
            `<span class="keyword">${match.matchedWord}<span class="keyword-tooltip">${kw.meaning}</span></span>` + 
            afterMatch;
        
        // Marcar esta keyword como procesada
        markedKeywords.add(keywordKey);
        processedCount++;
        console.log(`✅ Keyword marcada ${processedCount}/${sortedKeywords.length}: "${keywordWord}" → encontrada como "${match.matchedWord}"`);
    });
    
    // Log final para debugging
    console.log(`📊 Total keywords procesadas: ${processedCount} de ${sortedKeywords.length}`);
    if (processedCount < sortedKeywords.length) {
        console.warn(`⚠️ Algunas keywords no se encontraron en el texto. Verifica que las palabras estén escritas exactamente como aparecen en el texto.`);
    }
    
    // Ahora dividir el texto procesado en párrafos usando el marcador
    const paragraphs = processedText.split(PARAGRAPH_MARKER).filter(p => p.trim().length > 0);
    
    // Procesar párrafos: limpiar espacios y envolver en <p>
    return paragraphs.map(p => {
        let cleanParagraph = p.trim();
        // Limpiar espacios múltiples (pero mantener espacios dentro de tags HTML)
        cleanParagraph = cleanParagraph.replace(/\s+/g, ' ').trim();
        return `<p>${cleanParagraph}</p>`;
    }).join('');
}

// Función auxiliar para procesar párrafos cuando no hay keywords
function processParagraphs(text) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, ' ')}</p>`).join('');
}

// Función auxiliar para escapar caracteres especiales en regex
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Función auxiliar para normalizar texto (eliminar acentos, convertir a minúsculas)
// SOLO para comparación, NO modifica la longitud del texto
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Eliminar diacríticos pero mantener todos los demás caracteres
}

// Función auxiliar para verificar si una posición está dentro de un tag HTML
function isInsideHTMLTag(text, position) {
    if (position < 0 || position >= text.length) {
        return false;
    }
    
    // Buscar hacia atrás desde la posición para encontrar el último < o >
    let lastOpenTag = -1;
    let lastCloseTag = -1;
    
    for (let i = position - 1; i >= 0; i--) {
        if (text[i] === '>') {
            lastCloseTag = i;
            break;
        }
        if (text[i] === '<') {
            lastOpenTag = i;
            break;
        }
    }
    
    // Si encontramos un > antes que un <, no estamos dentro de un tag
    if (lastCloseTag > lastOpenTag) {
        return false;
    }
    
    // Si encontramos un <, verificar si hay un > después
    if (lastOpenTag !== -1) {
        // Buscar el siguiente > después del <
        for (let i = lastOpenTag + 1; i < text.length; i++) {
            if (text[i] === '>') {
                // Si la posición está entre < y >, estamos dentro de un tag
                return position > lastOpenTag && position < i;
            }
        }
        // Si no hay > después del <, podría ser un tag incompleto
        // Pero para seguridad, asumir que estamos dentro de un tag
        return position > lastOpenTag;
    }
    
    // No hay < antes, no estamos dentro de un tag
    return false;
}

// Limpiar todos los campos del dashboard
function clearAllFields() {
    if (!confirm('¿Estás seguro de que deseas limpiar todos los campos?')) {
        return;
    }
    
    // Limpiar selección de grado
    document.querySelectorAll('.grade-btn').forEach(btn => btn.classList.remove('active'));
    state.grade = null;
    
    // Reset ciclo
    document.getElementById('cicloNumber').value = 1;
    state.ciclo = 1;
    
    // Reset tipo de lectura
    document.querySelector('input[name="readingType"][value="continua"]').checked = true;
    state.readingType = 'continua';
    
    // Limpiar archivos
    document.getElementById('jsonFile').value = '';
    document.getElementById('imageFile').value = '';
    document.getElementById('desafioFile').value = '';
    
    state.jsonData = null;
    state.imageData = null;
    state.desafioImageData = null;
    state.jsonFileName = null;
    state.imageFileName = null;
    state.desafioFileName = null;
    
    // Remover clases has-file
    document.getElementById('jsonUpload').classList.remove('has-file');
    document.getElementById('imageUpload').classList.remove('has-file');
    document.getElementById('desafioUpload').classList.remove('has-file');
    
    // Restaurar textos
    document.querySelector('#jsonUpload .file-upload-text strong').textContent = 'Click para seleccionar archivo JSON';
    document.querySelector('#imageUpload .file-upload-text strong').textContent = 'Click para seleccionar imagen';
    document.querySelector('#desafioUpload .file-upload-text strong').textContent = 'Click para seleccionar imagen del desafío';
    
    // Limpiar aplicaciones
    for (let i = 1; i <= 3; i++) {
        const habilidad = document.getElementById(`app${i}Habilidad`);
        const meta = document.getElementById(`app${i}Meta`);
        const nombre = document.getElementById(`app${i}Nombre`);
        const url = document.getElementById(`app${i}Url`);
        const tipoMeta = document.getElementById(`app${i}TipoMeta`);
        
        if (habilidad) habilidad.value = '';
        if (meta) meta.value = '';
        if (nombre) nombre.value = '';
        if (url) url.value = '';
        if (tipoMeta) tipoMeta.value = 'puntos';
    }
    
    state.apps = [
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' },
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' },
        { habilidad: '', meta: '', nombre: '', url: '', tipoMeta: 'puntos' }
    ];
    
    validateForm();
    
    alert('✅ Todos los campos han sido limpiados');
}