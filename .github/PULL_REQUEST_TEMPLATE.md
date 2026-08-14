## 🚀 Descripción del Cambio
<!-- Explica de forma concisa qué cambios introduce esta Pull Request y por qué son necesarios. -->

Closes #(issue_number) <!-- Opcional: vincula el issue resuelto -->

---

## 🏷️ Tipo de Cambio
- [ ] 🐛 Bug fix (corrección que no rompe compatibilidad)
- [ ] ✨ Nueva funcionalidad (adición que no rompe compatibilidad)
- [ ] 💥 Breaking change (cambio que altera interfaces o comportamiento previo)
- [ ] ⚡ Optimización de rendimiento / Refactor
- [ ] 🛡️ Mejora de seguridad / Auditoría SIEM
- [ ] 🤖 Actualización de la capa de IA / Copilot
- [ ] 📚 Documentación / Tooling / CI

---

## 🧩 Módulos Modificados
- [ ] `webos-core` (Rust / Wasm / Kernel / IPC / Security)
- [ ] `src/components/` (UI, Gestor de Ventanas, Dock)
- [ ] `src/utils/` (VFS, Red, Sesiones, Audio)
- [ ] `server.ts` / `/server/ai/` (Backend, Proxy, Gemini API)
- [ ] `.github/` / Scripts de desarrollo

---

## 🛡️ Checklist de Calidad y Seguridad para SAVIA-OS
Por favor, marca las casillas que apliquen antes de solicitar revisión:

- [ ] **Typecheck & Linter:** `npm run lint` (`tsc --noEmit`) se ejecuta con **0 errores**.
- [ ] **Build de Producción:** `npm run build` genera los bundles sin advertencias críticas.
- [ ] **Seguridad de API Keys:** No se han expuesto tokens, secretos o API keys en el código cliente.
- [ ] **Capability Security:** Si se interactúa con VFS o hardware, se respetan los permisos de rol y tokens.
- [ ] **Rendimiento React:** Se han limpiado event listeners y temporizadores en los desmontajes de componentes.
- [ ] **Conventional Commits:** Los commits siguen el formato `tipo(scope): mensaje`.

---

## 📸 Capturas de Pantalla / Demostración (si aplica)
<!-- Adjunta imágenes o GIFs mostrando la nueva funcionalidad en acción dentro del WebOS -->
