# CodeReflex

Plataforma de entrenamiento técnico interactiva para desarrolladores. Combina **Reflex Typing** (speed typing de código) con **Guided Problems** (resolución guiada de problemas) para mejorar velocidad, precisión y habilidades de programación.

---

## Características

### Reflex Typing
- Escribe fragmentos de código reales lo más rápido y preciso posible
- **Auto-start**: comienza a escribir y el temporizador arranca automáticamente
- **Ghost text**: panel lateral con el código de referencia formateado
- **Validación en tiempo real**: caracteres correctos en verde, errores en rojo
- **Métricas**: WPM, precisión (%), tiempo, errores, correcciones
- **Modal de completado**: backdrop blur con resumen de métricas y opciones (siguiente/anterior/reintentar)
- Sin auto-completado, sin suggestions, sin bracket matching
- Modalidades: `full` (escribir todo), `fill-blanks` (completar huecos), `complete-function` (completar función)

### Guided Problems
- Problemas de programación con flujo guiado: leer → codificar → probar → completar
- Editor Monaco integrado para escribir soluciones
- Ejecución simulada de tests con resultados pass/fail
- Pistas progresivas, notas técnicas, explicación línea por línea
- Métricas de tiempo y precisión

### 4 Lenguajes Soportados
- JavaScript, TypeScript, Python, Java

### 4 Niveles de Dificultad
- **Fundamentals** — conceptos básicos y sintaxis
- **Intermediate** — patrones de uso común
- **Interview** — problemas típicos de entrevistas técnicas
- **Advanced** — temas complejos y optimización

### Sistema de Progreso y Gamificación
- **XP y niveles**: 10 niveles (Novato → Divine) con 29 logros
- **Categorías**: volumen, velocidad, precisión, rachas, lenguaje, especiales
- **Rachas**: seguimiento de días consecutivos de práctica
- **Estadísticas detalladas**: heatmap de errores, tendencias semanales/mensuales, rendimiento por lenguaje
- **Estadísticas por ejercicio**: intentos, mejor WPM, mejor precisión, tiempo promedio
- **Recomendaciones inteligentes**: ejercicios sugeridos basados en áreas débiles

### Editor de Código (Monaco Editor)
- Temas dark/light personalizados
- Selección de fuente: Monaco, Fira Code, JetBrains Mono
- Tamaño de fuente, line height, tab size configurables
- Toggle: line numbers, minimap, word wrap, highlight active line
- Sin auto-completado ni asistencias en modo reflex

### Interfaz
- Sidebar colapsable con filtros (lenguaje, dificultad, categoría, modo)
- Búsqueda de ejercicios por texto
- Favoritos por ejercicio
- Panel de estadísticas con heatmap de actividad (12 meses)
- Atajos de teclado
- Panel de ajustes completo
- **Zen Mode**: modo focus que oculta sidebars y maximiza el editor

### Sonido
- Sonidos de tecleo, error y completado (toggle por tipo, volumen ajustable)

### Persistencia
- Todo el progreso se guarda en localStorage
- Configuración de UI persistida (tema, preferencias del editor, layout)

---

## Stack Técnico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Editor**: Monaco Editor via `@monaco-editor/react`
- **Estado**: Zustand con persistencia (progress, UI)
- **Estilos**: Tailwind CSS v4
- **Validación**: Zod
- **Iconos**: Lucide React
- **Fuentes**: Inter + JetBrains Mono (via `next/font`)

---

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run content:generate` | Generar contenido de ejercicios |
| `npm run content:validate` | Validar JSONs de ejercicios |
| `npm run content:stats` | Estadísticas del contenido |
| `npm run commit` | Commit rápido con mensaje automático |

---

## Estructura del Proyecto

```
src/
├── app/                  # App Router (Next.js 16)
├── components/
│   ├── editor/           # CodeEditor (Monaco)
│   ├── exercises/        # ReflexTyping, GuidedProblem, etc.
│   ├── layout/           # Header, Sidebar, StatsPanel
│   └── ui/               # Button, Card, LanguageIcon
├── hooks/
│   ├── useTypingValidator.ts   # Validación de typing en tiempo real
│   └── useGhostText.ts         # Ghost text y autocomplete
├── lib/
│   ├── utils.ts                # Utilidades (cn, normalizeCode, etc.)
│   ├── contentLoader.ts        # Carga singleton de contenido
│   ├── contentSchema.ts        # Zod schemas para public/content
│   ├── exerciseSchema.ts       # Zod schemas para src/data
│   ├── exerciseRepository.ts   # Loader alternativo con filtros
│   ├── initialization.ts       # Hooks de bootstrap
│   ├── achievements.ts         # Engine de gamificación (29 logros)
│   ├── statsCalculator.ts      # Estadísticas avanzadas
│   └── diffChecker.ts          # Comparación de código
├── stores/
│   ├── exerciseStore.ts        # Estado de ejercicios y filtros
│   ├── progressStore.ts        # Progreso del usuario (persistido)
│   └── uiStore.ts              # Configuración UI (persistida)
└── types/
    └── index.ts                # Todos los tipos globales

public/content/                 # JSONs de ejercicios servidos estáticamente
src/data/exercises/             # JSONs de ejercicios empaquetados
```

---

## Estructura de Contenido

Los ejercicios se organizan por lenguaje y nivel en JSON:

```
public/content/reflex/{language}/{level}{suffix}.json
```

Suffix mapping: javascript → `JS`, typescript → `TS`, python → `PY`, java → `JV`

Cada archivo contiene un array de snippets con:
- `id`, `title`, `description`, `context` (uso real)
- `codeSnippet`, `typingStyle`, `blanks` (para fill-blanks)
- `tags`, `concepts`, `timeComplexity`, `spaceComplexity`
- `estimatedDuration`, `difficultyScore`

### Convención de IDs
- Reflex: `{lang}-{level}-rt-{001..035}` (ej: `js-fund-rt-001`)
- Guided: `{lang}-{level}-gp-{001..035}` (ej: `ts-int-gp-015`)

---

## Deploy

Compatible con Vercel. Conectá el repositorio y Vercel detecta Next.js automáticamente.

---

## Licencia

MIT
