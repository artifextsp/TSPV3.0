# 🎛️ Dashboard Administrativo - Thinking Skills Program v2

## 📋 Descripción

Dashboard administrativo completo para gestionar estudiantes, colegios y docentes del sistema Thinking Skills Program v2. Diseñado específicamente para el administrador **Hansel Peña Díaz (CC 94300774)**.

## ✨ Características

### 👨‍🎓 Módulo de Estudiantes
- ✅ Crear nuevo estudiante
- ✅ Listar todos los estudiantes con búsqueda
- ✅ Editar datos del estudiante
- ✅ Eliminar estudiante (soft delete)
- ✅ Resetear contraseña del estudiante

### 🏫 Módulo de Colegios
- ✅ Crear nuevo colegio (código auto-generado: COL001, COL002, etc.)
- ✅ Listar todos los colegios con búsqueda
- ✅ Editar datos del colegio
- ✅ Eliminar colegio (soft delete)
- ✅ Asignar estudiantes a un colegio específico
- ✅ Remover estudiantes de un colegio

### 👨‍🏫 Módulo de Docentes
- ✅ Crear nuevo docente
- ✅ Listar todos los docentes con búsqueda
- ✅ Editar datos del docente
- ✅ Eliminar docente (soft delete)
- ✅ Resetear contraseña del docente

## 🚀 Pasos de Instalación

### Paso 1: Crear Tablas en Supabase

Ejecuta el script SQL para crear las tablas necesarias:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y ejecuta el contenido de `scripts/crear_tabla_colegios.sql`
3. Verifica que las tablas se crearon correctamente:
   - `colegios`
   - `estudiantes_colegios`

### Paso 2: Configurar Row Level Security (RLS)

Ejecuta el script SQL para configurar las políticas de seguridad:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y ejecuta el contenido de `scripts/configurar_rls_admin.sql`
3. ⚠️ **Nota**: Las políticas RLS pueden necesitar ajustes según tu método de autenticación

### Paso 3: Configurar Usuario Administrador

Asegúrate de que tu usuario tenga permisos de administrador:

```sql
-- Opción 1: Actualizar tipo_usuario a 'admin' o 'super_admin'
UPDATE usuarios 
SET tipo_usuario = 'admin' 
WHERE email = 'tu-email@ejemplo.com';

-- Opción 2: Verificar que el documento sea 94300774 (Hansel Peña Díaz)
-- (Si tienes campo documento en la tabla usuarios)
UPDATE usuarios 
SET documento = '94300774' 
WHERE email = 'tu-email@ejemplo.com';
```

### Paso 4: Acceder al Dashboard

1. Abre `admin/dashboard.html` en tu navegador
2. Asegúrate de estar autenticado como administrador
3. El sistema verificará automáticamente tus permisos

## 📁 Estructura de Archivos

```
TSP/
├── admin/
│   ├── dashboard.html          # Dashboard administrativo principal
│   └── admin.api.js             # Funciones CRUD para todas las entidades
├── scripts/
│   ├── crear_tabla_colegios.sql  # Script para crear tablas
│   └── configurar_rls_admin.sql # Script para configurar RLS
└── ...
```

## 🔧 Configuración de Tablas

### Tabla: `colegios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `nombre` | TEXT | Nombre del colegio |
| `codigo` | TEXT | Código auto-generado (COL001, COL002, etc.) |
| `nombre_rector` | TEXT | Nombre del rector |
| `celular_rector` | TEXT | Celular del rector |
| `email` | TEXT | Email del rector |
| `direccion` | TEXT | Dirección del colegio |
| `activo` | BOOLEAN | Estado del colegio |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de actualización |

### Tabla: `estudiantes_colegios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `estudiante_id` | UUID | Referencia al estudiante |
| `colegio_id` | UUID | Referencia al colegio |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Fecha de actualización |

## 🎯 Uso del Dashboard

### Crear un Estudiante

1. Ve a la pestaña **👨‍🎓 Estudiantes**
2. Haz clic en **+ Nuevo Estudiante**
3. Completa el formulario:
   - Nombre
   - Apellidos
   - Email
   - Grado (1° a 11°)
4. Haz clic en **Guardar**
5. El sistema generará automáticamente:
   - Código de estudiante (EST0001, EST0002, etc.)
   - Contraseña inicial: `123456`

### Crear un Colegio

1. Ve a la pestaña **🏫 Colegios**
2. Haz clic en **+ Nuevo Colegio**
3. Completa el formulario:
   - Nombre del Colegio
   - Nombre del Rector
   - Email del Rector
   - Celular del Rector (opcional)
   - Dirección (opcional)
4. Haz clic en **Guardar**
5. El sistema generará automáticamente el código (COL001, COL002, etc.)

### Asignar Estudiantes a un Colegio

1. Ve a la pestaña **🏫 Colegios**
2. En la fila del colegio, haz clic en **Asignar Estudiantes**
3. Se abrirá un modal con todos los estudiantes disponibles
4. Haz clic en **Asignar** junto al estudiante que deseas asignar
5. Para remover un estudiante, haz clic en **Remover**

### Crear un Docente

1. Ve a la pestaña **👨‍🏫 Docentes**
2. Haz clic en **+ Nuevo Docente**
3. Completa el formulario:
   - Nombre
   - Apellidos
   - Email
4. Haz clic en **Guardar**
5. El sistema asignará automáticamente:
   - Contraseña inicial: `temporal123`

### Resetear Contraseñas

**Para Estudiantes:**
1. Ve a la pestaña **👨‍🎓 Estudiantes**
2. Haz clic en **Resetear Password** junto al estudiante
3. Confirma la acción
4. La nueva contraseña será: `123456`

**Para Docentes:**
1. Ve a la pestaña **👨‍🏫 Docentes**
2. Haz clic en **Resetear Password** junto al docente
3. Confirma la acción
4. La nueva contraseña será: `temporal123`

## 🔐 Seguridad

### Verificación de Administrador

El dashboard verifica que el usuario sea administrador de las siguientes formas:

1. `tipo_usuario === 'admin'` o `'super_admin'` o `'administrador'`
2. `documento === '94300774'` (Hansel Peña Díaz)
3. Email contiene 'hansel' (fallback)

Si el usuario no cumple ninguna de estas condiciones, será redirigido al login.

### Row Level Security (RLS)

Las políticas RLS están configuradas para:
- Permitir acceso completo a administradores
- Bloquear acceso a usuarios no autorizados
- Proteger datos sensibles como `password_hash`

## ⚠️ Notas Importantes

1. **Códigos Auto-generados**: Los códigos de colegios se generan automáticamente mediante un trigger en PostgreSQL. No es necesario especificarlos manualmente.

2. **Soft Delete**: Las operaciones de eliminación son "soft delete" (marcan `activo = false`), por lo que los registros no se eliminan físicamente de la base de datos.

3. **Contraseñas por Defecto**:
   - Estudiantes: `123456`
   - Docentes: `temporal123`
   - Los usuarios deberán cambiar su contraseña en el primer login si `primera_vez = true`

4. **Búsqueda**: La búsqueda funciona en tiempo real mientras escribes en el campo de búsqueda.

5. **RLS y REST API**: Si estás usando autenticación personalizada (no Supabase Auth), es posible que necesites ajustar las políticas RLS en `scripts/configurar_rls_admin.sql`.

## 🐛 Solución de Problemas

### Error: "No tienes permisos para acceder a esta página"

**Solución**: Verifica que tu usuario tenga `tipo_usuario = 'admin'` o `'super_admin'` en la tabla `usuarios`.

### Error: "Error 400: column does not exist"

**Solución**: Asegúrate de que todas las tablas y columnas existen. Ejecuta los scripts SQL en el orden correcto.

### Error: "Error al cargar estudiantes/colegios/docentes"

**Solución**: 
1. Verifica que RLS esté configurado correctamente
2. Verifica que las políticas permitan acceso a administradores
3. Revisa la consola del navegador (F12) para más detalles

### Los códigos de colegios no se generan automáticamente

**Solución**: Verifica que el trigger `trigger_generar_codigo_colegio` esté creado correctamente ejecutando:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_generar_codigo_colegio';
```

## 📞 Soporte

Para más información o ayuda, consulta:
- Documentación de Supabase: https://supabase.com/docs
- Scripts SQL en la carpeta `scripts/`
- Código fuente en `admin/admin.api.js` y `admin/dashboard.html`

---

**Desarrollado para Thinking Skills Program v2**  
**Administrador: Hansel Peña Díaz (CC 94300774)**
