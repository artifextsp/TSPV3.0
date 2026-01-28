# 🚨 SOLUCIÓN INMEDIATA: Configurar RLS para Autenticación

## ⚠️ PROBLEMA IDENTIFICADO

El sistema de autenticación está bloqueado por **Row Level Security (RLS)** en Supabase. Las políticas RLS están impidiendo que el frontend pueda leer `password_hash`, lo cual es necesario para verificar las credenciales.

## ✅ SOLUCIÓN RÁPIDA

**Ejecuta este script COMPLETO en Supabase SQL Editor:**

```sql
-- ============================================
-- CONFIGURAR RLS PARA AUTENTICACIÓN
-- Ejecutar COMPLETO en Supabase SQL Editor
-- ============================================

-- 1. Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes que puedan estar bloqueando
DROP POLICY IF EXISTS "Permitir lectura de usuarios activos para autenticación" ON usuarios;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON usuarios;
DROP POLICY IF EXISTS "Permitir autenticación" ON usuarios;
DROP POLICY IF EXISTS "Permitir lectura pública de usuarios activos" ON usuarios;
DROP POLICY IF EXISTS "Acudientes pueden ver su propio perfil" ON acudientes;
DROP POLICY IF EXISTS "Acudientes pueden actualizar su perfil" ON acudientes;
DROP POLICY IF EXISTS "Permitir lectura de acudientes activos" ON acudientes;

-- 3. Crear políticas que PERMITAN autenticación
-- Para usuarios
CREATE POLICY "Permitir lectura de usuarios activos para autenticación"
ON usuarios FOR SELECT
USING (activo = true);

CREATE POLICY "Permitir actualización de contraseña"
ON usuarios FOR UPDATE
USING (activo = true)
WITH CHECK (activo = true);

-- Para acudientes
CREATE POLICY "Permitir lectura de acudientes activos para autenticación"
ON acudientes FOR SELECT
USING (activo = true);

CREATE POLICY "Permitir actualización de acudientes"
ON acudientes FOR UPDATE
USING (activo = true)
WITH CHECK (activo = true);

-- 4. Verificar que funciona
SELECT 
  codigo_estudiante,
  email,
  CASE 
    WHEN password_hash IS NOT NULL THEN '✅ Tiene password_hash'
    ELSE '❌ Sin password_hash'
  END as estado
FROM usuarios
WHERE codigo_estudiante = 'EST0046'
  AND activo = true;
```

## 🎯 DESPUÉS DE EJECUTAR EL SCRIPT

1. **Recarga la página de login** (Ctrl+F5)
2. **Intenta login con Emily**:
   - Email: `constanza.robles@seminariopalmira.edu.co`
   - Contraseña: `123456`

## 📝 ¿Por Qué Este Script Funciona?

Este script:
- ✅ **Permite lectura** de usuarios activos (incluyendo `password_hash`)
- ✅ **Permite actualización** para cambio de contraseña
- ✅ **Funciona para usuarios y acudientes**
- ✅ **Es simple y directo** - sin complicaciones

## ⚠️ IMPORTANTE

Este script es **permisivo** para desarrollo. En producción podrías querer restringir más, pero por ahora **necesitas esto para que funcione la autenticación**.

---

**Ejecuta el script SQL y el login debería funcionar inmediatamente.** ✅
