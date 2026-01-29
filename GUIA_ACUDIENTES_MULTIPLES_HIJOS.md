# 👨‍👩‍👧‍👦 Guía: Acudientes con Múltiples Hijos

## 📋 Cómo Funciona el Sistema

Cuando un acudiente tiene **múltiples hijos**, el sistema crea **un registro separado por cada hijo** en la tabla `acudientes`. Esto es correcto y permite que el sistema funcione correctamente.

### Estructura de Datos:

```
Acudiente: Claudia Borrero
Email: claudia.borrero@email.com

Registro 1:
- Email: claudia.borrero@email.com
- Username: ACU031
- Estudiante_id: (ID del hijo 1 - Juan Pablo)
- Password: temporal123

Registro 2:
- Email: claudia.borrero@email.com  
- Username: ACU048
- Estudiante_id: (ID del hijo 2 - Sofia)
- Password: temporal123
```

## 🔐 ¿Con Cuál Username Acceder?

### **Respuesta Corta:**
Puedes acceder con **cualquiera de los dos usernames** (ACU031 o ACU048), pero cada uno te mostrará información de **un hijo diferente**.

### **Opciones de Acceso:**

#### **Opción 1: Acceder con Email** (Recomendado)
- **Email**: `claudia.borrero@email.com`
- **Contraseña**: `temporal123`
- **Resultado**: El sistema tomará el **primer registro** que encuentre (puede ser ACU031 o ACU048)
- **Verás**: La información del hijo asociado a ese primer registro

#### **Opción 2: Acceder con Username Específico**
- **Username**: `ACU031` o `ACU048`
- **Contraseña**: `temporal123`
- **Resultado**: Accederás directamente al registro específico
- **Verás**: La información del hijo asociado a ese username específico

## ⚠️ Limitación Actual

**Problema**: Actualmente, cuando un acudiente tiene múltiples hijos, solo puede ver **un hijo a la vez** según el registro con el que haga login.

**Solución Futura**: Se podría implementar un selector en el dashboard del acudiente para cambiar entre hijos, pero por ahora cada login muestra un hijo específico.

## 🎯 Recomendación

### **Para Administradores:**
1. **Asigna el mismo email** a todos los registros del acudiente (ya está hecho ✅)
2. **Usa el username más bajo** (ACU031 en lugar de ACU048) como el "principal"
3. **Informa al acudiente** que puede acceder con su email o con cualquiera de los usernames

### **Para Acudientes:**
1. **Usa tu email** para acceder (más fácil de recordar)
2. Si necesitas ver información de otro hijo, puedes:
   - Cerrar sesión
   - Acceder con el otro username (si lo conoces)
   - O contactar al administrador para que te muestre la información

## 📊 Ejemplo Práctico

### Escenario: Claudia Borrero tiene 2 hijos

**Hijo 1**: Juan Pablo Cuellar (EST0054)
- Registro: ACU031
- Email: claudia.borrero@email.com

**Hijo 2**: Sofia Cuellar (EST0057)
- Registro: ACU048
- Email: claudia.borrero@email.com

### Acceso:

**Opción A - Con Email:**
```
Email: claudia.borrero@email.com
Password: temporal123
→ Verá información de Juan Pablo (primer registro encontrado)
```

**Opción B - Con Username ACU031:**
```
Username: ACU031
Password: temporal123
→ Verá información de Juan Pablo
```

**Opción C - Con Username ACU048:**
```
Username: ACU048
Password: temporal123
→ Verá información de Sofia
```

## 🔍 Verificar Qué Hijo Verá el Acudiente

Para saber qué hijo verá el acudiente al hacer login, ejecuta esta consulta SQL:

```sql
-- Ver qué hijo está asociado a cada username
SELECT 
  a.username,
  a.email,
  u.codigo_estudiante,
  u.nombre || ' ' || COALESCE(u.apellidos, '') as nombre_estudiante,
  u.grado
FROM acudientes a
JOIN usuarios u ON a.estudiante_id = u.id
WHERE a.email = 'claudia.borrero@email.com'
  AND a.activo = true
ORDER BY a.username;
```

## 💡 Mejora Futura Sugerida

Para mejorar la experiencia del usuario, se podría:

1. **Modificar el login** para que cuando un acudiente accede con email y tiene múltiples hijos, muestre un selector
2. **Actualizar el dashboard** del acudiente para permitir cambiar entre hijos sin cerrar sesión
3. **Crear una vista consolidada** que muestre todos los hijos en un solo lugar

## ✅ Resumen

- ✅ **Es correcto** que aparezcan múltiples registros (uno por hijo)
- ✅ Puedes acceder con **cualquiera de los usernames** o con el **email**
- ⚠️ Cada login muestra información de **un hijo específico**
- 💡 Usa el **email** para acceso general, o el **username específico** si necesitas ver un hijo en particular

---

**Última actualización**: Enero 2026
