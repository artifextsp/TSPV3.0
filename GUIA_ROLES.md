# 👥 Sistema de Roles - Thinking Skills Program v2

## 📋 Roles del Sistema

El sistema de autenticación está configurado con **3 roles principales**:

### 1. 👨‍🎓 **ESTUDIANTE**
- **Función:** Realizan las prácticas del Thinking Skills Program
- **Dashboard:** `estudiante/dashboard.html`
- **Permisos:**
  - Acceso a prácticas asignadas
  - Realizar ejercicios y actividades
  - Ver su propio progreso
  - Cambiar su contraseña

### 2. 👨‍🏫 **DOCENTE**
- **Función:** Dirigen las prácticas y visualizan resultados en tiempo real
- **Dashboard:** `docente/dashboard.html`
- **Permisos:**
  - Crear y asignar prácticas
  - Visualizar resultados de estudiantes en tiempo real
  - Gestionar grupos/clases
  - Ver estadísticas de sus estudiantes
  - Cambiar su contraseña

### 3. 🎓 **RECTOR**
- **Función:** Visualizan resultados y estadísticas generales
- **Dashboard:** `rector/dashboard.html`
- **Permisos:**
  - Acceso completo a todas las estadísticas
  - Visualizar resultados de todos los estudiantes
  - Ver estadísticas por grado, grupo, docente
  - Reportes y análisis generales
  - Cambiar su contraseña

## 🔐 Jerarquía de Permisos

```
RECTOR (Máximo nivel)
  └── Puede ver todo
      └── Estadísticas generales
      └── Resultados de todos los estudiantes
      └── Reportes completos

DOCENTE (Nivel medio)
  └── Puede ver datos de estudiantes
      └── Resultados en tiempo real
      └── Estadísticas de sus grupos
      └── Gestionar prácticas

ESTUDIANTE (Nivel básico)
  └── Solo sus propios datos
      └── Realizar prácticas
      └── Ver su progreso
```

## 📁 Estructura de Carpetas Recomendada

```
TSP/
├── index.html                    # Login único para todos
├── estudiante/
│   ├── dashboard.html            # Dashboard de estudiantes
│   └── cambiar_password.html     # Cambio de contraseña
├── docente/
│   ├── dashboard.html            # Dashboard de docentes
│   └── cambiar_password.html     # Cambio de contraseña
└── rector/
    ├── dashboard.html            # Dashboard de rectores
    └── cambiar_password.html     # Cambio de contraseña
```

## 🔧 Configuración en Base de Datos

### Valores de `tipo_usuario` en la tabla `usuarios`:

- `'estudiante'` - Para estudiantes
- `'docente'` - Para docentes
- `'rector'` - Para rectores

### Ejemplo de actualización SQL:

```sql
-- Actualizar rol de un usuario a estudiante
UPDATE usuarios 
SET tipo_usuario = 'estudiante'
WHERE email = 'estudiante@ejemplo.com';

-- Actualizar rol de un usuario a docente
UPDATE usuarios 
SET tipo_usuario = 'docente'
WHERE email = 'docente@ejemplo.com';

-- Actualizar rol de un usuario a rector
UPDATE usuarios 
SET tipo_usuario = 'rector'
WHERE email = 'rector@ejemplo.com';
```

## 🛡️ Protección de Rutas por Rol

### En páginas de estudiantes:

```javascript
import { requireRole } from '../auth/auth.core.js';

// Solo estudiantes pueden acceder
const user = requireRole('estudiante');
if (!user) {
  // Ya redirigió automáticamente al login
}
```

### En páginas de docentes:

```javascript
import { requireRole } from '../auth/auth.core.js';

// Solo docentes pueden acceder
const user = requireRole('docente');
if (!user) {
  // Ya redirigió automáticamente al login
}
```

### En páginas de rectores:

```javascript
import { requireRole } from '../auth/auth.core.js';

// Solo rectores pueden acceder
const user = requireRole('rector');
if (!user) {
  // Ya redirigió automáticamente al login
}
```

### Verificar rol sin redirección:

```javascript
import { hasRole, getUser } from '../auth/auth.core.js';

const user = getUser();
if (hasRole('docente')) {
  // Mostrar funciones de docente
}
if (hasRole('rector')) {
  // Mostrar funciones de rector
}
```

## 📊 Ejemplo de Uso en Dashboards

### Dashboard de Estudiante:

```javascript
import { requireRole, getUser } from '../auth/auth.core.js';

const user = requireRole('estudiante');
if (user) {
  // Mostrar prácticas asignadas
  // Mostrar progreso del estudiante
  console.log(`Bienvenido estudiante: ${user.nombre}`);
}
```

### Dashboard de Docente:

```javascript
import { requireRole, getUser } from '../auth/auth.core.js';

const user = requireRole('docente');
if (user) {
  // Mostrar prácticas creadas
  // Mostrar resultados en tiempo real
  // Mostrar estadísticas de estudiantes
  console.log(`Bienvenido docente: ${user.nombre}`);
}
```

### Dashboard de Rector:

```javascript
import { requireRole, getUser } from '../auth/auth.core.js';

const user = requireRole('rector');
if (user) {
  // Mostrar estadísticas generales
  // Mostrar reportes completos
  // Mostrar análisis por grado/grupo
  console.log(`Bienvenido rector: ${user.nombre}`);
}
```

## ✅ Checklist de Implementación

- [x] Roles configurados en `VALID_ROLES`
- [x] Rutas configuradas en `ROLES_CONFIG`
- [x] Jerarquía de permisos implementada
- [ ] Crear carpetas `estudiante/`, `docente/`, `rector/`
- [ ] Crear dashboards específicos para cada rol
- [ ] Actualizar valores de `tipo_usuario` en base de datos
- [ ] Probar redirecciones por rol
- [ ] Implementar protección de rutas en cada dashboard

## 🔄 Migración de Roles Existentes

Si tienes usuarios con roles antiguos (`admin`, `usuario`, etc.), actualízalos:

```sql
-- Migrar usuarios antiguos a nuevos roles
-- Ajusta según tu lógica de negocio

-- Ejemplo: Todos los usuarios con tipo 'usuario' → 'estudiante'
UPDATE usuarios 
SET tipo_usuario = 'estudiante'
WHERE tipo_usuario = 'usuario';

-- Ejemplo: Usuarios específicos → 'docente'
UPDATE usuarios 
SET tipo_usuario = 'docente'
WHERE email IN ('docente1@ejemplo.com', 'docente2@ejemplo.com');

-- Ejemplo: Usuarios específicos → 'rector'
UPDATE usuarios 
SET tipo_usuario = 'rector'
WHERE email IN ('rector@ejemplo.com');
```

## 📝 Notas Importantes

1. **Un usuario solo puede tener UN rol** a la vez
2. **El sistema redirige automáticamente** al dashboard correspondiente según el rol
3. **Las rutas son relativas** al root del proyecto
4. **Los roles son case-insensitive** (estudiante = ESTUDIANTE = Estudiante)

---

**Sistema configurado y listo para usar con los 3 roles principales.** 🎉
