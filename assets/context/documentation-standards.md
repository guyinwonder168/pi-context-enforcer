# Documentation Standards

## Core Principles

- **Document the "why", not just the "what".** Code already tells us what it does. Docs tell us *why* it does it that way.
- **Keep docs close to the code.** Inline comments, module docstrings, function summaries.
- **Be concise.** Every sentence should earn its place. Shorter docs get read.

## Patterns

### ✅ Use These

- **Module/package docstring** at the top of every file explaining the module's purpose
- **Function/method docstrings** for public APIs (PEP 257 / JSDoc / pydoc style)
- **Inline comments for non-obvious code** — why this approach? what edge case?
- **README.md** at project root with: what, why, how to run, how to test
- **AGENTS.md or CONTEXT.md** for project-specific agent instructions
- **Changelog entries** for user-visible changes

### ❌ Avoid These

| Anti-pattern | Instead |
|-------------|---------|
| "What" comments (`# increment i`) | "Why" comments (`# skip leap years`) |
| Outdated docs | Update docs with the code change |
| Novel-length docs | Be concise; link to deeper reference |
| Docs that repeat the code | Explain intent, not implementation |
| Missing module docstring | Every file gets a one-paragraph purpose |
| No setup instructions | README must include how to build/run/test |

## Docstring Format

### Python (PEP 257 / Google style)

```python
def process_order(order_id: str, items: list[dict]) -> dict:
    """Process a customer order and return the result.

    Validates inventory, charges payment, and creates shipping label.
    Returns a dict with success status and either order data or error.

    Args:
        order_id: The unique order identifier.
        items: List of item dicts with "sku" and "qty" keys.

    Returns:
        A dict with keys: success (bool), data/error (dict/str).

    Raises:
        ValueError: If order_id is empty or items is empty.
    """
```

### JavaScript/TypeScript (JSDoc)

```typescript
/**
 * Processes a customer order.
 *
 * Validates inventory, charges payment, and creates a shipping label.
 *
 * @param orderId - The unique order identifier
 * @param items - Array of items with sku and qty
 * @returns Object with success status and data or error
 * @throws {Error} If orderId is empty or items is empty
 */
export function processOrder(orderId: string, items: Item[]): OrderResult;
```

## README Structure

```
# Project Name

Brief description (one paragraph).

## Setup

Prerequisites and installation steps.

```bash
pip install -r requirements.txt
```

## Usage

How to run the project.

## Testing

```bash
python -m pytest
```

## Configuration

Environment variables, config files.

## Project Structure

High-level directory overview (not exhaustive).

## License
```

## Before Writing Docs

1. Read this file
2. Identify the audience (developer, user, contributor)
3. Start with the "why" — what problem does this solve?
4. Include a concrete example
5. Keep it short enough that someone will actually read it
