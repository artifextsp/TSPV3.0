# 🔐 Sistema de Autenticación - Thinking Skills Program v2

Sistema de autenticación completo y robusto para la plataforma Thinking Skills Program v2, integrado con Supabase.

## 📋 Características

- ✅ **Login seguro** con validación de credenciales
- ✅ **Registro de usuarios** con validación de fortaleza de contraseña
- ✅ **Recuperación de contraseña** con tokens seguros
- ✅ **Cambio de contraseña** para usuarios autenticados
- ✅ **Gestión de sesiones** con expiración automática
- ✅ **Control de acceso por roles** (admin, docente, estudiante, etc.)
- ✅ **Protección contra ataques** (rate limiting, validación de entrada)
- ✅ **Manejo seguro de errores** con mensajes amigables
- ✅ **Compatibilidad con datos migrados** del sistema anterior

## 🏗️ Estructura del Proyecto

```
TSP/
├── config/
│   └── supabase.config.js      # Configuración de Supabase
├── auth/
│   ├── auth.core.js            # Funciones principales de autenticación
│   ├── auth.session.js         # Gestión de sesiones
│   ├── auth.redirect.js        # Redirecciones por rol
│   └── auth.utils.js           # Utilidades y helpers
├── index.html                  # Página de login
└── dashboard.html              # Página protegida de ejemplo
```

## 🚀 Inicio Rápido

### 1. Configuración

El archivo `config/supabase.config.js` ya está configurado con las credenciales de TSP:

```javascript
SUPABASE_URL: 'https://rxqiimwqlisnurgmtmtw.supabase.co'
SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
STORAGE_KEY: 'tsp_user_session'
```

### 2. Verificar Tabla de Usuarios

Asegúrate de que tu tabla `usuarios` tenga estos campos mínimos:

- `id` (UUID)
- `email` (TEXT, UNIQUE)
- `password_hash` o `password` o `contrasena` (TEXT)
- `nombre` (TEXT)
- `tipo_usuario` (TEXT) - Campo que contiene el rol
- `activo` (BOOLEAN)
- `primera_vez` (BOOLEAN)

### 3. Configurar Row Level Security (RLS)

Ejecuta en Supabase SQL Editor:

```sql
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de usuarios activos"
ON usuarios FOR SELECT
USING (activo = true);
```

## 📚 Uso de la API

### Login

```javascript
import { login } from './auth/auth.core.js';

const result = await login('usuario@ejemplo.com', 'password123', {
  autoRedirect: true,      // Redirige automáticamente al dashboard
  checkFirstTime: true     // Verifica si debe cambiar contraseña
});

if (result.success) {
  console.log('Bienvenido', result.user.nombre);
} else {
  console.error(result.error);
}
```

### Registro

```javascript
import { register } from './auth/auth.core.js';

const result = await register({
  email: 'nuevo@ejemplo.com',
  password: 'Password123',
  nombre: 'Juan Pérez',
  tipo_usuario: 'estudiante'
}, {
  autoLogin: true  // Iniciar sesión automáticamente después del registro
});
```

### Recuperación de Contraseña

```javascript
import { requestPasswordReset, resetPassword } from './auth/auth.core.js';

// Paso 1: Solicitar recuperación
const result = await requestPasswordReset('usuario@ejemplo.com');

// Paso 2: Restablecer contraseña con el token recibido
const resetResult = await resetPassword(
  'usuario@ejemplo.com',
  'token_recibido',
  'NewPassword123'
);
```

### Cambio de Contraseña

```javascript
import { changePassword } from './auth/auth.core.js';

const result = await changePassword('oldPassword123', 'NewPassword123');
```

### Proteger Páginas

```javascript
import { requireAuth, requireRole } from './auth/auth.core.js';

// Requiere cualquier autenticación
const user = requireAuth();

// Requiere rol específico
const admin = requireRole('admin');
```

### Obtener Usuario Actual

```javascript
import { getUser, hasRole, getEffectiveRole } from './auth/auth.core.js';

const user = getUser();
if (user) {
  console.log('Usuario:', user.nombre);
  console.log('Rol:', getEffectiveRole());
  console.log('Es admin?', hasRole('admin'));
}
```

### Logout

```javascript
import { logout } from './auth/auth.core.js';

await logout({
  redirect: true  // Redirige al login automáticamente
});
```

## 🔒 Seguridad

### Protecciones Implementadas

1. **Rate Limiting**: Previene ataques de fuerza bruta (5 intentos cada 15 minutos)
2. **Validación de Entrada**: Sanitización de datos de entrada
3. **Hash de Contraseñas**: SHA-256 para almacenamiento seguro
4. **Validación de Fortaleza**: Requisitos mínimos de contraseña
5. **Expiración de Sesiones**: Sesiones expiran después de 24 horas
6. **Validación de Roles**: Solo roles válidos pueden autenticarse

### Validación de Contraseña

Las contraseñas deben cumplir:
- Mínimo 8 caracteres
- Al menos una letra mayúscula
- Al menos una letra minúscula
- Al menos un número

## ⚙️ Configuración Avanzada

### Personalizar Roles

Edita `config/supabase.config.js`:

```javascript
VALID_ROLES: [
  'admin',
  'super_admin',
  'docente',
  'estudiante',
  'usuario'
  // Añade tus roles aquí
]
```

### Personalizar Rutas por Rol

Edita `auth/auth.redirect.js`:

```javascript
const ROLES_CONFIG = {
  admin: {
    dashboard: 'dashboard_admin.html',
    loginPage: 'index.html',
    changePassword: 'cambiar_password.html'
  },
  // Añade más roles...
};
```

### Personalizar Campos de Usuario

Edita `config/supabase.config.js`:

```javascript
USER_FIELDS: [
  'id',
  'email',
  'nombre',
  'tipo_usuario',
  'activo',
  'primera_vez',
  // Añade campos adicionales de tu sistema anterior
]
```

## 🐛 Solución de Problemas

### Error: "Usuario no encontrado"

- Verifica que el email existe en la tabla `usuarios`
- Verifica que `USERS_TABLE` en config tiene el nombre correcto
- Verifica que RLS permite lectura de usuarios activos

### Error: "Credenciales inválidas"

- Verifica cómo almacenas las contraseñas (hash SHA-256 por defecto)
- Verifica que el campo de contraseña se llama `password_hash`, `password` o `contrasena`
- Verifica que la contraseña está correctamente hasheada

### Error: "Rol inválido"

- Añade el rol faltante a `VALID_ROLES` en config
- Verifica que el campo `USER_ROLE_FIELD` coincide con tu tabla

### La sesión no persiste

- Verifica que `STORAGE_KEY` es único
- Limpia localStorage: `localStorage.clear()`
- Verifica que no hay conflictos con otras aplicaciones

## 📝 Notas Importantes

1. **Contraseñas**: El sistema usa hash SHA-256 por defecto. Ajusta `verifyPassword()` si usas otro método.

2. **Recuperación de Contraseña**: La implementación actual usa localStorage para tokens (solo desarrollo). En producción, implementa:
   - Guardar tokens en la base de datos
   - Envío de emails con links de recuperación
   - Expiración automática de tokens

3. **Campos Adicionales**: Los campos adicionales del sistema anterior se preservan en `session.extra` y están disponibles en `getUser()`.

4. **RLS**: Asegúrate de configurar Row Level Security correctamente en Supabase para proteger tus datos.

## 🔄 Migración desde Sistema Anterior

El sistema está diseñado para trabajar con datos migrados:

- ✅ Compatible con estructura existente de tabla `usuarios`
- ✅ Preserva campos adicionales del sistema anterior
- ✅ No requiere cambios en la estructura de base de datos
- ✅ Funciona con contraseñas hasheadas existentes

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la sección de Solución de Problemas
2. Verifica los logs en la consola del navegador (F12)
3. Revisa la configuración en `config/supabase.config.js`

## 📄 Licencia

Sistema de autenticación para Thinking Skills Program v2.

---

**Versión**: 2.0  
**Última actualización**: Enero 2026
