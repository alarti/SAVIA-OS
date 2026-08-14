#!/usr/bin/env bash
# ==============================================================================
# SAVIA-OS Development Continuous Synchronization Script
# Autor: Alberto Arce & SAVIA-OS Engineering Team
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}    🔄 SAVIA-OS Local Team Continuous Sync Utility    ${NC}"
echo -e "${BLUE}======================================================${NC}"

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "📍 Rama actual: ${YELLOW}${CURRENT_BRANCH}${NC}"

# 1. Comprobar cambios sin commitear
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️ Tienes cambios locales sin commitear.${NC}"
  read -p "¿Deseas hacer stash automático de tus cambios? (s/n): " STASH_RESP
  if [[ "$STASH_RESP" == "s" || "$STASH_RESP" == "S" ]]; then
    echo -e "📦 Guardando en stash..."
    git stash push -m "dev-sync-auto-stash-$(date +%s)"
    STASHED=true
  else
    echo -e "${RED}❌ Abortando sincronización para evitar pérdida de trabajo.${NC}"
    exit 1
  fi
fi

# 2. Fetch de ramas remotas
echo -e "\n${BLUE}📥 Obteniendo cambios del repositorio remoto (git fetch)...${NC}"
git fetch origin main

# 3. Rebase o Pull según la rama
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo -e "${BLUE}⬇️ Actualizando 'main' local desde 'origin/main'...${NC}"
  git pull --ff-only origin main
else
  echo -e "${BLUE}🔀 Aplicando rebase de 'feature' sobre 'origin/main'...${NC}"
  git rebase origin/main
fi

# 4. Restaurar stash si se hizo
if [ "$STASHED" = true ]; then
  echo -e "\n📦 Restaurando tus cambios locales del stash..."
  git stash pop || echo -e "${YELLOW}⚠️ Revisa posibles conflictos en tu espacio de trabajo.${NC}"
fi

# 5. Comprobar dependencias
echo -e "\n${BLUE}🔍 Verificando dependencias npm...${NC}"
npm install

# 6. Ejecutar linter rápido de sanidad
echo -e "\n${BLUE}🧪 Ejecutando comprobación de tipos TypeScript (npm run lint)...${NC}"
npm run lint

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}    ✅ Entorno sincronizado y verificado con éxito!    ${NC}"
echo -e "${GREEN}    Listo para codificar en SAVIA-OS con tu equipo.   ${NC}"
echo -e "${GREEN}======================================================${NC}"
