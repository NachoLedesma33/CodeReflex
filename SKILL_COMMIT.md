# Skill: Quick Commit

This skill allows the model to stage all changes and commit them with a descriptive message in Spanish summarizing the work done.

## Execution Steps

1.  **Analyze Changes**: Run `git status` and `git diff --stat` to understand what has changed.
2.  **Generate Message**: Create a concise commit message in Spanish.
    - Format: `[Componente] Resumen breve de la acción`
    - Example: `[Content] Traducción de ejercicios y corrección de categorías`
3.  **Execute Git Commands**:
    - `git add .`
    - `git commit -m "Generated Message"`

## Usage

To invoke this skill, the user can say:
- "@antigravity usa la skill de commit"
- "@antigravity haz un commit rápido de mis cambios"
