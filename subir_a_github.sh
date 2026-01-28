#!/bin/bash
# ============================================
# Subir cambios al repositorio de GitHub
# Thinking Skills Program (TSP)
# ============================================
# Uso:
#   chmod +x subir_a_github.sh
#   ./subir_a_github.sh
# O con mensaje personalizado:
#   ./subir_a_github.sh "Descripción de los cambios"
# ============================================

set -e

# Directorio del proyecto (donde está este script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Mensaje de commit (argumento o por defecto)
COMMIT_MSG="${1:-Actualización TSP: módulos creatividad, ejercicios digitales, edición de ciclos y metas, cambio de contraseña}"

echo "============================================"
echo "  Subir cambios a GitHub - Thinking Skills Program"
echo "============================================"
echo ""

# Repo de GitHub (artifextsp/TSPV3.0)
GITHUB_REPO="https://github.com/artifextsp/TSPV3.0.git"

# 1. Comprobar que estamos en un repositorio git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "⚠️  No hay repositorio git en esta carpeta."
  echo ""
  echo "Para inicializar y conectar con tu repo en GitHub, ejecuta:"
  echo "  git init"
  echo "  git remote add origin $GITHUB_REPO"
  echo "  git branch -M main"
  echo ""
  echo "Luego vuelve a ejecutar: ./subir_a_github.sh"
  exit 1
fi

# 2. Ver estado
echo "📂 Estado del repositorio:"
git status -s
echo ""

# 3. Agregar todos los cambios
echo "➕ Agregando cambios..."
git add -A

if git diff --cached --quiet 2>/dev/null; then
  echo "✅ No hay cambios por subir (working tree limpio)."
  exit 0
fi

# 4. Hacer commit
echo "💾 Creando commit..."
git commit -m "$COMMIT_MSG"

# 5. Detectar rama por defecto
BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo "📤 Rama actual: $BRANCH"

# 6. Subir a origin
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "⚠️  No hay remoto 'origin' configurado."
  echo "   Añade uno con: git remote add origin $GITHUB_REPO"
  exit 1
fi

# Verificar si hay commits locales sin pushear
LOCAL_COMMITS=$(git rev-list --count origin/$BRANCH..HEAD 2>/dev/null || echo "0")
REMOTE_COMMITS=$(git rev-list --count HEAD..origin/$BRANCH 2>/dev/null || echo "0")

if [ "$LOCAL_COMMITS" -gt 0 ]; then
  echo "📦 Hay $LOCAL_COMMITS commit(s) local(es) sin subir"
fi

if [ "$REMOTE_COMMITS" -gt 0 ]; then
  echo "⬇️  Hay $REMOTE_COMMITS commit(s) en GitHub que no tienes localmente"
  echo "🔄 Actualizando desde GitHub primero..."
  if ! git pull --rebase origin "$BRANCH"; then
    echo ""
    echo "⚠️  Error al hacer pull. Hay conflictos o cambios incompatibles."
    echo "   Resuelve los conflictos manualmente y luego ejecuta:"
    echo "   git push origin $BRANCH"
    exit 1
  fi
  echo "✅ Actualización completada"
fi

echo "🚀 Subiendo a origin/$BRANCH..."
echo "   (Si te pide credenciales, ingresa tu usuario y token de GitHub)"
echo ""

if git push -u origin "$BRANCH" 2>/dev/null || git push origin "$BRANCH"; then
  echo ""
  echo "============================================"
  echo "  ✅ Cambios subidos correctamente a GitHub"
  echo "============================================"
else
  echo ""
  echo "❌ Error al hacer push."
  echo ""
  echo "Si te pidió credenciales y falló, prueba:"
  echo "   1. Usar SSH en lugar de HTTPS:"
  echo "      git remote set-url origin git@github.com:artifextsp/TSPV3.0.git"
  echo "      git push origin $BRANCH"
  echo ""
  echo "   2. O usar un token de acceso personal:"
  echo "      git push https://TU_TOKEN@github.com/artifextsp/TSPV3.0.git $BRANCH"
  echo ""
  echo "   3. O hacer pull primero si hay conflictos:"
  echo "      git pull --rebase origin $BRANCH"
  echo "      git push origin $BRANCH"
  echo ""
  exit 1
fi
