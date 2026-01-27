# HSCMM KNOWLEDGE BASE

**Context:** Human-supervised Context Management (HSCMM)

## OVERVIEW
The passive context control layer allowing users to manually visualize, snapshot, and modify the AI's context window.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| **Transformation** | `transformer.ts` | Modifies the context sent to the LLM |
| **Storage** | `storage.ts` | Handles saving/loading context snapshots |
| **Entry** | `index.ts` | Module setup and command registration |

## CONVENTIONS
- **Explicit Control**: No magic. Files are added/ignored only when explicitly requested (or via config).
- **Transparency**: The user must always be able to see exactly what is in the context via `/ctx status`.
- **Stateless Transformation**: `transformer.ts` should be pure functions where possible.

## ANTI-PATTERNS
- **Hidden Context**: Never inject context that isn't visible in `/ctx status`.
- **Over-Aggressive Cleanup**: Do not remove files from context unless they match an ignore pattern or user command.
