# Testing Standards

## Golden Rule
Write the test FIRST (RED), watch it fail, write the minimal code to make it pass (GREEN), then refactor (REFACTOR).

## Core Principles

- **Tests are not optional.** Every function that contains logic must have tests.
- **Test behavior, not implementation.** Tests should pass after refactoring.
- **One assertion per test concept.** If a test has multiple "why would this fail?" reasons, split it.
- **Tests are code.** Apply the same quality standards: small functions, clear naming, no duplication.

## Patterns

### ✅ Use These

- **Arrange-Act-Assert** (Given-When-Then) structure
- **Descriptive test names** — `test_[unit]_[scenario]_[expected]` or `test_[scenario]`
- **Test one thing per test** — one logical assertion per test function
- **Fixtures for setup** — share setup logic, not state between tests
- **Edge cases** — empty input, invalid input, boundary values, error conditions
- **Parameterized tests** for multiple inputs with same logic
- **Mock external dependencies** — don't hit the network in unit tests

### ❌ Avoid These

| Anti-pattern | Instead |
|-------------|---------|
| Testing implementation details | Test public behavior/API |
| Shared mutable state between tests | Fresh fixtures per test |
| Assertions in production code | Test assertions in test files |
| Tests that depend on each other | Each test is independent |
| Testing framework internals | Test your code, not the framework |
| Skipping tests to "save time" | Run the test suite; fix failures |

## Test Structure

```
tests/
├── test_module_name.py          # Unit tests mirroring source structure
├── conftest.py                  # Shared fixtures (pytest)
└── integration/                 # Integration tests
    └── test_full_pipeline.py
```

### Example (pytest)

```python
import pytest
from my_module import process_order


def test_process_order_valid_data_returns_success():
    """A valid order should process successfully."""
    result = process_order({"item": "widget", "qty": 2})
    assert result["success"] is True
    assert "order_id" in result


def test_process_order_empty_data_returns_error():
    """Empty data should return validation error, not crash."""
    result = process_order({})
    assert result["success"] is False
    assert "error" in result


class TestProcessOrder:
    """Group related tests in a class when sharing setup patterns."""

    @pytest.mark.parametrize("qty,expected", [
        (0, False),
        (-1, False),
        (100, True),
    ])
    def test_process_order_quantity_validation(self, qty, expected):
        result = process_order({"item": "widget", "qty": qty})
        assert result["success"] is expected
```

## Coverage Expectations

| Type | Minimum | Notes |
|------|---------|-------|
| Unit tests | 80%+ | Core business logic should be 100% |
| Integration | Coverage of critical paths | Happy path + key error paths |
| Edge cases | Every guard clause | Empty, invalid, boundary values |

**Not all coverage is equal.** 100% coverage on getters/setters is worthless. 80% coverage on complex business logic with all edge cases tested is excellent.

## Running Tests

```bash
# Run all tests, skip external API calls
python -m pytest -m "not external and not integration"

# Run with coverage
python -m pytest --cov=my_package --cov-report=term-missing

# Run a single test
python -m pytest tests/test_module.py::test_name -v
```

## Before Writing Tests

1. Read this file
2. Identify the behavior to test (not the implementation)
3. List the scenarios: happy path, error cases, edge cases
4. Write the test first (RED)
5. Write the minimal code to pass (GREEN)
6. Refactor if needed (REFACTOR)
