# Security Patterns

## Golden Rule
Never trust user input. Never expose secrets. Always validate at boundaries.

## Critical Rules

### 🔴 NEVER Do These

- ❌ Hardcode secrets, API keys, passwords, or tokens in source code
- ❌ Log sensitive data (passwords, tokens, PII) even in error logs
- ❌ Construct file paths from user input without containment checks
- ❌ Use `eval()`, `exec()`, or `pickle.load()` on untrusted data
- ❌ Disable CSRF protection or skip auth checks "for now"
- ❌ Expose internal error details (stack traces, db queries) to users
- ❌ Run shell commands with unsanitized user input

### ✅ ALWAYS Do These

- ✅ Use environment variables (`os.environ`) or a secrets manager for credentials
- ✅ Validate and sanitize ALL user input at every API boundary
- ✅ Use parameterized queries for database operations (no string concatenation)
- ✅ Apply principle of least privilege — give code only the permissions it needs
- ✅ Use output encoding/escaping when rendering user-provided content
- ✅ Add rate limiting to authentication endpoints
- ✅ Log security events (auth failures, permission denials) with context

## File System Safety

User-controlled file paths are a path traversal attack vector. Follow this pattern:

```python
import os
from pathlib import Path

# ✅ Safe: fixed base directory, resolved, containment check
ALLOWED_DIR = Path("/data/uploads").resolve()

def safe_path(user_input: str) -> Path:
    """Resolve a user-provided filename against the allowed directory."""
    candidate = (ALLOWED_DIR / user_input).resolve()
    # Guard: must be within allowed directory
    if not str(candidate).startswith(str(ALLOWED_DIR)):
        raise PermissionError("Path traversal detected")
    return candidate
```

## API Security Checklist

Every API endpoint should gate:

- [ ] Authentication: is the caller who they say they are?
- [ ] Authorization: does the caller have permission for this action?
- [ ] Input validation: is the data well-formed and safe?
- [ ] Rate limiting: is the caller within allowed frequency?
- [ ] Output sanitization: is the response free of sensitive data?
- [ ] Logging: are security-relevant events recorded?

## Secrets Management

```python
import os

# ✅ Environment variables (never hardcoded)
API_KEY = os.environ.get("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY environment variable is required")

# ❌ NEVER in code:
# API_KEY = "sk-1234567890abcdef"
# DB_PASSWORD = "password123"
```

## Dependency Security

- Pin dependency versions in `requirements.txt` / `package.json`
- Regularly update dependencies to patch known vulnerabilities
- Audit dependencies for CVEs before adding them
- Minimize the dependency tree — fewer deps = fewer attack surfaces

## Before Writing Security-Critical Code

1. Read this file
2. Identify all user-controlled inputs (network requests, file paths, form fields)
3. For each input, determine: validation rules, sanitization, escape on output
4. Write authorization checks BEFORE business logic
5. Never leave a "TODO: add auth" in shipped code
