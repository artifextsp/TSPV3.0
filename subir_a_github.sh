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

echo "🚀 Subiendo a origin/$BRANCH..."
if git push -u origin "$BRANCH" 2>/dev/null || git push origin "$BRANCH"; then
  echo ""
  echo "============================================"
  echo "  ✅ Cambios subidos correctamente a GitHub"
  echo "============================================"
else
  echo ""
  echo "❌ Error al hacer push. Posibles causas:"
  echo "   - No hay conexión a internet"
  echo "   - No tienes permisos en el repo remoto"
  echo "   - La rama remota tiene commits que no tienes (prueba: git pull --rebase origin $BRANCH && git push origin $BRANCH)"
  exit 1
fi
