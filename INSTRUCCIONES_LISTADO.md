# 📋 Listado de Credenciales - Thinking Skills Program v2

## 🎯 Propósito

Este documento contiene las credenciales de acceso para estudiantes y acudientes que se entregarán en la primera clase de uso de la plataforma.

## 📁 Archivos Creados

1. **`listado_credenciales.html`** - Página web interactiva que genera el listado completo
2. **`scripts/listado_credenciales.sql`** - Script SQL para consultar los datos directamente en Supabase

## 🚀 Cómo Usar

### Opción 1: Usar el HTML (Recomendado)

1. Abre el archivo `listado_credenciales.html` en tu navegador
2. Espera a que cargue los datos automáticamente
3. Haz clic en el botón **"🖨️ Imprimir / Guardar PDF"**
4. En el diálogo de impresión:
   - Selecciona **"Guardar como PDF"** como destino
   - Ajusta los márgenes si es necesario
   - Haz clic en **"Guardar"**

### Opción 2: Usar el Script SQL

1. Abre Supabase SQL Editor
2. Ejecuta el script `scripts/listado_credenciales.sql`
3. Copia los resultados y pégalos en un documento

## 📊 Contenido del Listado

### Sección 1: Estudiantes
- Código de estudiante (EST0001, EST0002, etc.)
- Usuario (TSP001, TSP002, etc.)
- Nombre completo
- Grado
- Email
- Contraseña inicial

### Sección 2: Acudientes
- Usuario acudiente (ACU001, ACU002, etc.)
- Nombre del acudiente
- Email del acudiente
- Código del estudiante asociado
- Nombre del estudiante
- Grado del estudiante
- Contraseña inicial (temporal123)

## 🔐 Credenciales por Defecto

### Estudiantes
- **Usuario**: TSP001, TSP002, TSP003, etc.
- **Contraseña**: 
  - `123456` (si es contraseña antigua)
  - `Cambiar en primer login` (si ya tiene contraseña personalizada)

### Acudientes
- **Usuario**: ACU001, ACU002, ACU003, etc.
- **Contraseña**: `temporal123` (deben cambiarla en el primer login)

## ⚠️ Importante

1. **Seguridad**: Este documento contiene información confidencial. Mantenerlo en lugar seguro.
2. **Primer Login**: Todos los usuarios deberán cambiar su contraseña en el primer inicio de sesión.
3. **Distribución**: Entregar solo las credenciales correspondientes a cada estudiante/acudiente.

## 🔧 Solución de Problemas

### Si el HTML no carga los datos:
1. Verifica que estás ejecutando desde un servidor (no solo abriendo el archivo)
2. Abre la consola del navegador (F12) para ver errores
3. Verifica que las credenciales de Supabase estén correctas en `config/supabase.config.js`

### Si faltan datos:
1. Ejecuta el script SQL directamente en Supabase para verificar
2. Verifica que todos los estudiantes y acudientes estén activos (`activo = true`)
3. Verifica que los estudiantes tengan `tipo_usuario = 'estudiante'`

## 📝 Notas para la Entrega

- Imprimir en formato A4
- Usar calidad de impresión alta para mejor legibilidad
- Considerar imprimir en color para mejor distinción de secciones
- Guardar una copia digital como respaldo

---

**Fecha de generación**: Se genera automáticamente con la fecha actual  
**Versión**: Thinking Skills Program v2
