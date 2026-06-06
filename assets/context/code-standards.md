# Code Standards

## Golden Rule
If you can't easily test it, refactor it.

## Core Principles

**Modular:** Small, focused, composable units. Single responsibility per module.
**Simple:** No premature abstraction. Solve today's problem, not tomorrow's hypothetical.
**Explicit:** Dependencies are visible, errors are handled, intent is clear.

## Patterns

### ✅ Use These

- **Pure functions** where possible — same input = same output, no side effects
- **Small functions** — ideally < 30 lines, never > 50
- **Early returns** — avoid deep nesting (max 2 levels)
- **Explicit error handling** — catch specific errors, return meaningful messages
- **Dependency injection** — pass dependencies explicitly, not via imports/globals
- **Immutability** — create new data, don't modify existing structures
- **[Language-appropriate] typing** — use the type system to make invalid states unrepresentable

### ❌ Avoid These

| Anti-pattern | Instead |
|-------------|---------|
| Mutation in place | Create new objects/values |
| Deep nesting (3+) | Early returns, guard clauses |
| God functions (>50 lines) | Break into focused helpers |
| Hidden dependencies | Dependency injection |
| Global state | Pass state explicitly |
| Premature abstraction | Duplicate until pattern emerges (rule of three) |
| Side effects in pure functions | Separate pure logic from I/O |

## Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Files | lowercase-with-hyphens | `user-service.py` |
| Functions | snake_case (Python) / camelCase (JS/TS) | `get_user()`, `validateEmail()` |
| Classes | PascalCase | `UserService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Predicates | is/has/can prefix | `is_valid()`, `has_permission()` |

## Error Handling

```python
# ✅ Explicit error handling
def parse_config(text: str) -> dict:
    try:
        return {"success": True, "data": json.loads(text)}
    except json.JSONDecodeError as e:
        return {"success": False, "error": str(e)}

# ✅ Validate at boundaries
def create_user(data: dict) -> dict:
    errors = validate_user_data(data)
    if errors:
        return {"success": False, "errors": errors}
    return {"success": True, "user": save_user(data)}
```

## File Structure

```
module/
├── __init__.py        # Public interface (re-exports)
├── core.py            # Core logic (pure functions)
├── models.py          # Data models / types
├── service.py         # Business logic with side effects
└── test_module.py     # Tests mirroring source
```

## Before Writing Code

1. Read this file if you haven't already
2. Check project `AGENTS.md` for project-specific conventions
3. If using external libraries, fetch current docs
4. Write the simplest thing that works
5. Refactor only when a clear pattern emerges (rule of three)
