# CodeReflex - Content Authoring Pipeline

## Overview

The content authoring pipeline manages all exercises in CodeReflex. It uses a scalable file-per-category structure instead of monolithic JSON files.

## Directory Structure

```
public/content/
├── index.json                    # Global content index
├── reflex-snippets/
│   ├── javascript/
│   │   ├── fundamentals/
│   │   │   ├── index.json        # Category metadata
│   │   │   ├── variables.json    # Variables category (5 snippets)
│   │   │   ├── functions.json    # Functions category (5 snippets)
│   │   ├── intermediate/
│   │   ├── interview/
│   │   └── advanced/
│   ├── typescript/
│   └── python/
└── guided-problems/
    ├── javascript/
    │   ├── fundamentals/
    │   │   ├── index.json
    │   │   ├── array-sum.json    # Array problems
    │   ├── intermediate/
    │   ├── interview/
    │   └── advanced/
    ├── typescript/
    └── python/
```

## Why Separate Files?

### ❌ Don't Do This
```
fundamentals.json  (200+ exercises - impossible to maintain)
```

### ✅ Do This
```
fundamentals/
├── variables.json    (5 exercises)
├── functions.json    (10 exercises)
├── arrays.json       (8 exercises)
```

### Benefits:
1. **Scalable** - Add new categories without touching existing files
2. **Maintainable** - Easy to edit single topics
3. **Debuggable** - Clear which file has issues
4. **Lazy Loading** - Only load what's needed
5. **Git-friendly** - Small diffs, better collaboration

## File Formats

### Reflex Snippet (`variables.json`)
```json
{
  "category": "variables",
  "snippets": [
    {
      "id": "js-fund-rt-001",
      "title": "Declare a constant",
      "description": "Use const to declare a constant value",
      "context": "Constants are used for values that should not change",
      "codeSnippet": "const PI = 3.14159;",
      "typingStyle": "full",
      "tags": ["variables", "const"],
      "concepts": ["constants", "declaration"],
      "estimatedDuration": 15,
      "difficultyScore": 1
    }
  ]
}
```

### Guided Problem (`array-sum.json`)
```json
{
  "category": "arrays",
  "problems": [
    {
      "id": "js-fund-gp-001",
      "title": "Sum of Array Elements",
      "description": "Write a function that calculates the sum...",
      "context": "Array reduction is a common operation...",
      "starterCode": "function sumArray(numbers) {\n  // Your code here\n}",
      "solution": "function sumArray(numbers) {\n  return numbers.reduce((acc, num) => acc + num, 0);\n}",
      "explanation": "We use the reduce method...",
      "technicalNotes": [...],
      "hints": [...],
      "tests": [...],
      "tags": ["arrays", "reduce"],
      "concepts": ["array-reduce"],
      "prerequisites": ["basic-arrays"],
      "timeComplexity": "O(n)",
      "estimatedDuration": 300,
      "difficultyScore": 2
    }
  ]
}
```

## ID Conventions

Format: `{lang}-{level}-{type}-{index:03d}`

| Part | Values |
|------|--------|
| lang | `js`, `ts`, `py` |
| level | `fund` (fundamentals), `int` (intermediate), `intv` (interview), `adv` (advanced) |
| type | `rt` (reflex), `gp` (guided) |
| index | 001-999 |

Examples:
- `js-fund-rt-001` - JavaScript Fundamentals Reflex #1
- `ts-intv-gp-015` - TypeScript Interview Guided #15
- `py-adv-rt-035` - Python Advanced Reflex #35

## Content Requirements

| Language | Level | Reflex Snippets | Guided Problems |
|----------|-------|-----------------|-----------------|
| JavaScript | Fundamentals | 35+ | 35+ |
| JavaScript | Intermediate | 35+ | 35+ |
| JavaScript | Interview | 35+ | 35+ |
| JavaScript | Advanced | 35+ | 35+ |
| TypeScript | Fundamentals | 35+ | 35+ |
| TypeScript | Intermediate | 35+ | 35+ |
| TypeScript | Interview | 35+ | 35+ |
| TypeScript | Advanced | 35+ | 35+ |
| Python | Fundamentals | 35+ | 35+ |
| Python | Intermediate | 35+ | 35+ |
| Python | Interview | 35+ | 35+ |
| Python | Advanced | 35+ | 35+ |

**Total Minimum**: 840 exercises (420 per language × 2 types)

## Categories

### Reflex Snippets Categories
- variables
- operators
- strings
- arrays
- objects
- functions
- control-flow
- classes
- async
- patterns

### Guided Problems Categories
- arrays
- strings
- objects
- functions
- algorithms
- data-structures
- dynamic-programming
- graphs
- trees
- sorting

## Adding New Content

### 1. Create Category File
```bash
# Create new category file
touch public/content/reflex-snippets/javascript/fundamentals/your-topic.json
```

### 2. Add Content
```json
{
  "category": "your-topic",
  "snippets": [
    {
      "id": "js-fund-rt-XXX",
      "title": "Your Snippet",
      ...
    }
  ]
}
```

### 3. Update Index
The loader automatically discovers new files from the index.

## Content Loader

The `ContentLoader` class (`src/lib/contentLoader.ts`) handles:
- Lazy loading of category files
- Caching with TTL
- Validation via Zod schemas
- Preloading next difficulty level

```typescript
const loader = ContentLoader.getInstance();
const snippets = await loader.loadReflexSnippets('javascript', 'fundamentals');
const problems = await loader.loadGuidedProblems('javascript', 'fundamentals');
```

## Validation

All content is validated using Zod schemas:

```typescript
import { validateReflexSnippet, validateGuidedProblem } from '@/lib/contentSchema';

const snippet = validateReflexSnippet(rawData);
const problem = validateGuidedProblem(rawData);
```

## Future Expansion

- Add more languages (Go, Rust, C++)
- Add difficulty levels (expert, master)
- Add topics (machine learning, DevOps)
- Add localization support
- Add content versioning

## Scripts

```bash
# Generate IDs for new exercises
npm run content:generate-ids

# Validate all content
npm run content:validate

# Count exercises by category
npm run content:stats
```