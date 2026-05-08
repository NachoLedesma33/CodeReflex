# CodeReflex Content Taxonomy

## Overview

The taxonomy defines how exercises are organized, discovered, and recommended in CodeReflex. It enables intelligent search, personalized recommendations, and structured user progression.

---

## 1. Primary Dimensions

### 1.1 Language

```
javascript    → JS, ES6+, Node.js
typescript    → TS, type safety, interfaces
python        → Python 3.x, standard library
```

**Implications:**
- Syntax highlighting in editor
- Code snippets in exercises
- Validation logic
- Available libraries

### 1.2 Difficulty Level

| Level | Description | Target Users | Example Skills |
|-------|-------------|---------------|----------------|
| fundamentals | Core concepts, syntax basics | Beginners | variables, loops, functions |
| intermediate | Practical problems, patterns | Junior devs | array methods, async, classes |
| interview | Common interview questions | Mid-level prep | algorithms, data structures |
| advanced | Complex systems, optimizations | Senior prep | performance, scalability |

### 1.3 Technical Category

```
PRIMARY CATEGORIES (for reflex-snippets):
├── variables        → const, let, scope
├── operators        → arithmetic, logical, bitwise
├── strings          → methods, templates, regex
├── arrays           → map, filter, reduce, find
├── objects          → properties, methods, cloning
├── functions        → declaration, arrow, closures
├── control-flow     → if/else, switch, loops
├── classes          → OOP, inheritance, static
├── async            → promises, async/await, callbacks
└── patterns         → common patterns, idioms

GUIDED PROBLEM CATEGORIES (for guided-problems):
├── arrays           → manipulation, searching, sorting
├── strings          → parsing, transformation, regex
├── objects          → manipulation, traversal, nested
├── functions        → recursion, higher-order, composition
├── algorithms       → searching, sorting, optimization
├── data-structures  → linked lists, stacks, queues, trees
├── dynamic-programming → memoization, bottom-up
├── graphs           → BFS, DFS, shortest path
├── trees            → BST, traversal, balancing
└── sorting          → comparison, counting, divide-conquer
```

### 1.4 Pattern

```
ALGORITHMIC PATTERNS:
├── sliding-window   → fixed/variable window
├── two-pointers     → opposite directions, same direction
├── fast-slow        → cycle detection
├── divide-conquer   → split, solve, merge
├── backtracking     → explore, undo, prune
├── greedy           → local optimal, global optimal
└── dynamic-programming → state transitions

CODING PATTERNS:
├── factory          → object creation
├── observer         → event handling
├── singleton        → single instance
├── decorator        → extension
├── strategy         → interchangeable algorithms
└── middleware       → processing pipeline
```

### 1.5 Complexity

```
TIME COMPLEXITY:
O(1)        → constant
O(log n)    → logarithmic
O(n)        → linear
O(n log n)  → linearithmic
O(n²)       → quadratic
O(2ⁿ)       → exponential

SPACE COMPLEXITY:
S(1)        → constant
S(n)        → linear
S(n²)       → quadratic
S(log n)    → logarithmic (recursion stack)
```

### 1.6 Paradigm

```
→ imperative       → step-by-step instructions
→ object-oriented  → classes, objects, inheritance
→ functional       → pure functions, immutability
→ declarative      → describe what, not how
→ event-driven     → handlers, listeners
→ asynchronous     → callbacks, promises, async
```

---

## 2. Secondary Dimensions

### 2.1 Tags (Flat)

```
Tags describe specific technologies or concepts:

#language:     javascript, typescript, python
#concept:       recursion, memoization, closure
#api:           map, filter, reduce, fetch
#tool:          node, webpack, jest
#topic:         testing, debugging, performance
#difficulty:    easy, medium, hard (granular)
```

### 2.2 Concepts (Hierarchical)

```
JavaScript
├── Fundamentals
│   ├── Variables & Types
│   ├── Operators
│   ├── Control Flow
│   └── Functions Basics
├── Intermediate
│   ├── Array Methods
│   ├── Object Manipulation
│   ├── Classes
│   └── Async Basics
├── Advanced
│   ├── Design Patterns
│   ├── Performance
│   └── Testing
│
TypeScript
├── Type System
├── Generics
├── Utility Types
└── Advanced Patterns
│
Python
├── Basics
├── Data Structures
├── OOP
└── Functional
```

### 2.3 Prerequisites

```
Prerequisites form a dependency graph:

example-exercise:
  prerequisites:
    - arrays-basics
    - loops
    - functions

The user must complete prerequisites before unlocking.
```

### 2.4 Concepts Taught

```
Each exercise teaches specific concepts:

exercise:
  title: "Map Array to Double Values"
  concepts:
    - array-map
    - arrow-functions
    - immutability

These concepts are added to user profile on completion.
```

---

## 3. Search & Filtering

### 3.1 Search Algorithm

```
search(query) → filters by:
├── exact-match     → id, title
├── fuzzy-match     → description, context
├── tag-match       → #tag search
├── concept-match    → concept search
├── language-filter  → "in javascript"
├── difficulty-filter → "fundamentals"
└── composite       → "arrays in js fundamentals"
```

### 3.2 Filter Presets

```
QUICK FILTERS:
├── "Arrays"         → category: arrays
├── "Async"          → category: async
├── "Easy"           → difficulty: 1-3
├── "Interview Prep" → level: interview
└── "My Favorites"  → isFavorite: true
```

---

## 4. Recommendations Engine

### 4.1 Recommendation Types

```
CONTENT-BASED:
├── "Similar exercises"    → same category/concepts
├── "Next in series"       → sequential progression
├── "Same difficulty"      → same level
└── "Common patterns"     → same patterns

COLLABORATIVE:
├── "Popular in your level"   → completed by others at same level
├── "Trending"                → recently popular
└── "Recommended by users"   → positive feedback correlation

USER-BASED:
├── "Based on your progress"   → fill gaps in knowledge
├── "Review weak areas"       → low accuracy concepts
└── "Challenge yourself"     → slightly above current level
```

### 4.2 Recommendation Score

```
score(exercise, user) = Σ
├── relevance(categoryMatch) × 0.3
├── difficulty(difficultyMatch) × 0.2
├── freshness(newExercises) × 0.1
├── popularity(completionRate) × 0.1
├── prerequisite(readyToUnlock) × 0.2
└── diversity(differentCategories) × 0.1
```

---

## 5. Related Exercises

### 5.1 Relationship Types

```
PREREQUISITE:
  exercise A → must complete before → exercise B

SAME CATEGORY:
  exercise A → similar category → exercise B

SAME CONCEPTS:
  exercise A → shares concepts → exercise B

SAME PATTERN:
  exercise A → uses same pattern → exercise B

CONTINUATION:
  exercise A → part 1 of → exercise B (e.g., sum → product)
```

### 5.2 Exercise Graph

```
The exercise graph enables:

1. Linear progression (prerequisites)
2. Lateral movement (same difficulty, different category)
3. Deep dive (same category, higher difficulty)
4. Cross-training (different categories, same concepts)

Example path:
variables (fund) → arrays (fund) → arrays (int) → algorithms (int)
```

---

## 6. User Progression

### 6.1 Learning Path

```
LEVEL PROGRESSION:

fundamentals (0-100 XP)
├── Complete 10 reflex snippets
├── Complete 5 guided problems
└── Pass with 90% accuracy → unlock intermediate

intermediate (100-300 XP)
├── Master array methods
├── Async/await patterns
└── Pass challenge → unlock interview

interview (300-600 XP)
├── Common algorithms
├── Data structures
└── Mock interviews → unlock advanced

advanced (600+ XP)
├── Optimization
├── System design
└── Real-world problems
```

### 6.2 Skill Tree

```
Each category becomes a skill node:

arrays:
  ├─ fundamentals (5 exercises) ✓
  ├─ intermediate (10 exercises) ○
  └─ advanced (8 exercises) ○

Progress unlocks:
- New categories
- Harder difficulties
- Achievement badges
```

### 6.3 Unlock Criteria

```
CATEGORY UNLOCK:
├── Previous category completed (80%)
└── Minimum XP threshold

DIFFICULTY UNLOCK:
├── Previous difficulty mastered (90% accuracy)
└── Minimum exercises completed

CONTENT UNLOCK:
├── Prerequisites met
├── Streak maintained
└── XP threshold reached
```

---

## 7. Automatic Content Generation

### 7.1 Taxonomy-Driven Generation

```
The taxonomy guides content generation:

1. CATEGORY TEMPLATE
   ├── inputs: category, difficulty, language
   ├── outputs: exercise structure
   └── validates: matches taxonomy schema

2. CONCEPT COMBINATION
   ├── concept A + concept B = new exercise
   ├── difficulty determined by complexity
   └── tags auto-generated

3. VARIATION GENERATION
   ├── same pattern, different inputs
   ├── same concepts, different language
   └── difficulty scaling
```

### 7.2 Generation Rules

```
RULES:
├── Each category needs minimum 35 exercises
├── Each difficulty needs 35 exercises per language
├── Exercise must have prerequisites or be fundamentals
├── Tests must cover edge cases
├── Hints must be progressive (3 hints minimum)
└── Time/space complexity required for guided problems
```

### 7.3 Quality Assurance

```
VALIDATION:
├── Schema validation (Zod)
├── Duplicate detection (similarity score)
├── Difficulty calibration (tested accuracy)
├── Completeness (all fields required)
└── Consistency (same format, naming)

THRESHOLDS:
├── Max 5% duplicate similarity
├── Difficulty ±1 from target
├── All tags must exist in taxonomy
└── Tests must pass solution code
```

---

## 8. API Reference

### 8.1 Taxonomy Types

```typescript
interface TaxonomyNode {
  id: string;
  name: string;
  type: 'language' | 'level' | 'category' | 'pattern' | 'paradigm';
  parent?: string;
  children?: string[];
  metadata?: Record<string, unknown>;
}

interface ExerciseTaxonomy {
  language: Language;
  level: DifficultyLevel;
  category: string;
  pattern?: string;
  tags: string[];
  concepts: string[];
  prerequisites: string[];
  timeComplexity?: string;
  spaceComplexity?: string;
  paradigm?: string[];
}
```

### 8.2 Query Interface

```typescript
// Search with taxonomy
findExercises({
  language: 'javascript',
  level: 'intermediate',
  category: 'arrays',
  concepts: ['map', 'immutability'],
  tags: ['performance'],
});

// Get recommendations
getRecommendations(userId, {
  limit: 10,
  include: ['similar', 'next-difficulty', 'review-weak'],
});

// Get progression path
getLearningPath(userId, {
  target: 'advanced',
  category: 'algorithms',
});
```

---

## 9. Summary

| Dimension | Purpose | Impact |
|-----------|---------|--------|
| Language | Syntax/validation | Editor config, code snippets |
| Difficulty | Progression gate | Unlock criteria |
| Category | Organization | Sidebar, search |
| Pattern | Skill grouping | Recommendations |
| Complexity | Performance tracking | Stats display |
| Paradigm | Thinking style | Content variety |

The taxonomy enables:
- **Intelligent Search**: Multi-dimensional filtering
- **Personalized Recommendations**: User-based + content-based
- **Related Exercises**: Prerequisite graph + similarity
- **Structured Progression**: Skill trees + unlock gates
- **Automated Generation**: Template-driven + validation

This creates a cohesive learning experience where users can navigate through structured paths or explore freely based on their interests and goals.