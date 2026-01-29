# 📖 Guía: Gestionar Acudientes y Asociar Múltiples Hijos

## 🎯 Propósito

Esta interfaz permite a los administradores:
1. Buscar acudientes por múltiples criterios
2. Ver la información de un acudiente y sus hijos asociados
3. Agregar nuevos hijos a un acudiente existente
4. Desasociar hijos de un acudiente
5. Ver un listado de acudientes con múltiples hijos

---

## 🔄 Flujo de Trabajo Completo

### **PASO 1: Buscar un Acudiente**

1. En el campo de búsqueda superior, escribe cualquier criterio:
   - **Nombre**: "Juan", "María", "Claudia"
   - **Apellidos**: "Pérez", "García", "Borrero"
   - **Email**: "juan@email.com" o parte del email
   - **Username**: "ACU001", "ACU031"

2. Haz clic en el botón **"Buscar"** o presiona **Enter**

3. **Resultados posibles:**
   - **Un solo resultado**: Se muestra directamente la información del acudiente
   - **Múltiples resultados**: Aparece una lista con todos los acudientes encontrados

### **PASO 2: Seleccionar un Acudiente (si hay múltiples resultados)**

Si aparecen varios acudientes en la lista:

1. Revisa la información de cada uno:
   - Nombre completo
   - Email
   - Username (ACU001, ACU031, etc.)
   - Cantidad de hijos asociados

2. Haz clic en el botón **"Seleccionar"** del acudiente que quieres gestionar

3. **✅ Confirmación**: Verás un mensaje verde confirmando que el acudiente fue seleccionado

4. **📋 Información mostrada:**
   - Datos del acudiente (nombre, email, celular, username)
   - Lista de hijos actualmente asociados
   - Sección para agregar nuevos hijos

### **PASO 3: Ver Hijos Asociados**

Una vez seleccionado el acudiente, verás:

- **Sección "👨‍👧 Hijos Asociados"**: Lista todos los hijos actualmente asociados
  - Muestra: Nombre completo, código de estudiante y grado
  - Cada hijo tiene un botón **"Quitar"** para desasociarlo

### **PASO 4: Agregar un Nuevo Hijo**

**⚠️ IMPORTANTE**: Solo puedes buscar estudiantes **DESPUÉS** de haber seleccionado un acudiente.

1. En la sección **"➕ Agregar Hijo"**, escribe en el campo **"Buscar Estudiante"**:
   - **Nombre**: "Juan", "David", "Juan David"
   - **Apellidos**: "Pérez", "García"
   - **Código de estudiante**: "EST0001", "EST0054"
   - **Búsqueda combinada**: "Juan David", "Juan Pérez"

2. La búsqueda se realiza automáticamente mientras escribes (después de 2 caracteres)

3. **Resultados:**
   - Aparece una lista de estudiantes que coinciden con tu búsqueda
   - Solo muestra estudiantes que **NO están ya asociados** a este acudiente

4. Haz clic en el botón **"Agregar"** del estudiante que quieres asociar

5. **Confirmación**: Aparece un modal pidiendo confirmación

6. Haz clic en **"Confirmar"** para asociar el estudiante

7. **✅ Éxito**: Verás un mensaje verde confirmando la asociación

8. El estudiante aparecerá automáticamente en la lista de "Hijos Asociados"

### **PASO 5: Desasociar un Hijo**

1. En la lista de "Hijos Asociados", encuentra el hijo que quieres desasociar

2. Haz clic en el botón **"Quitar"**

3. Confirma la acción en el diálogo que aparece

4. **✅ Éxito**: El hijo será removido de la lista

---

## ⚠️ Problemas Comunes y Soluciones

### **Problema 1: "Primero selecciona un acudiente"**

**Causa**: Intentaste buscar estudiantes sin haber seleccionado un acudiente primero.

**Solución**:
1. Busca un acudiente en el campo superior
2. Si aparecen varios resultados, haz clic en **"Seleccionar"** del que quieres gestionar
3. Una vez seleccionado, podrás buscar estudiantes

### **Problema 2: "No se encontraron estudiantes"**

**Causas posibles**:
- El estudiante no existe en el sistema
- El estudiante ya está asociado a este acudiente
- La búsqueda no coincide (revisa ortografía)

**Soluciones**:
- Intenta buscar por código de estudiante (ej: EST0001)
- Busca solo por nombre o solo por apellido
- Verifica que el estudiante existe en el sistema

### **Problema 3: El botón "Seleccionar" no hace nada**

**Causa**: Puede haber un problema con caracteres especiales en el email.

**Solución**:
1. Recarga la página (F5)
2. Intenta buscar nuevamente
3. Si persiste, busca por username en lugar de email

### **Problema 4: No aparece el estudiante "Juan David"**

**Causas posibles**:
- El nombre está escrito diferente en la base de datos
- El estudiante no existe
- Hay espacios o caracteres especiales

**Soluciones**:
- Busca solo "Juan" o solo "David"
- Busca por código de estudiante si lo conoces
- Verifica en el dashboard de estudiantes que el estudiante existe

---

## 📋 Ejemplo Completo de Uso

### Escenario: Asociar dos hijos a Claudia Borrero

1. **Buscar acudiente:**
   - Escribo "claudia" en el campo de búsqueda
   - Presiono Enter o hago clic en "Buscar"
   - Aparecen 3 resultados: Claudia Borrero (2 emails diferentes) y Claudia Torres

2. **Seleccionar acudiente:**
   - Veo que hay dos acudientes con nombre "Claudia Borrero" pero emails diferentes
   - Selecciono el que tiene el email `claudia.borrero@a.seminariopalmira.edu.co`
   - Hago clic en "Seleccionar"
   - ✅ Aparece mensaje: "Acudiente seleccionado correctamente"

3. **Ver hijos actuales:**
   - Veo que actualmente tiene 1 hijo asociado: EST0054 - Juan Pablo Cuellar

4. **Agregar nuevo hijo:**
   - En "Buscar Estudiante", escribo "Sofia"
   - Aparece en los resultados: EST0057 - Sofia Cuellar
   - Hago clic en "Agregar"
   - Confirmo en el modal
   - ✅ Aparece mensaje: "Estudiante asociado correctamente"
   - Ahora veo 2 hijos en la lista

5. **Verificar:**
   - La tabla inferior "Acudientes con Múltiples Hijos" se actualiza automáticamente
   - Ahora muestra que Claudia Borrero tiene 2 hijos

---

## 🔍 Consejos de Búsqueda

### Para Acudientes:
- **Búsqueda flexible**: Puedes escribir parte del nombre, apellido o email
- **Case-insensitive**: No importan mayúsculas/minúsculas
- **Mínimo 2 caracteres**: Necesitas escribir al menos 2 caracteres

### Para Estudiantes:
- **Búsqueda por nombre completo**: "Juan David" busca en nombre y apellidos
- **Búsqueda por código**: Más precisa, usa "EST0001" para encontrar exactamente ese estudiante
- **Búsqueda parcial**: "Juan" encontrará "Juan Pablo", "Juan David", etc.

---

## ✅ Checklist de Uso

Antes de empezar:
- [ ] Estás logueado como administrador
- [ ] Tienes los datos del acudiente (nombre, email o username)
- [ ] Conoces los códigos o nombres de los estudiantes a asociar

Para asociar un hijo:
- [ ] Buscaste y seleccionaste el acudiente correcto
- [ ] Verificaste los hijos actuales del acudiente
- [ ] Buscaste el estudiante correcto
- [ ] Confirmaste la asociación en el modal
- [ ] Verificaste que apareció en la lista de hijos

---

## 🆘 Si Necesitas Ayuda

1. **Revisa la consola del navegador** (F12) para ver errores
2. **Verifica que el acudiente existe** en la base de datos
3. **Verifica que el estudiante existe** y está activo
4. **Recarga la página** si algo no funciona
5. **Contacta al administrador** si persisten los problemas

---

**Última actualización**: Enero 2026
