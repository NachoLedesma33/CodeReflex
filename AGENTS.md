<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CodeReflex - Plataforma de Entrenamiento Técnico

## Comandos disponibles
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar proyecto
- `npm run lint` - Verificar código
- `npm run typecheck` - Verificar tipos

## Estructura del Proyecto
```
code-reflex/
├── src/
│   ├── components/        # Componentes React
│   │   ├── ui/            # Componentes base (Button, Card, etc.)
│   │   ├── editor/        # Editor de código (Monaco)
│   │   ├── layout/        # Header, Sidebar, etc.
│   │   └── exercises/     # Componentes de ejercicios
│   ├── lib/              # Utilidades
│   │   ├── utils.ts       # Funciones helper (cn, generateId)
│   │   ├── exerciseRepository.ts  # Carga de ejercicios
│   │   └── exerciseSchema.ts     # Validación Zod
│   ├── stores/            # Zustand stores
│   │   ├── exerciseStore.ts  # Estado de ejercicios
│   │   ├── progressStore.ts  # Progreso (persistido)
│   │   └── uiStore.ts        # Configuración UI
│   ├── types/            # TypeScript types
│   │   └── index.ts       # Todos los tipos globales
│   ├── hooks/            # Custom hooks
│   ├── data/             # JSON de ejercicios
│   │   └── exercises/
│   │       ├── javascript/
│   │       │   ├── fundamentals/
│   │       │   │   ├── reflex.json  (35 snippets)
│   │       │   │   ├── guided.json  (35 problemas)
│   │       │   │   └── index.json
│   │       │   ├── intermediate/
│   │       │   ├── interview/
│   │       │   └── advanced/
│   │       ├── typescript/
│   │       └── python/
│   └── app/              # Next.js App Router
├── public/content/       # Contenido público
└── package.json
```

## Esquema de Ejercicios JSON

### Archivo de Reflex Snippets (reflex.json)
```typescript
{
  "language": "javascript" | "typescript" | "python",
  "level": "fundamentals" | "intermediate" | "interview" | "advanced",
  "type": "reflex-snippets",
  "snippets": [
    {
      "id": string,           // Formato: js-fund-rt-001
      "title": string,
      "description": string,
      "context": string,       // Contexto real de uso
      "codeSnippet": string,   // Código completo para typing
      "typingStyle": "full" | "fill-blanks" | "complete-function",
      "blanks": [              // Para fill-blanks
        { start, end, hint, expectedValue }
      ],
      "tags": string[],
      "concepts": string[],    // Conceptos enseñados
      "timeComplexity": string,
      "spaceComplexity": string,
      "estimatedDuration": number, // segundos
      "difficultyScore": number  // 1-10
    }
  ]
}
```

### Archivo de Guided Problems (guided.json)
```typescript
{
  "language": string,
  "level": string,
  "type": "guided-problems",
  "problems": [
    {
      "id": string,           // Formato: js-fund-gp-001
      "title": string,
      "description": string,
      "context": string,
      "starterCode": string,  // Código con huecos
      "solution": string,
      "explanation": string, // Explicación línea por línea
      "technicalNotes": [
        { id, title, description, codeExample? }
      ],
      "hints": [
        { id, text, order }
      ],
      "tests": [
        { id, input, expected, description }
      ],
      "tags": string[],
      "concepts": string[],
      "prerequisites": string[],
      "timeComplexity": string,
      "spaceComplexity": string,
      "estimatedDuration": number,
      "difficultyScore": number
    }
  ]
}
```

### Índice por Carpeta (index.json)
```typescript
{
  "language": string,
  "level": string,
  "reflexCount": number,
  "guidedCount": number,
  "totalCount": number,
  "tags": string[],
  "concepts": string[],
  "lastUpdated": string  // ISO date
}
```

## Requisitos de Contenido
- **35 reflex-snippets** por lenguaje/dificultad
- **35 guided-problems** por lenguaje/dificultad
- **12 carpetas** (3 lenguajes × 4 dificultades)
- **Total mínimo**: 1,260 ejercicios (420 por lenguaje)

## Naming Conventions
- IDs de reflex: `{lang}-{level}-rt-{index:03d}` (ej: js-fund-rt-001)
- IDs de guided: `{lang}-{level}-gp-{index:03d}` (ej: js-fund-gp-001)
- Archivos: `reflex.json`, `guided.json`, `index.json`

## Carga Dinámica
- Usar `loadExercisesByFilter(language, level)` del exerciseRepository
- Cache en memoria para evitar recargas
- Validación de schema con Zod (exerciseSchema.ts)

## Validación de Schema
```typescript
import { validateReflexSnippet, validateGuidedProblem } from '@/lib/exerciseSchema';
```

## Expansión Futura
- Agregar más lenguajes (Go, Rust, etc.)
- Agregar dificultades (expert, master)
- Agregar categorías técnicas
- Sistema de tags dinámicos