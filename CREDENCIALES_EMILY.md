# ✅ Credenciales de Emily - Verificadas

## 📋 Datos Confirmados

- **Código de Estudiante**: EST0046
- **Nombre**: EMILY PEÑA ROBLES
- **Email**: constanza.robles@seminariopalmira.edu.co
- **Contraseña**: `123456` ✅
- **Estado**: Activo ✅
- **Primera Vez**: `false` (no necesita cambiar contraseña)
- **Tipo Usuario**: `usuario` (se mapea automáticamente a `estudiante`)

## 🔐 Credenciales para Login

Emily puede hacer login con cualquiera de estas opciones:

### Opción 1: Email
- **Usuario**: `constanza.robles@seminariopalmira.edu.co`
- **Contraseña**: `123456`

### Opción 2: Código de Estudiante (si tiene username asignado)
- **Usuario**: `EST0046` o `TSP0046` (si se asignó username)
- **Contraseña**: `123456`

## ✅ Verificación del Sistema

El sistema está configurado para:
1. ✅ Mapear `tipo_usuario = 'usuario'` → `role = 'estudiante'` automáticamente
2. ✅ Aceptar login con email o código de estudiante
3. ✅ Verificar contraseña `123456` (hash confirmado)
4. ✅ Redirigir a `estudiante/dashboard.html` después del login

## 🔧 Si Aún No Funciona

### Verificar en la Consola del Navegador (F12)

Abre la consola y busca errores. Los más comunes:

1. **Error de RLS (Row Level Security)**
   - Si aparece error 401/403, necesitas configurar políticas RLS en Supabase

2. **Error de CORS**
   - Verifica que las credenciales de Supabase estén correctas

3. **Error de JavaScript**
   - Ya corregimos el error de `getEstudianteHijo` duplicado
   - Recarga la página completamente (Ctrl+F5)

### Script SQL para Verificar RLS

```sql
-- Verificar que puedes leer el usuario
SELECT codigo_estudiante, email, activo, password_hash
FROM usuarios
WHERE codigo_estudiante = 'EST0046'
  AND activo = true;

-- Si no funciona, verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'usuarios';
```

## 🎯 Próximos Pasos

1. **Recarga la página de login** completamente (Ctrl+F5 o Cmd+Shift+R)
2. **Intenta login con**:
   - Email: `constanza.robles@seminariopalmira.edu.co`
   - Contraseña: `123456`
3. **Revisa la consola** (F12) si hay errores
4. **Si funciona**, Emily será redirigida a `estudiante/dashboard.html`

---

**Nota**: El sistema mapea automáticamente `tipo_usuario = 'usuario'` a `role = 'estudiante'`, así que debería funcionar correctamente.
