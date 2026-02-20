# Contributing to Agent Platform SDK

Thank you for your interest in contributing.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/agent-platform/agent-platform-sdk.git
cd agent-platform-sdk

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Lint
pip install ruff
ruff check agent_platform/ tests/

# Type check
mypy agent_platform/ --ignore-missing-imports
```

## Running Locally

```bash
# Start the control plane
python -m agent_platform.main_control

# Run the quickstart example
python examples/quickstart.py

# With Docker
docker-compose up
```

## Pull Request Process

1. Fork the repository and create a feature branch from `master`.
2. Write tests for new functionality. All tests must pass.
3. Run `ruff check` and `mypy` — no new warnings.
4. Update CHANGELOG.md with your changes.
5. Submit a pull request with a clear description of what changed and why.

## Code Style

- Python 3.11+ with type hints on all public APIs.
- Use `ruff` for formatting and linting.
- Prefer synchronous code in the hot path. Avoid `asyncio.new_event_loop()` patterns.
- All services must be thread-safe (use `threading.RLock` for mutable state).
- Follow the existing `Store[T]` interface pattern for new backends.

## Reporting Issues

Open an issue on GitHub with:
- Steps to reproduce
- Expected vs actual behavior
- Python version and OS
