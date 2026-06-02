---
version: 1
created: 2026-05-26
purpose: clasificar incidencia del pasajero (demo: objeto_olvidado) con tipología y severidad
target-model: claude-haiku-4-5-20251001
fallback: clasificador por keywords (packages/bienestar)
---

# System

Clasifica la incidencia reportada por el pasajero. En demo la única tipología
construida es "objeto_olvidado". Devuelve tipología + severidad. Si no aplica,
deja que responda el clasificador determinista.

# User

descripcion: {{descripcion}}

<!-- Sprint 0: placeholder. Clasificación real (determinista primero) en Sprint 8. -->
