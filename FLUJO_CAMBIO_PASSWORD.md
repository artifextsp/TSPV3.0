# 🔐 Flujo de Cambio de Contraseña - Thinking Skills Program v2

## 📋 Resumen del Flujo

Cuando un estudiante (o cualquier usuario) tiene `primera_vez = true` en la base de datos, el sistema lo redirige automáticamente a cambiar su contraseña antes de acceder al dashboard.

## 🔄 Flujo Completo Paso a Paso

### 1. **Login Inicial**
```
Usuario ingresa credenciales → Sistema verifica → Login exitoso
```

### 2. **Verificación de Primera Vez**
```javascript
// En auth/auth.redirect.js - función redirectToDashboard()
if (checkFirstTime && user.primera_vez) {
  // Redirige a página de cambio de contraseña
  window.location.href = getChangePasswordUrl(user.role);
  return; // NO continúa al dashboard
}
```

**Rutas configuradas por rol:**
- **Estudiantes**: `estudiante/cambiar_password.html`
- **Docentes**: `docente/cambiar_password.html`
- **Rectores**: `rector/cambiar_password.html`
- **Acudientes**: `acudiente/cambiar_password.html`

### 3. **Página de Cambio de Contraseña**
El usuario ve un formulario con:
- Campo: **Contraseña actual**
- Campo: **Nueva contraseña**
- Campo: **Confirmar nueva contraseña**

### 4. **Validaciones**
Antes de cambiar la contraseña, el sistema valida:

✅ **Contraseña actual correcta**
```javascript
// Verifica que la contraseña ingresada coincida con password_hash en BD
const isCurrentPasswordValid = await verifyPassword(currentPassword, userData);
```

✅ **Fortaleza de nueva contraseña**
```javascript
// Valida que la nueva contraseña cumpla requisitos mínimos
const passwordValidation = validatePasswordStrength(newPassword);
// Requisitos: mínimo 6 caracteres, etc.
```

✅ **Confirmación coincide**
```javascript
// La nueva contraseña y confirmación deben ser iguales
if (newPassword !== confirmPassword) {
  // Error: "Las contraseñas no coinciden"
}
```

### 5. **Actualización en Base de Datos**
```javascript
// En auth/auth.core.js - función changePassword()
const updateResponse = await fetch(updateUrl, {
  method: 'PATCH',
  body: JSON.stringify({
    password_hash: passwordHash,  // Nueva contraseña hasheada (SHA-256)
    primera_vez: false            // ⚠️ IMPORTANTE: Ya no es primera vez
  })
});
```

**Campos actualizados:**
- `password_hash`: Hash SHA-256 de la nueva contraseña
- `primera_vez`: Cambia de `true` a `false`

### 6. **Actualización de Sesión Local**
```javascript
// Actualiza la sesión en localStorage
updateUser({ primera_vez: false });
```

### 7. **Redirección al Dashboard**
Después de cambiar la contraseña exitosamente:
```javascript
// Redirige al dashboard correspondiente según el rol
window.location.href = getDashboardUrl(user.role);
```

## 🎯 Casos de Uso

### Caso 1: Estudiante Nuevo (Primera Vez)
1. Estudiante recibe credenciales: `TSP001` / `Cambiar en primer login`
2. Hace login con cualquier contraseña temporal
3. **Sistema detecta `primera_vez = true`**
4. Redirige automáticamente a `estudiante/cambiar_password.html`
5. Estudiante ingresa:
   - Contraseña actual: (la que usó para login)
   - Nueva contraseña: (su contraseña personal)
   - Confirmar: (repite la nueva)
6. Sistema actualiza contraseña y `primera_vez = false`
7. Redirige a `estudiante/dashboard.html`

### Caso 2: Usuario Existente (No Primera Vez)
1. Usuario hace login normalmente
2. Sistema verifica `primera_vez = false`
3. Redirige directamente al dashboard
4. **NO** muestra página de cambio de contraseña

### Caso 3: Cambio de Contraseña Manual (Posterior)
Si un usuario quiere cambiar su contraseña después:
1. Accede a su perfil/configuración
2. Selecciona "Cambiar contraseña"
3. Ingresa contraseña actual y nueva
4. Mismo proceso, pero **NO** cambia `primera_vez` (ya es `false`)

## 🔧 Configuración en Base de Datos

### Campo `primera_vez`
```sql
-- Ver usuarios que deben cambiar contraseña
SELECT codigo_estudiante, nombre, email, primera_vez
FROM usuarios
WHERE primera_vez = true
  AND activo = true;

-- Marcar usuario como "ya cambió contraseña"
UPDATE usuarios
SET primera_vez = false
WHERE email = 'estudiante@ejemplo.com';
```

### Asignar Contraseña Temporal
```sql
-- Hash SHA-256 de "temporal123"
UPDATE usuarios
SET password_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
    primera_vez = true
WHERE codigo_estudiante = 'EST0001';
```

## 📝 Archivos Involucrados

### Backend (Lógica)
- **`auth/auth.core.js`**
  - Función `changePassword()`: Cambia la contraseña
  - Función `verifyPassword()`: Verifica contraseña actual
  - Función `validatePasswordStrength()`: Valida fortaleza

- **`auth/auth.redirect.js`**
  - Función `redirectToDashboard()`: Verifica `primera_vez` y redirige
  - Función `getChangePasswordUrl()`: Obtiene URL según rol

- **`auth/auth.session.js`**
  - Función `updateUser()`: Actualiza sesión local

### Frontend (Interfaz)
- **`estudiante/cambiar_password.html`** (debe crearse)
- **`docente/cambiar_password.html`** (debe crearse)
- **`rector/cambiar_password.html`** (debe crearse)
- **`acudiente/cambiar_password.html`** (debe crearse)

## ⚠️ Importante

1. **Seguridad**: Las contraseñas se almacenan como hash SHA-256, nunca en texto plano
2. **Obligatorio**: Si `primera_vez = true`, el usuario **NO puede** acceder al dashboard hasta cambiar la contraseña
3. **Validación**: La nueva contraseña debe cumplir requisitos mínimos de seguridad
4. **Sesión**: Después de cambiar, la sesión se actualiza automáticamente

## 🚀 Próximos Pasos

1. ✅ Crear páginas HTML de cambio de contraseña para cada rol
2. ✅ Probar el flujo completo con un usuario de prueba
3. ✅ Verificar que `primera_vez` se actualiza correctamente
4. ✅ Asegurar que después del cambio, redirige al dashboard correcto

---

**Nota**: Actualmente las páginas HTML de cambio de contraseña no existen. Se deben crear para que el flujo funcione completamente.
